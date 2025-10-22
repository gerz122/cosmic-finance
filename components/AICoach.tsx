
import React, { useState, useRef, useEffect } from 'react';
import { getFinancialAdvice } from '../services/geminiService';
import type { FinancialStatement } from '../types';
import { CoachIcon, SendIcon, StarIcon } from './icons';

interface AICoachProps {
    statement: FinancialStatement;
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

export const AICoach: React.FC<AICoachProps> = ({ statement }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Welcome to the Coach's Corner! How can we level up your financial game today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await getFinancialAdvice(input, statement);
            const aiMessage: Message = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'ai', text: "Sorry, I'm having trouble connecting to my cosmic wisdom. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };
    
    const suggestionPrompts = [
        "How can I increase my passive income?",
        "Suggest a strategy to pay off my debts faster.",
        "What's my next best 'move' to win the game?",
        "Am I spending too much on something?"
    ];

    const handleSuggestionClick = (prompt: string) => {
        setInput(prompt);
    };

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-100px)] animate-fade-in">
            <div className="p-4 border-b border-cosmic-border flex items-center gap-3">
                <CoachIcon className="w-8 h-8 text-cosmic-primary" />
                <div>
                    <h1 className="text-xl font-bold text-cosmic-text-primary">AI Financial Coach</h1>
                    <p className="text-cosmic-text-secondary">Your personal strategist for the tournament.</p>
                </div>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-cosmic-primary flex items-center justify-center flex-shrink-0"><StarIcon className="w-5 h-5 text-white"/></div>}
                        <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-cosmic-surface text-cosmic-text-primary' : 'bg-cosmic-primary text-white'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-cosmic-primary flex items-center justify-center flex-shrink-0"><StarIcon className="w-5 h-5 text-white"/></div>
                        <div className="max-w-lg p-3 rounded-lg bg-cosmic-surface text-cosmic-text-primary">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cosmic-text-secondary rounded-full animate-pulse-fast"></div>
                                <div className="w-2 h-2 bg-cosmic-text-secondary rounded-full animate-pulse-fast animation-delay-200"></div>
                                <div className="w-2 h-2 bg-cosmic-text-secondary rounded-full animate-pulse-fast animation-delay-400"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {messages.length <= 1 && (
                <div className="px-4 pb-4">
                    <p className="text-sm text-cosmic-text-secondary mb-2">Not sure what to ask? Try one of these:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestionPrompts.map(prompt => (
                            <button
                                key={prompt}
                                onClick={() => handleSuggestionClick(prompt)}
                                className="bg-cosmic-surface border border-cosmic-border text-cosmic-text-secondary text-sm px-3 py-1 rounded-full hover:bg-cosmic-border transition-colors">
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="p-4 border-t border-cosmic-border mt-auto">
                <div className="flex items-center gap-3 bg-cosmic-surface rounded-lg border border-cosmic-border focus-within:border-cosmic-primary transition-colors">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask your coach anything..."
                        className="w-full bg-transparent p-3 text-cosmic-text-primary focus:outline-none"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || input.trim() === ''} className="p-3 text-cosmic-primary disabled:text-cosmic-text-secondary disabled:cursor-not-allowed">
                        <SendIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
