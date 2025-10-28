import React, { useState } from 'react';
import type { CosmicEvent, EventChoice, EventOutcome } from '../types';
import { XIcon, SparklesIcon } from './icons';

interface CosmicEventModalProps {
    isOpen: boolean;
    isGenerating: boolean;
    event: CosmicEvent | null;
    onClose: () => void;
    onResolve: (outcome: EventOutcome) => void;
}

export const CosmicEventModal: React.FC<CosmicEventModalProps> = ({ isOpen, isGenerating, event, onClose, onResolve }) => {
    const [result, setResult] = useState<EventOutcome | null>(null);

    if (!isOpen) return null;

    const handleChoiceClick = (choice: EventChoice) => {
        setResult(choice.outcome);
    };

    const handleClose = () => {
        if(result) {
            onResolve(result);
        }
        setResult(null);
        onClose();
    };

    const renderGeneratingView = () => (
        <div className="text-center p-8">
            <SparklesIcon className="w-16 h-16 text-cosmic-primary mx-auto animate-pulse-fast" />
            <h2 className="text-2xl font-bold text-cosmic-text-primary mt-4">Exploring the Cosmos...</h2>
            <p className="text-cosmic-text-secondary mt-2">Contacting deep space for opportunities...</p>
        </div>
    );
    
    const renderResultView = () => (
         <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-cosmic-text-primary mb-4">Outcome</h2>
            <p className="text-cosmic-text-secondary text-lg mb-6">{result?.message}</p>
            <button onClick={handleClose} className="w-full px-4 py-3 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400 transition-colors">
                Awesome!
            </button>
        </div>
    );

    const renderEventView = () => (
        event && (
            <>
                <div className="text-center p-8 border-b border-cosmic-border">
                    <SparklesIcon className="w-12 h-12 text-cosmic-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">{event.title}</h2>
                    <p className="text-cosmic-text-secondary mt-2">{event.description}</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.choices.map((choice, index) => (
                        <button 
                            key={index} 
                            onClick={() => handleChoiceClick(choice)}
                            className="w-full p-4 bg-cosmic-surface rounded-lg border border-cosmic-border hover:border-cosmic-primary hover:bg-cosmic-bg transition-all text-left"
                        >
                            <p className="font-bold text-cosmic-text-primary">{choice.text}</p>
                            <p className="text-sm text-cosmic-text-secondary mt-1">{choice.outcome.message}</p>
                        </button>
                    ))}
                </div>
            </>
        )
    );

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={handleClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-lg shadow-2xl m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                {isGenerating ? renderGeneratingView() : (result ? renderResultView() : renderEventView())}
            </div>
        </div>
    );
};