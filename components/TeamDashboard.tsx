
import React from 'react';
import type { Team, User, Asset, Liability, Transaction } from '../types';
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
    onEditAsset: (asset: Asset) => void;
    onEditLiability: (liability: Liability) => void;
    onEditTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (transactionId: string) => void;
}

const DataRow: React.FC<{ label: string; value: string; isPositive?: boolean; isNegative?: boolean; onEdit: () => void }> = ({ label, value, isPositive, isNegative, onEdit }) => (
    <div className="flex justify-between items-center text-cosmic-text-primary text-sm py-2 border-b border-cosmic-border last:border-0 group">
        <span>{label}</span>
        <div className="flex items-center gap-4">
            <span className={`font-semibold ${isPositive ? 'text-cosmic-success' : ''} ${isNegative ? 'text-cosmic-danger' : ''}`}>{value}</span>
            <button onClick={onEdit} className="text-xs text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
        </div>
    </div>
);

export const TeamDashboard: React.FC<TeamDashboardProps> = ({ team, allUsers, onBack, onAddTransaction, onAddAsset, onAddLiability, onAddStock, onEditAsset, onEditLiability, onEditTransaction, onDeleteTransaction }) => {
    const members = allUsers.filter(u => team.memberIds.includes(u.id));
    const { assets, liabilities } = team.financialStatement;

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

            <FinancialStatement statement={team.financialStatement} user={members[0]} teamMates={[]} team={team} onEditTransaction={onEditTransaction} onDeleteTransaction={onDeleteTransaction} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-cosmic-surface rounded-lg border border-cosmic-border">
                    <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Team Assets</h3>
                    <div className="p-4 space-y-2">
                        {assets.map(asset => (
                            <DataRow key={asset.id} label={`${asset.name} (${asset.type})`} value={`$${asset.value.toLocaleString()}`} onEdit={() => onEditAsset(asset)} isPositive />
                        ))}
                        {assets.length === 0 && <p className="text-xs text-cosmic-text-secondary">No assets for this team.</p>}
                    </div>
                </div>
                <div className="bg-cosmic-surface rounded-lg border border-cosmic-border">
                    <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Team Liabilities</h3>
                    <div className="p-4 space-y-2">
                        {liabilities.map(lia => (
                           <DataRow key={lia.id} label={lia.name} value={`$${lia.balance.toLocaleString()}`} onEdit={() => onEditLiability(lia)} isNegative />
                        ))}
                        {liabilities.length === 0 && <p className="text-xs text-cosmic-text-secondary">No liabilities for this team.</p>}
                    </div>
                </div>
            </div>

        </div>
    );
};
