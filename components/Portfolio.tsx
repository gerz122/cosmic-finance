

import React from 'react';
import type { FinancialStatement, Asset } from '../types';
import { AssetType } from '../types';
import { StockTableRow } from './StockTableRow';

interface PortfolioProps {
    statement: FinancialStatement;
    onAddStock: () => void;
    onEditStock: (stock: Asset) => void;
    onDeleteStock: (stockId: string) => void;
    onLogDividend: (stock: Asset) => void;
    onOpenLargeChart: (ticker: string) => void;
}

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border">
        <h3 className="text-cosmic-text-secondary text-sm">{title}</h3>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

export const Portfolio: React.FC<PortfolioProps> = ({ statement, onAddStock, onEditStock, onDeleteStock, onLogDividend, onOpenLargeChart }) => {
    const { assets, liabilities } = statement;
    const stocks = assets.filter(a => a.type === AssetType.STOCK);
    const otherAssets = assets.filter(a => a.type !== AssetType.STOCK);
    
    const totalStockValue = stocks.reduce((sum, s) => sum + s.value, 0);
    const totalOtherAssetsValue = otherAssets.reduce((sum, a) => sum + a.value, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">Portfolio</h1>
                    <p className="text-cosmic-text-secondary">Manage your assets and liabilities.</p>
                </div>
                 <button onClick={onAddStock} className="bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors">
                    Add Stock
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Stock Portfolio Value" value={`$${totalStockValue.toLocaleString()}`} color="text-cosmic-success" />
                <StatCard title="Other Assets Value" value={`$${totalOtherAssetsValue.toLocaleString()}`} color="text-cosmic-primary" />
                <StatCard title="Total Liabilities" value={`-$${totalLiabilities.toLocaleString()}`} color="text-cosmic-danger" />
            </div>

            {/* Stocks Section */}
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border">
                <h2 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Stock Investments</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-cosmic-text-secondary">
                        <thead className="text-xs text-cosmic-text-secondary uppercase bg-cosmic-bg">
                            <tr>
                                <th scope="col" className="px-6 py-3">Ticker</th>
                                <th scope="col" className="px-6 py-3">Shares</th>
                                <th scope="col" className="px-6 py-3">Cost Basis</th>
                                <th scope="col" className="px-6 py-3">Live Price</th>
                                <th scope="col" className="px-6 py-3">Day's Change</th>
                                <th scope="col" className="px-6 py-3">P/L ($)</th>
                                <th scope="col" className="px-6 py-3">Take Profit</th>
                                <th scope="col" className="px-6 py-3">Stop Loss</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map(stock => (
                                <StockTableRow 
                                    key={stock.id}
                                    stock={stock}
                                    onEditStock={onEditStock}
                                    onDeleteStock={onDeleteStock}
                                    onLogDividend={onLogDividend}
                                    onOpenLargeChart={onOpenLargeChart}
                                />
                            ))}
                             {stocks.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="text-center py-4">No stocks in portfolio.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Other Assets and Liabilities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-cosmic-surface rounded-lg border border-cosmic-border">
                     <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Other Assets</h3>
                     <div className="p-4 space-y-2">
                        {otherAssets.map(asset => (
                             <div key={asset.id} className="flex justify-between items-center text-cosmic-text-primary text-sm py-1">
                                <span>{asset.name} ({asset.type})</span>
                                <span className="font-semibold">${asset.value.toLocaleString()}</span>
                            </div>
                        ))}
                         {otherAssets.length === 0 && <p className="text-xs text-cosmic-text-secondary">No other assets.</p>}
                     </div>
                </div>
                 <div className="bg-cosmic-surface rounded-lg border border-cosmic-border">
                     <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Liabilities</h3>
                     <div className="p-4 space-y-2">
                        {liabilities.map(lia => (
                             <div key={lia.id} className="flex justify-between items-center text-cosmic-text-primary text-sm py-1">
                                <span>{lia.name}</span>
                                <span className="font-semibold text-cosmic-danger">-${lia.balance.toLocaleString()}</span>
                            </div>
                        ))}
                        {liabilities.length === 0 && <p className="text-xs text-cosmic-text-secondary">No liabilities.</p>}
                     </div>
                </div>
            </div>

        </div>
    );
};