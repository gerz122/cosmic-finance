import React, { useState, useCallback, useEffect } from 'react';
import type { Asset } from '../types';
import { StockPriceProvider, type LiveStockData } from './RealTimeStockData';
import EmbeddedStockChart from './EmbeddedStockChart';

interface StockTableRowProps {
    stock: Asset;
    onEditStock: (stock: Asset) => void;
    onDeleteStock: (stockId: string) => void;
    onLogDividend: (stock: Asset) => void;
    onOpenLargeChart: (ticker: string) => void;
}

export const StockTableRow: React.FC<StockTableRowProps> = ({ stock, onEditStock, onDeleteStock, onLogDividend, onOpenLargeChart }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [liveData, setLiveData] = useState<LiveStockData | null>(null);
    const [priceChangeIndicator, setPriceChangeIndicator] = useState<'up' | 'down' | 'none'>('none');

    const handleDataUpdate = useCallback((data: LiveStockData) => {
        setLiveData(prevData => {
            if (prevData && data.price > prevData.price) {
                setPriceChangeIndicator('up');
            } else if (prevData && data.price < prevData.price) {
                setPriceChangeIndicator('down');
            }
            return data;
        });
    }, []);
    
    useEffect(() => {
        if (priceChangeIndicator !== 'none') {
            const timer = setTimeout(() => setPriceChangeIndicator('none'), 500);
            return () => clearTimeout(timer);
        }
    }, [priceChangeIndicator]);


    const toggleRow = () => setIsExpanded(prev => !prev);

    const { plValue, plPercent, plColor, dayChangeColor } = (() => {
        if (liveData === null || !stock.purchasePrice || !stock.shares) {
            return { plValue: 0, plPercent: 0, plColor: 'text-cosmic-text-secondary', dayChangeColor: 'text-cosmic-text-secondary' };
        }
        const value = (liveData.price - stock.purchasePrice) * stock.shares;
        const percent = stock.purchasePrice > 0 ? ((liveData.price - stock.purchasePrice) / stock.purchasePrice) * 100 : 0;
        const pColor = value >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';
        const dColor = liveData.dayChange >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';
        return { plValue: value, plPercent: percent, plColor: pColor, dayChangeColor: dColor };
    })();
    
    const priceIndicatorClass = priceChangeIndicator === 'up' ? 'bg-green-500/20' : priceChangeIndicator === 'down' ? 'bg-red-500/20' : '';

    return (
        <React.Fragment>
            <StockPriceProvider ticker={stock.ticker!} onDataUpdate={handleDataUpdate} />
            
            <tr 
                className="border-b border-cosmic-border hover:bg-cosmic-bg cursor-pointer"
                onClick={toggleRow}
            >
                <td className="px-6 py-4 font-medium text-cosmic-text-primary whitespace-nowrap">{stock.ticker}</td>
                <td className="px-6 py-4">{stock.shares}</td>
                <td className="px-6 py-4">${stock.purchasePrice?.toFixed(2)}</td>
                <td className={`px-6 py-4 font-bold text-cosmic-text-primary transition-colors duration-300 ${priceIndicatorClass}`}>
                     {liveData ? `$${liveData.price.toFixed(2)}` : <span className="text-xs">Loading...</span>}
                </td>
                <td className="px-6 py-4">
                    {liveData ? (
                        <div className={dayChangeColor}>
                            <p className="font-semibold">{liveData.dayChange >= 0 ? '+' : ''}{liveData.dayChange.toFixed(2)}</p>
                            <p className="text-xs">({liveData.dayChangePercent.toFixed(2)}%)</p>
                        </div>
                    ) : <span className="text-xs">Loading...</span>}
                </td>
                <td className={`px-6 py-4 font-bold ${plColor}`}>
                    {liveData ? `${plValue >= 0 ? '+' : ''}${plValue.toFixed(2)}` : <span className="text-xs">Loading...</span>}
                </td>
                <td className={`px-6 py-4 font-bold ${plColor}`}>
                    {liveData ? `${plPercent.toFixed(2)}%` : <span className="text-xs">Loading...</span>}
                </td>

                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onLogDividend(stock)} className="font-medium text-green-500 hover:underline">Dividend</button>
                    <button onClick={() => onEditStock(stock)} className="font-medium text-yellow-500 hover:underline">Edit</button>
                    <button onClick={() => onDeleteStock(stock.id)} className="font-medium text-red-500 hover:underline">Sell</button>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-cosmic-bg">
                    <td colSpan={8} className="p-0">
                         <div className="p-4">
                            <EmbeddedStockChart ticker={stock.ticker!} />
                            <div className="text-right mt-2">
                                <button
                                    onClick={() => onOpenLargeChart(stock.ticker!)}
                                    className="text-sm bg-cosmic-surface hover:bg-cosmic-border text-cosmic-primary font-semibold py-1 px-3 rounded-md border border-cosmic-border"
                                >
                                    Expand Chart
                                </button>
                            </div>
                         </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};