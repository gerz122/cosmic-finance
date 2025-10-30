import React from 'react';
import type { User, Asset, Liability, Team } from '../types';
import { AssetType } from '../types';
import { StockTableRow } from './StockTableRow';
import { PlusIcon } from './icons';

interface PortfolioProps {
    user: User;
    teams: Team[];
    onAddStock: () => void;
    onAddAsset: () => void;
    onAddLiability: () => void;
    onEditStock: (stock: Asset) => void;
    onEditAsset: (asset: Asset) => void;
    onEditLiability: (liability: Liability) => void;
    onDeleteStock: (stockId: string) => void;
    onLogDividend: (stock: Asset) => void;
    onOpenLargeChart: (stock: Asset) => void;
}

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border">
        <h3 className="text-cosmic-text-secondary text-sm">{title}</h3>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

export const Portfolio: React.FC<PortfolioProps> = ({ user, teams, onAddStock, onAddAsset, onAddLiability, onEditStock, onEditAsset, onEditLiability, onDeleteStock, onLogDividend, onOpenLargeChart }) => {
    
    const assets = user.financialStatement?.assets || [];
    const liabilities = user.financialStatement?.liabilities || [];
    
    const personalStocks = assets.filter(assetItem => assetItem.type === AssetType.STOCK && !assetItem.teamId);
    const personalOtherAssets = assets.filter(assetItem => assetItem.type !== AssetType.STOCK && !assetItem.teamId);
    const personalLiabilities = liabilities.filter(liabilityItem => !liabilityItem.teamId);
    
    const totalStockValue = personalStocks.reduce((sum, stockItem) => sum + stockItem.value, 0);
    const totalOtherAssetsValue = personalOtherAssets.reduce((sum, assetItem) => sum + assetItem.value, 0);
    const totalLiabilitiesValue = personalLiabilities.reduce((sum, liabilityItem) => sum + liabilityItem.balance, 0);

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">Portfolio</h1>
                    <p className="text-cosmic-text-secondary">Manage your personal and team assets and liabilities.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onAddLiability} className="flex items-center gap-2 bg-cosmic-surface text-cosmic-secondary font-bold py-2 px-4 rounded-lg border border-cosmic-secondary hover:bg-cosmic-border transition-colors">
                        <PlusIcon className="w-5 h-5" /> Add Liability
                    </button>
                     <button onClick={onAddAsset} className="flex items-center gap-2 bg-cosmic-surface text-cosmic-primary font-bold py-2 px-4 rounded-lg border border-cosmic-primary hover:bg-cosmic-border transition-colors">
                        <PlusIcon className="w-5 h-5" /> Add Asset
                    </button>
                    <button onClick={onAddStock} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors">
                        <PlusIcon className="w-5 h-5" /> Add Stock
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Personal Stock Value" value={`$${totalStockValue.toLocaleString()}`} color="text-cosmic-success" />
                <StatCard title="Personal Assets Value" value={`$${totalOtherAssetsValue.toLocaleString()}`} color="text-cosmic-primary" />
                <StatCard title="Personal Liabilities" value={`-$${totalLiabilitiesValue.toLocaleString()}`} color="text-cosmic-danger" />
            </div>

            {/* Stocks Section */}
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border">
                <h2 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Personal Stock Investments</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-cosmic-text-secondary">
                        <thead className="text-xs text-cosmic-text-secondary uppercase bg-cosmic-bg">
                            <tr>
                                <th scope="col" className="px-6 py-3">Ticker</th>
                                <th scope="col" className="px-6 py-3">Shares</th>
                                <th scope="col" className="px-6 py-3">Cost Basis / Share</th>
                                <th scope="col" className="px-6 py-3">Price / Share</th>
                                <th scope="col" className="px-6 py-3">Total Value</th>
                                <th scope="col" className="px-6 py-3">Day's Change</th>
                                <th scope="col" className="px-6 py-3">P/L ($)</th>
                                <th scope="col" className="px-6 py-3">Take Profit</th>
                                <th scope="col" className="px-6 py-3">Stop Loss</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personalStocks.map(stock => (
                                <StockTableRow 
                                    key={stock.id}
                                    stock={stock}
                                    onEditStock={onEditStock}
                                    onDeleteStock={onDeleteStock}
                                    onLogDividend={onLogDividend}
                                    onOpenLargeChart={onOpenLargeChart}
                                />
                            ))}
                             {personalStocks.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="text-center py-4">No personal stocks in portfolio.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-cosmic-surface rounded-lg border border-cosmic-border">
                     <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Personal Assets</h3>
                     <div className="p-4 space-y-2">
                        {personalOtherAssets.map(assetItem => (
                            <div key={assetItem.id} className="flex justify-between items-center text-cosmic-text-primary text-sm py-1 group">
                                <span>{assetItem.name} ({assetItem.type})</span>
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold">${assetItem.value.toLocaleString()}</span>
                                    <button onClick={() => onEditAsset(assetItem)} className="text-xs text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                </div>
                            </div>
                        ))}
                        {personalOtherAssets.length === 0 && <p className="text-xs text-cosmic-text-secondary">No other personal assets.</p>}
                     </div>
                </div>
                 <div className="bg-cosmic-surface rounded-lg border border-cosmic-border">
                     <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Personal Liabilities</h3>
                     <div className="p-4 space-y-2">
                        {personalLiabilities.map(liabilityItem => (
                             <div key={liabilityItem.id} className="flex justify-between items-center text-cosmic-text-primary text-sm py-1 group">
                                <span>{liabilityItem.name}</span>
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-cosmic-danger">-${liabilityItem.balance.toLocaleString()}</span>
                                    <button onClick={() => onEditLiability(liabilityItem)} className="text-xs text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                </div>
                            </div>
                        ))}
                        {personalLiabilities.length === 0 && <p className="text-xs text-cosmic-text-secondary">No personal liabilities.</p>}
                     </div>
                </div>
            </div>

            {teams.map(teamData => {
                const userShare = 1 / teamData.memberIds.length;
                return (
                <div key={teamData.id} className="bg-cosmic-surface rounded-lg border border-cosmic-border">
                    <h2 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Team Portfolio: {teamData.name}</h2>
                     <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-bold text-cosmic-primary mb-2">Team Assets</h3>
                            {teamData.financialStatement.assets.map(assetItem => (
                            <div key={assetItem.id} className="flex justify-between items-center text-cosmic-text-primary text-sm py-1">
                                <span>{assetItem.name} ({assetItem.type})</span>
                                <div className="text-right">
                                    <span className="font-semibold">${assetItem.value.toLocaleString()}</span>
                                    <span className="text-xs text-cosmic-text-secondary ml-2">(Your share: ${(assetItem.value * userShare).toLocaleString()})</span>
                                </div>
                            </div>
                            ))}
                            {teamData.financialStatement.assets.length === 0 && <p className="text-xs text-cosmic-text-secondary">No assets for this team.</p>}
                          </div>
                           <div>
                            <h3 className="font-bold text-cosmic-secondary mb-2">Team Liabilities</h3>
                            {teamData.financialStatement.liabilities.map(liabilityItem => (
                            <div key={liabilityItem.id} className="flex justify-between items-center text-cosmic-text-primary text-sm py-1">
                                <span>{liabilityItem.name}</span>
                                <div className="text-right">
                                    <span className="font-semibold text-cosmic-danger">-${liabilityItem.balance.toLocaleString()}</span>
                                     <span className="text-xs text-cosmic-text-secondary ml-2">(Your share: -${(liabilityItem.balance * userShare).toLocaleString()})</span>
                                </div>
                            </div>
                            ))}
                            {teamData.financialStatement.liabilities.length === 0 && <p className="text-xs text-cosmic-text-secondary">No liabilities for this team.</p>}
                          </div>
                     </div>
                </div>
            )})}

        </div>
    );
};
