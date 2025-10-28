
import React from 'react';
import type { User, Team, Asset, Liability } from '../types';
import { XIcon } from './icons';

interface NetWorthBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    teams: Team[];
}

const DataRow: React.FC<{ label: string; value: number; sublabel?: string, isNegative?: boolean; }> = ({ label, value, sublabel, isNegative }) => (
    <div className="flex justify-between items-center py-2 border-b border-cosmic-border last:border-b-0">
        <div>
            <p className="font-semibold text-cosmic-text-primary">{label}</p>
            {sublabel && <p className="text-xs text-cosmic-text-secondary">{sublabel}</p>}
        </div>
        <p className={`font-mono font-semibold ${isNegative ? 'text-cosmic-danger' : 'text-cosmic-success'}`}>
            {isNegative && '-'}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
    </div>
);


export const NetWorthBreakdownModal: React.FC<NetWorthBreakdownModalProps> = ({ isOpen, onClose, user, teams }) => {
    if (!isOpen) return null;

    const personalAssets = user.financialStatement.assets;
    const personalLiabilities = user.financialStatement.liabilities;
    let totalAssets = personalAssets.reduce((sum, a) => sum + a.value, 0);
    let totalLiabilities = personalLiabilities.reduce((sum, l) => sum + l.balance, 0);
    
    const teamAssets: (Asset & {teamName: string, userShare: number})[] = [];
    const teamLiabilities: (Liability & {teamName: string, userShare: number})[] = [];
    
    teams.forEach(team => {
        const userShareFraction = 1 / team.memberIds.length;
        team.financialStatement.assets.forEach(asset => {
            const userShareValue = asset.value * userShareFraction;
            totalAssets += userShareValue;
            teamAssets.push({...asset, teamName: team.name, userShare: userShareValue});
        });
        team.financialStatement.liabilities.forEach(liability => {
            const userShareValue = liability.balance * userShareFraction;
            totalLiabilities += userShareValue;
            teamLiabilities.push({...liability, teamName: team.name, userShare: userShareValue});
        });
    });

    const netWorth = totalAssets - totalLiabilities;


    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-2xl shadow-2xl p-6 m-4 animate-slide-in-up max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-cosmic-text-primary">Net Worth Breakdown</h2>
                        <p className="text-cosmic-text-secondary">Total Net Worth: <span className={`font-bold ${netWorth >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>${netWorth.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></p>
                    </div>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assets Column */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-cosmic-success border-b-2 border-cosmic-success pb-1">Assets (${totalAssets.toLocaleString(undefined, {minimumFractionDigits: 2})})</h3>
                        <div className="space-y-2">
                             <h4 className="font-semibold text-cosmic-text-primary mt-2">Personal Assets</h4>
                            {personalAssets.map(asset => <DataRow key={asset.id} label={asset.name} value={asset.value} sublabel={asset.type} />)}
                            {personalAssets.length === 0 && <p className="text-sm text-cosmic-text-secondary">No personal assets.</p>}
                        </div>
                         <div className="space-y-2">
                             <h4 className="font-semibold text-cosmic-text-primary mt-4">Team Assets (Your Share)</h4>
                            {teamAssets.map(asset => <DataRow key={asset.id} label={asset.name} value={asset.userShare} sublabel={`From team: ${asset.teamName}`} />)}
                             {teamAssets.length === 0 && <p className="text-sm text-cosmic-text-secondary">No team assets.</p>}
                        </div>
                    </div>
                    {/* Liabilities Column */}
                     <div className="space-y-4">
                        <h3 className="text-xl font-bold text-cosmic-danger border-b-2 border-cosmic-danger pb-1">Liabilities (${totalLiabilities.toLocaleString(undefined, {minimumFractionDigits: 2})})</h3>
                         <div className="space-y-2">
                             <h4 className="font-semibold text-cosmic-text-primary mt-2">Personal Liabilities</h4>
                            {personalLiabilities.map(lia => <DataRow key={lia.id} label={lia.name} value={lia.balance} isNegative />)}
                            {personalLiabilities.length === 0 && <p className="text-sm text-cosmic-text-secondary">No personal liabilities.</p>}
                        </div>
                         <div className="space-y-2">
                             <h4 className="font-semibold text-cosmic-text-primary mt-4">Team Liabilities (Your Share)</h4>
                            {teamLiabilities.map(lia => <DataRow key={lia.id} label={lia.name} value={lia.userShare} sublabel={`From team: ${lia.teamName}`} isNegative />)}
                             {teamLiabilities.length === 0 && <p className="text-sm text-cosmic-text-secondary">No team liabilities.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
