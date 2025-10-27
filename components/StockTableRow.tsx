import React, { useState, useCallback, useEffect } from 'react';
import type { Asset } from '../types';
import { StockPriceProvider, type LiveStockData } from './RealTimeStockData';
import EmbeddedStockChart from './EmbeddedStockChart';

interface StockTableRowProps {
    stock: Asset;
    onEditStock: (stock: Asset) => void;
    onDeleteStock: (stockId: string) => void;
    onLogDividend: (stock: Asset) => void;
    onOpenLargeChart: (stock: Asset) => void;
}

export const StockTableRow: React.FC<StockTableRowProps> = ({ stock, onEditStock, onDeleteStock, onLogDividend, onOpenLargeChart }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [liveData, setLiveData] = useState<LiveStockData | null>(null);
    const [priceChangeIndicator, setPriceChangeIndicator] = useState<'up' | 'down' | 'none'>('none');

    // CRITICAL FIX: Prevent crash if a stock in the DB is missing a ticker.
    if (!stock.ticker) {
        console.warn("Stock asset is missing a ticker:", stock);
        return null; 
    }

    const handleDataUpdate = useCallback((data: LiveStockData) => {
        if (data.price === null) {
            setLiveData(d => d ? {...d, price: null} : null); // Keep old data but nullify price if fetch fails
            return;
        }

        setLiveData(prevData => {
            if (prevData && prevData.price && data.price > prevData.price) {
                setPriceChangeIndicator('up');
            } else if (prevData && prevData.price && data.price < prevData.price) {
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
        // FIX: Use numberOfShares and add checks for null/undefined
        if (liveData === null || liveData.price === null || !stock.purchasePrice || !stock.numberOfShares) {
            return { plValue: 0, plPercent: 0, plColor: 'text-cosmic-text-secondary', dayChangeColor: 'text-cosmic-text-secondary' };
        }
        const value = (liveData.price - stock.purchasePrice) * stock.numberOfShares;
        const percent = stock.purchasePrice > 0 ? ((liveData.price - stock.purchasePrice) / stock.purchasePrice) * 100 : 0;
        const pColor = value >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';
        const dColor = liveData.dayChange === null ? 'text-cosmic-text-secondary' : liveData.dayChange >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';
        return { plValue: value, plPercent: percent, plColor: pColor, dayChangeColor: dColor };
    })();
    
    const priceIndicatorClass = priceChangeIndicator === 'up' ? 'bg-green-500/20' : priceChangeIndicator === 'down' ? 'bg-red-500/20' : '';

    return (
        <React.Fragment>
            <StockPriceProvider ticker={stock.ticker} onDataUpdate={handleDataUpdate} />
            
            <tr 
                className="border-b border-cosmic-border hover:bg-cosmic-bg cursor-pointer"
                onClick={toggleRow}
            >
                <td className="px-6 py-4 font-medium text-cosmic-text-primary whitespace-nowrap">{stock.ticker}</td>
                <td className="px-6 py-4">{stock.numberOfShares}</td>
                <td className="px-6 py-4">${stock.purchasePrice?.toFixed(2)}</td>
                <td className={`px-6 py-4 font-bold text-cosmic-text-primary transition-colors duration-300 ${priceIndicatorClass}`}>
                     {liveData?.price ? `$${liveData.price.toFixed(2)}` : <span className="text-xs">Loading...</span>}
                </td>
                <td className="px-6 py-4">
                    {liveData && liveData.dayChange !== null && liveData.dayChangePercent !== null ? (
                        <div className={dayChangeColor}>
                            <p className="font-semibold">{liveData.dayChange >= 0 ? '+' : ''}{liveData.dayChange.toFixed(2)}</p>
                            <p className="text-xs">({liveData.dayChangePercent.toFixed(2)}%)</p>
                        </div>
                    ) : <span className="text-xs">Loading...</span>}
                </td>
                <td className={`px-6 py-4 font-bold ${plColor}`}>
                    {liveData?.price ? `${plValue >= 0 ? '+' : ''}${plValue.toFixed(2)}` : <span className="text-xs">Loading...</span>}
                </td>
                <td className="px-6 py-4 text-green-400">
                    {stock.takeProfit ? `$${stock.takeProfit.toFixed(2)}` : '---'}
                </td>
                <td className="px-6 py-4 text-red-400">
                    {stock.stopLoss ? `$${stock.stopLoss.toFixed(2)}` : '---'}
                </td>
                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onLogDividend(stock)} className="font-medium text-green-500 hover:underline">Dividend</button>
                    <button onClick={() => onEditStock(stock)} className="font-medium text-yellow-500 hover:underline">Edit</button>
                    <button onClick={() => onDeleteStock(stock.id)} className="font-medium text-red-500 hover:underline">Sell</button>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-cosmic-bg">
                    <td colSpan={9} className="p-0">
                         <div className="p-4" style={{ height: '400px' }}>
                            <EmbeddedStockChart ticker={stock.ticker} takeProfit={stock.takeProfit} stopLoss={stock.stopLoss} />
                            <div className="text-right mt-2">
                                <button
                                    onClick={() => onOpenLargeChart(stock)}
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
