import React, { useState } from 'react';
import type { User } from '../types';
import { XIcon, PlusIcon } from './icons';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTeam: (name: string, invitedEmails: string[]) => void;
    currentUser: User;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onCreateTeam, currentUser }) => {
    const [name, setName] = useState('');
    const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
    const [currentEmail, setCurrentEmail] = useState('');

    if (!isOpen) return null;

    const handleAddEmail = () => {
        if (currentEmail && !invitedEmails.includes(currentEmail) && currentEmail !== currentUser.email) {
            setInvitedEmails([...invitedEmails, currentEmail]);
            setCurrentEmail('');
        }
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        setInvitedEmails(invitedEmails.filter(email => email !== emailToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert("Please provide a team name.");
            return;
        }
        onCreateTeam(name, invitedEmails);
        setName('');
        setInvitedEmails([]);
        setCurrentEmail('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-md shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Create New Team</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="teamName" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Team / Project Name</label>
                        <input type="text" id="teamName" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                    </div>
                     <div>
                        <label htmlFor="inviteEmail" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Invite Members by Email</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                id="inviteEmail"
                                value={currentEmail}
                                onChange={e => setCurrentEmail(e.target.value)}
                                placeholder="player@email.com"
                                className="flex-grow bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary"
                            />
                            <button type="button" onClick={handleAddEmail} className="p-2 bg-cosmic-primary rounded-md text-white hover:bg-blue-400">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    {invitedEmails.length > 0 && (
                        <div className="space-y-2 bg-cosmic-bg p-3 rounded-lg max-h-40 overflow-y-auto">
                            {invitedEmails.map(email => (
                                <div key={email} className="flex items-center justify-between p-1">
                                    <span className="text-sm text-cosmic-text-primary">{email}</span>
                                    <button type="button" onClick={() => handleRemoveEmail(email)} className="text-cosmic-text-secondary hover:text-cosmic-danger">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">Create Team</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
