import React from 'react';
import type { Team } from '../types';
import { StarIcon } from './icons';

interface TeamsProps {
    team: Team;
}

const ProgressBar: React.FC<{ value: number; max: number; }> = ({ value, max }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full bg-cosmic-bg rounded-full h-3 border border-cosmic-border">
            <div
                className="bg-gradient-to-r from-cosmic-secondary to-cosmic-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};


export const Teams: React.FC<TeamsProps> = ({ team }) => {
    
    const totalNetWorth = team.financialStatement.assets.reduce((sum, a) => sum + a.value, 0) - team.financialStatement.liabilities.reduce((sum, l) => sum + l.balance, 0);
    const totalPassiveIncome = team.financialStatement.transactions.filter(t => t.type === 'INCOME' && t.isPassive).reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-cosmic-text-primary">Team Hub</h1>
            
            <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-cosmic-primary rounded-lg">
                        <StarIcon className="w-8 h-8 text-white"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-cosmic-text-primary">{team.name}</h2>
                        <p className="text-cosmic-text-secondary">{team.members.length} Players</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-cosmic-bg p-4 rounded-lg">
                        <h3 className="text-cosmic-text-secondary text-sm">Team Net Worth</h3>
                        <p className="text-3xl font-bold text-white">${totalNetWorth.toLocaleString()}</p>
                    </div>
                     <div className="bg-cosmic-bg p-4 rounded-lg">
                        <h3 className="text-cosmic-text-secondary text-sm">Team Passive Income</h3>
                        <p className="text-3xl font-bold text-cosmic-primary">${totalPassiveIncome.toLocaleString()}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-bold text-cosmic-text-primary mb-3">Team Goals</h3>
                    <div className="space-y-4">
                        {team.goals.map((goal, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <p className="text-cosmic-text-primary font-semibold">{goal.description}</p>
                                    <p className="text-sm text-cosmic-text-secondary">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</p>
                                </div>
                                <ProgressBar value={goal.current} max={goal.target} />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-cosmic-text-primary mb-3">Roster</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {team.members.map(member => (
                            <div key={member.id} className="flex flex-col items-center text-center gap-2 p-3 bg-cosmic-bg rounded-lg">
                                <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full border-2 border-cosmic-border" />
                                <p className="font-semibold text-cosmic-text-primary text-sm">{member.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
