
import React from 'react';
import type { Team } from '../types';
import { StarIcon, PlusIcon } from './icons';

interface TeamsProps {
    teams: Team[];
    onCreateTeam: () => void;
    onTeamClick: (teamId: string) => void;
}

const ProgressBar: React.FC<{ value: number; max: number; }> = ({ value, max }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full bg-cosmic-bg rounded-full h-2 border border-cosmic-border">
            <div
                className="bg-gradient-to-r from-cosmic-secondary to-cosmic-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

const TeamCard: React.FC<{team: Team; onClick: () => void}> = ({ team, onClick }) => {
    const totalNetWorth = (team.financialStatement.assets || []).reduce((sum, a) => sum + a.value, 0) - (team.financialStatement.liabilities || []).reduce((sum, l) => sum + l.balance, 0);
    const totalPassiveIncome = (team.financialStatement.transactions || []).filter(t => t.type === 'INCOME' && t.isPassive).reduce((sum, t) => sum + t.amount, 0);

    return (
        <div onClick={onClick} className="bg-cosmic-surface p-4 rounded-xl border border-cosmic-border flex flex-col gap-4 hover:border-cosmic-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-cosmic-primary rounded-lg">
                    <StarIcon className="w-6 h-6 text-white"/>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-cosmic-text-primary">{team.name}</h3>
                    <p className="text-sm text-cosmic-text-secondary">{team.memberIds.length} Players</p>
                </div>
            </div>
             <div className="text-sm">
                <div className="flex justify-between"><span>Net Worth:</span> <span className="font-bold">${totalNetWorth.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Passive Income:</span> <span className="font-bold text-cosmic-primary">${totalPassiveIncome.toLocaleString()}</span></div>
            </div>
             {team.goals[0] && (
                <div>
                    <p className="text-xs text-cosmic-text-secondary mb-1">{team.goals[0].description}</p>
                    <ProgressBar value={team.goals[0].current} max={team.goals[0].target} />
                </div>
            )}
        </div>
    )
}


export const Teams: React.FC<TeamsProps> = ({ teams, onCreateTeam, onTeamClick }) => {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">Team Hub</h1>
                    <p className="text-cosmic-text-secondary">Collaborate on your financial projects and businesses.</p>
                </div>
                 <button onClick={onCreateTeam} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Create Team
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(team => (
                    <TeamCard key={team.id} team={team} onClick={() => onTeamClick(team.id)} />
                ))}
                {teams.length === 0 && (
                     <div className="col-span-full bg-cosmic-surface p-8 rounded-lg border border-dashed border-cosmic-border text-center">
                        <StarIcon className="w-12 h-12 mx-auto text-cosmic-text-secondary mb-4" />
                        <h3 className="text-xl font-semibold text-cosmic-text-primary">No Teams Yet</h3>
                        <p className="text-cosmic-text-secondary mt-2">Create your first team to start a new financial project!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
