import React from 'react';
import type { Team, User, Asset, Liability, Transaction } from '../types';
import { FinancialStatement } from './FinancialStatement';
import { PlusIcon, StatementIcon } from './icons';

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
    onViewReceipt: (url: string) => void;
    onViewSplitDetails: (transaction: Transaction) => void;
    onOpenReportModal: () => void;
}

export const TeamDashboard: React.FC<TeamDashboardProps> = ({ team, allUsers, onBack, onAddTransaction, onAddAsset, onAddLiability, onAddStock, onEditAsset, onEditLiability, onEditTransaction, onDeleteTransaction, onViewReceipt, onViewSplitDetails, onOpenReportModal }) => {
    const members = allUsers.filter(userRecord => team.memberIds.includes(userRecord.id));

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <button onClick={onBack} className="text-sm text-cosmic-primary hover:underline mb-2">&larr; Back to Teams Hub</button>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">{team.name}</h1>
                    <div className="flex items-center mt-2 -space-x-2">
                        {members.map(member => <img key={member.id} src={member.avatar} alt={member.name} title={member.name} className="w-8 h-8 rounded-full border-2 border-cosmic-surface" />)}
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                     <button onClick={onOpenReportModal} className="flex items-center gap-2 bg-cosmic-surface text-cosmic-primary font-bold py-2 px-4 rounded-lg border border-cosmic-primary hover:bg-cosmic-border transition-colors text-sm">
                        <StatementIcon className="w-4 h-4" /> Generate Report
                    </button>
                    <button onClick={onAddTransaction} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors text-sm">
                        <PlusIcon className="w-4 h-4" /> Add Transaction
                    </button>
                </div>
            </div>

            <FinancialStatement 
                statement={team.financialStatement} 
                user={members[0]} // This is a bit of a hack, FinancialStatement needs a user context
                allUsers={allUsers}
                teams={[]} 
                team={team} 
                onEditTransaction={onEditTransaction} 
                onDeleteTransaction={onDeleteTransaction} 
                onViewReceipt={onViewReceipt}
                onViewSplitDetails={onViewSplitDetails}
            />
        </div>
    );
};
