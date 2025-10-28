
import React, { useState } from 'react';
import type { User } from '../types';
import { XIcon } from './icons';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTeam: (name: string, memberIds: string[]) => void;
    allUsers: User[];
    currentUser: User;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onCreateTeam, allUsers, currentUser }) => {
    const [name, setName] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
    
    if (!isOpen) return null;

    const handleToggleMember = (userId: string) => {
        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            if(newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || (selectedMemberIds.size === 0 && allUsers.length > 1)) {
            alert("Please provide a team name and select at least one other member.");
            return;
        }
        onCreateTeam(name, Array.from(selectedMemberIds));
        setName('');
        setSelectedMemberIds(new Set());
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
                        <label className="block text-sm font-medium text-cosmic-text-secondary mb-2">Invite Members</label>
                        <div className="space-y-2 bg-cosmic-bg p-3 rounded-lg max-h-48 overflow-y-auto">
                            {allUsers.filter(u => u.id !== currentUser.id).map(user => (
                                <label key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-cosmic-border cursor-pointer">
                                     <input 
                                        type="checkbox"
                                        checked={selectedMemberIds.has(user.id)}
                                        onChange={() => handleToggleMember(user.id)}
                                        className="w-5 h-5 rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary"
                                    />
                                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                    <span className="text-cosmic-text-primary">{user.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">Create Team</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
