import React from 'react';
import type { User, Achievement } from '../types';
import { PlusIcon, StarIcon, CreditCardIcon, TeamsIcon } from './icons';

// Master list of all possible achievements in the game
export const ALL_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'FIRST_TRANSACTION',
        title: 'First Play',
        description: 'You\'ve made your first move in the Cosmic Tournament. The journey begins!',
        icon: PlusIcon,
    },
    {
        id: 'FIRST_INVESTMENT',
        title: 'Novice Investor',
        description: 'Acquired your first stock. May your portfolio reach for the stars.',
        icon: StarIcon,
    },
    {
        id: 'FIRST_TEAM',
        title: 'Team Builder',
        description: 'Created or joined your first team. Collaboration is key!',
        icon: TeamsIcon,
    },
    {
        id: 'DEBT_FREE',
        title: 'Debt Destroyer',
        description: 'You\'ve paid off a liability completely. A black hole has been sealed!',
        icon: CreditCardIcon,
    },
    // More achievements can be added here
];

interface AchievementsProps {
    user: User;
}

export const Achievements: React.FC<AchievementsProps> = ({ user }) => {
    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-cosmic-text-primary">Achievements</h1>
                <p className="text-cosmic-text-secondary">Trophies earned during your Cosmic Tournament journey.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ALL_ACHIEVEMENTS.map(ach => {
                    const isUnlocked = user.achievements.includes(ach.id);
                    const Icon = ach.icon;
                    return (
                        <div key={ach.id} className={`bg-cosmic-surface p-4 rounded-xl border border-cosmic-border flex items-center gap-4 transition-all duration-300 ${isUnlocked ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`p-3 rounded-lg ${isUnlocked ? 'bg-cosmic-primary' : 'bg-cosmic-border'}`}>
                                <Icon className={`w-8 h-8 ${isUnlocked ? 'text-white' : 'text-cosmic-text-secondary'}`} />
                            </div>
                            <div>
                                <h3 className="font-bold text-cosmic-text-primary">{ach.title}</h3>
                                <p className="text-sm text-cosmic-text-secondary">{ach.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
