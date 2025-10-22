
import React, { useState } from 'react';
import type { FinancialStatement, Asset } from '../types';
import { AssetType } from '../types';
import { RealTimeStockData } from './RealTimeStockData';
// FIX: Module '"./EmbeddedStockChart"' has no exported member 'EmbeddedStockChart'. Did you mean to use 'import EmbeddedStockChart from "./EmbeddedStockChart"' instead?
import EmbeddedStockChart from './EmbeddedStockChart';

interface PortfolioProps {
    statement: FinancialStatement;
    onAddStock: () => void;
    onEditStock: (stock: Asset) => void;
    onDeleteStock: (stockId: string) => void;
    onLogDividend: (stock: Asset) => void;
}

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border">
        <h3 className="text-cosmic-text-secondary text-sm">{title}</h3>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

export const Portfolio: React.FC<PortfolioProps> = ({ statement, onAddStock, onEditStock, onDeleteStock, onLogDividend }) => {
    const { assets, liabilities } = statement;
    const stocks = assets.filter(a => a.type === AssetType.STOCK);
    const otherAssets = assets.filter(a => a.type !== AssetType.STOCK);
    
    const totalStockValue = stocks.reduce((sum, s) => sum + s.value, 0);
    const totalOtherAssetsValue = otherAssets.reduce((sum, a) => sum + a.value, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);

    const [expandedStockId, setExpandedStockId] = useState<string | null>(null);

    const toggleStockRow = (stockId: string) => {
        setExpandedStockId(currentId => (currentId === stockId ? null : stockId));
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center">
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
                                <th scope="col" className="px-6 py-3" style={{width: '200px'}}>Live Market Data</th>
                                <th scope="col" className="px-6 py-3" style={{width: '200px'}}>Profit / Loss</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map(stock => (
                                <React.Fragment key={stock.id}>
                                    <tr 
                                        className="border-b border-cosmic-border hover:bg-cosmic-bg cursor-pointer"
                                        onClick={() => toggleStockRow(stock.id)}
                                    >
                                        <td className="px-6 py-4 font-medium text-cosmic-text-primary whitespace-nowrap">{stock.ticker}</td>
                                        <td className="px-6 py-4">{stock.shares}</td>
                                        <td className="px-6 py-4">${stock.purchasePrice?.toFixed(2)}</td>
                                        <td className="px-6 py-4 font-semibold text-cosmic-text-primary">
                                            <RealTimeStockData stock={stock} isPriceOnly={true} />
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-cosmic-text-primary">
                                            <RealTimeStockData stock={stock} isPriceOnly={false} />
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => onLogDividend(stock)} className="font-medium text-green-500 hover:underline">Dividend</button>
                                            <button onClick={() => onEditStock(stock)} className="font-medium text-yellow-500 hover:underline">Edit</button>
                                            <button onClick={() => onDeleteStock(stock.id)} className="font-medium text-red-500 hover:underline">Sell</button>
                                        </td>
                                    </tr>
                                    {expandedStockId === stock.id && (
                                        <tr className="bg-cosmic-bg">
                                            <td colSpan={6} className="p-0">
                                                 <div className="p-4">
                                                    <EmbeddedStockChart ticker={stock.ticker!} />
                                                 </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                             {stocks.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-4">No stocks in portfolio.</td>
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
                     </div>
                </div>
            </div>

        </div>
    );
};
