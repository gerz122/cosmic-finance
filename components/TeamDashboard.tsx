import React from 'react';
import type { Team, User, Transaction, Asset, Liability } from '../types';
import { FinancialStatement } from './FinancialStatement';
import { PlusIcon } from './icons';

interface TeamDashboardProps {
    team: Team;
    allUsers: User[];
    onBack: () => void;
    onAddTransaction: () => void;
    onAddAsset: () => void;
    onAddLiability: () => void;
    onAddStock: () => void;
}

export const TeamDashboard: React.FC<TeamDashboardProps> = ({ team, allUsers, onBack, onAddTransaction, onAddAsset, onAddLiability, onAddStock }) => {
    const members = allUsers.filter(u => team.memberIds.includes(u.id));

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <button onClick={onBack} className="text-sm text-cosmic-primary hover:underline mb-2">&larr; Back to Teams Hub</button>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">{team.name}</h1>
                    <div className="flex items-center mt-2 -space-x-2">
                        {members.map(m => <img key={m.id} src={m.avatar} alt={m.name} title={m.name} className="w-8 h-8 rounded-full border-2 border-cosmic-surface" />)}
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={onAddLiability} className="flex items-center gap-2 bg-cosmic-surface text-cosmic-secondary font-bold py-2 px-4 rounded-lg border border-cosmic-secondary hover:bg-cosmic-border transition-colors text-sm">
                        <PlusIcon className="w-4 h-4" /> Add Liability
                    </button>
                     <button onClick={onAddAsset} className="flex items-center gap-2 bg-cosmic-surface text-cosmic-primary font-bold py-2 px-4 rounded-lg border border-cosmic-primary hover:bg-cosmic-border transition-colors text-sm">
                        <PlusIcon className="w-4 h-4" /> Add Asset
                    </button>
                    <button onClick={onAddStock} className="flex items-center gap-2 bg-cosmic-surface text-yellow-400 font-bold py-2 px-4 rounded-lg border border-yellow-400 hover:bg-cosmic-border transition-colors text-sm">
                        <PlusIcon className="w-4 h-4" /> Add Stock
                    </button>
                    <button onClick={onAddTransaction} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors text-sm">
                        <PlusIcon className="w-4 h-4" /> Add Transaction
                    </button>
                </div>
            </div>

            <FinancialStatement statement={team.financialStatement} user={members[0]} teamMates={[]} team={team} />
        </div>
    );
};