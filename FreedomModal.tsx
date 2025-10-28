import React from 'react';
import { StarIcon } from './components/icons';

interface FreedomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FreedomModal: React.FC<FreedomModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-primary w-full max-w-md shadow-2xl p-8 m-4 animate-slide-in-up text-center" onClick={e => e.stopPropagation()}>
                <div className="relative">
                     <div className="absolute -inset-2 animate-pulse-fast">
                        <div className="w-full h-full bg-yellow-400 rounded-full blur-2xl opacity-30"></div>
                    </div>
                    <StarIcon className="w-20 h-20 text-yellow-400 mx-auto relative" />
                </div>
                
                <h1 className="text-3xl font-bold text-white mt-6">Congratulations!</h1>
                <h2 className="text-xl font-semibold text-cosmic-primary mt-1">You've Achieved Financial Freedom!</h2>
                
                <p className="text-cosmic-text-secondary mt-4">
                    Your passive income now exceeds your expenses. You have successfully escaped the simulation and won your match in the Cosmic Tournament!
                </p>
                
                <button 
                    onClick={onClose}
                    className="w-full mt-8 bg-gradient-to-r from-cosmic-secondary to-cosmic-primary text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-shadow"
                >
                    Continue to the Fast Track
                </button>
            </div>
        </div>
    );
};

export default FreedomModal;