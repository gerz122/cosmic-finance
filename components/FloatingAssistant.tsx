import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as geminiService from '../services/geminiService';
// FIX: Removed non-exported member 'LiveSession' from import.
import type { LiveServerMessage } from '@google/genai';
import { CoachIcon, XIcon, MicrophoneIcon } from './icons';

interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
}

export const FloatingAssistant: React.FC<{ user: User }> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<Message[]>([]);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
    
    // Transcription state
    const [currentUserTranscription, setCurrentUserTranscription] = useState('');
    const [currentAiTranscription, setCurrentAiTranscription] = useState('');

    // Draggable state
    const [position, setPosition] = useState({ x: 24, y: 24 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

    // FIX: Updated type to use 'any' as 'LiveSession' is not an exported member.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const assistantRef = useRef<HTMLDivElement>(null);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [history, currentUserTranscription, currentAiTranscription]);
    
    // Draggable handlers
    const onDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setDragStartPos({
            x: e.clientX - position.x,
            y: e.clientY + position.y,
        });
        document.body.style.userSelect = 'none';
    };

    const onDragMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragStartPos.x;
        const newY = dragStartPos.y - e.clientY;
        
        // FIX: Added space between 'const' and variable name.
        const maxX = window.innerWidth - (assistantRef.current?.offsetWidth || 360);
        // FIX: Added space between 'const' and variable name.
        const maxY = window.innerHeight - (assistantRef.current?.offsetHeight || 500);

        setPosition({
            x: Math.max(24, Math.min(newX, maxX - 24)),
            y: Math.max(24, Math.min(newY, maxY - 24)),
        });
    }, [isDragging, dragStartPos.x, dragStartPos.y]);

    const onDragEnd = useCallback(() => {
        setIsDragging(false);
        document.body.style.userSelect = 'auto';
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onDragMove);
            window.addEventListener('mouseup', onDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
        };
    }, [isDragging, onDragMove, onDragEnd]);


    const cleanup = useCallback(() => {
        console.log("Cleaning up assistant resources...");
        sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
        sessionPromiseRef.current = null;
        
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();

        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close().catch(console.error);
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close().catch(console.error);

        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        mediaStreamSourceRef.current = null;
        scriptProcessorRef.current = null;

        nextStartTimeRef.current = 0;
        setStatus('idle');
        setCurrentUserTranscription('');
        setCurrentAiTranscription('');
    }, []);

    const handleConnect = async () => {
        if (status !== 'idle') {
            cleanup();
            return;
        }

        setStatus('connecting');
        setHistory([]); // Clear history for new session
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

            let userInputBuffer = '';
            let aiOutputBuffer = '';

            const sessionPromise = geminiService.connectLiveAssistant({
                onopen: () => {
                    console.log('Live session opened.');
                    setStatus('listening');
                    mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = geminiService.createBlob(inputData);
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        userInputBuffer += message.serverContent.inputTranscription.text;
                        setCurrentUserTranscription(userInputBuffer);
                    }
                     if (message.serverContent?.outputTranscription) {
                        aiOutputBuffer += message.serverContent.outputTranscription.text;
                        setCurrentAiTranscription(aiOutputBuffer);
                    }
                    if (message.serverContent?.turnComplete) {
                        if (userInputBuffer.trim()) {
                            setHistory(prev => [...prev, { id: Date.now(), sender: 'user', text: userInputBuffer.trim() }]);
                        }
                        if (aiOutputBuffer.trim()) {
                            setHistory(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiOutputBuffer.trim() }]);
                        }
                        userInputBuffer = '';
                        aiOutputBuffer = '';
                        setCurrentUserTranscription('');
                        setCurrentAiTranscription('');
                    }

                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (audioData && outputAudioContextRef.current) {
                        setStatus('speaking');
                        const audioBuffer = await geminiService.decodeAudioData(geminiService.decode(audioData), outputAudioContextRef.current, 24000, 1);
                        
                        const source = outputAudioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContextRef.current.destination);

                        const currentTime = outputAudioContextRef.current.currentTime;
                        const startTime = Math.max(currentTime, nextStartTimeRef.current);
                        source.start(startTime);
                        
                        nextStartTimeRef.current = startTime + audioBuffer.duration;
                        sourcesRef.current.add(source);
                        source.onended = () => {
                            sourcesRef.current.delete(source);
                             if (sourcesRef.current.size === 0) {
                                setStatus('listening');
                            }
                        };
                    }
                },
                onerror: (e) => {
                    console.error('Live session error:', e);
                    setStatus('error');
                    setHistory(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'Sorry, a connection error occurred.' }]);
                    cleanup();
                },
                onclose: () => {
                    console.log('Live session closed.');
                    cleanup();
                },
            }, user.financialStatement, user.accounts);

            sessionPromiseRef.current = sessionPromise;

        } catch (err) {
            console.error('Failed to get user media or connect:', err);
            setStatus('error');
            setHistory(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'Could not access microphone. Please check permissions.' }]);
            cleanup();
        }
    };
    
    const getStatusText = () => {
        switch (status) {
            case 'connecting': return 'Connecting...';
            case 'listening': return 'Listening...';
            case 'speaking': return 'Speaking...';
            case 'error': return 'Error!';
            default: return 'Talk to your coach';
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-50 w-16 h-16 bg-gradient-to-br from-cosmic-primary to-cosmic-secondary rounded-full shadow-2xl flex items-center justify-center text-white transform hover:scale-110 transition-transform"
                aria-label="Open AI Assistant"
            >
                <CoachIcon className="w-8 h-8"/>
            </button>
        );
    }

    return (
        <div 
            ref={assistantRef}
            className="fixed z-50 w-[360px] h-[500px] bg-cosmic-surface rounded-2xl border border-cosmic-border shadow-2xl flex flex-col animate-slide-in-up"
            style={{ bottom: `${position.y}px`, left: `${position.x}px` }}
        >
            <header 
                onMouseDown={onDragStart}
                className="flex items-center justify-between p-3 border-b border-cosmic-border flex-shrink-0 cursor-move"
            >
                <div className="flex items-center gap-3">
                    <CoachIcon className="w-6 h-6 text-cosmic-primary"/>
                    <h2 className="font-bold text-cosmic-text-primary">Voice Assistant</h2>
                </div>
                <button onClick={() => { cleanup(); setIsOpen(false); }} className="text-cosmic-text-secondary hover:text-white cursor-pointer"><XIcon className="w-5 h-5"/></button>
            </header>
            
            <main className="flex-grow p-4 overflow-y-auto space-y-4">
                {history.map(msg => (
                     <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="w-7 h-7 rounded-full bg-cosmic-primary flex items-center justify-center flex-shrink-0"><CoachIcon className="w-4 h-4 text-white"/></div>}
                        <div className={`max-w-xs p-3 rounded-lg text-sm ${msg.sender === 'ai' ? 'bg-cosmic-bg text-cosmic-text-primary' : 'bg-cosmic-primary text-white'}`}>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {currentUserTranscription && (
                    <div className="flex items-start gap-3 justify-end opacity-70">
                        <div className="max-w-xs p-3 rounded-lg text-sm bg-cosmic-primary text-white">
                            <p>{currentUserTranscription}</p>
                        </div>
                    </div>
                )}
                 {currentAiTranscription && (
                    <div className="flex items-start gap-3 opacity-70">
                        <div className="w-7 h-7 rounded-full bg-cosmic-primary flex items-center justify-center flex-shrink-0"><CoachIcon className="w-4 h-4 text-white"/></div>
                        <div className="max-w-xs p-3 rounded-lg text-sm bg-cosmic-bg text-cosmic-text-primary">
                            <p>{currentAiTranscription}</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            
            <footer className="p-4 border-t border-cosmic-border flex-shrink-0">
                <div className="flex flex-col items-center gap-3">
                     <button
                        onClick={handleConnect}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300
                            ${status === 'listening' || status === 'speaking' ? 'bg-cosmic-danger animate-pulse-fast' : 'bg-cosmic-primary'}`
                        }
                        aria-label={status === 'idle' ? 'Start voice chat' : 'Stop voice chat'}
                    >
                        <MicrophoneIcon className="w-8 h-8 text-white"/>
                    </button>
                    <p className="text-xs text-cosmic-text-secondary h-4">{getStatusText()}</p>
                </div>
            </footer>
        </div>
    );
};
