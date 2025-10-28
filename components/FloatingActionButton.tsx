import React from 'react';
import { PlusIcon, XIcon, CreditCardIcon, TeamsIcon } from './icons';

interface FloatingActionButtonProps {
    isOpen: boolean;
    onToggle: () => void;
    onAddTransaction: () => void;
    onAddAccount: () => void;
    onCreateTeam: () => void;
    onAddStock: () => void;
    onTransfer: () => void;
}

const FabAction: React.FC<{ label: string, onClick: () => void, children: React.ReactNode }> = ({ label, onClick, children }) => (
    <div className="flex items-center gap-4 justify-end">
        <span className="bg-cosmic-surface text-cosmic-text-primary text-sm font-semibold px-3 py-1 rounded-md shadow-md">{label}</span>
        <button
            onClick={onClick}
            className="bg-cosmic-surface text-cosmic-primary w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-cosmic-border transition-all duration-300"
        >
            {children}
        </button>
    </div>
);


export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ isOpen, onToggle, onAddTransaction, onAddAccount, onCreateTeam, onAddStock, onTransfer }) => {
    return (
        <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-4">
            {isOpen && (
                <div className="flex flex-col items-end gap-4 animate-slide-in-up">
                    <FabAction label="Add Stock" onClick={onAddStock}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </FabAction>
                     <FabAction label="Add Team" onClick={onCreateTeam}>
                        <TeamsIcon className="w-6 h-6"/>
                    </FabAction>
                     <FabAction label="Add Account" onClick={onAddAccount}>
                        <CreditCardIcon className="w-6 h-6"/>
                    </FabAction>
                     <FabAction label="Transfer" onClick={onTransfer}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l