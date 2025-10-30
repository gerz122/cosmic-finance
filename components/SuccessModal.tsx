import React, { useEffect } from 'react';

interface SuccessModalProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, message, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000); // Auto-close after 2 seconds
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
            <div 
                className="bg-cosmic-surface rounded-xl border border-cosmic-success w-full max-w-sm shadow-2xl p-8 m-4 text-center animate-slide-in-up" 
                onClick={e => e.stopPropagation()}
            >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cosmic-success/20 flex items-center justify-center">
                    <svg className="w-12 h-12 text-cosmic-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-cosmic-text-primary">{message}</h2>
            </div>
        </div>
    );
};

export default SuccessModal;
