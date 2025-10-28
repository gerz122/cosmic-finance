import React from 'react';
import { XIcon } from './icons';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-lg shadow-2xl p-4 m-4 animate-slide-in-up flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                    <h2 className="text-lg font-bold text-cosmic-text-primary">Receipt</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="overflow-auto">
                     <img src={imageUrl} alt="Transaction Receipt" className="max-w-full h-auto rounded-md" />
                </div>
            </div>
        </div>
    );
};
