import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import type { Asset } from '../types';
import { marketDataService, type MarketData } from '../services/marketDataService';
import EmbeddedStockChart from './EmbeddedStockChart';

interface StockTableRowProps {
    stock: Asset;
    onEditStock: (stock: Asset) => void;
    onDeleteStock: (stockId: string) => void;
    onLogDividend: (stock: Asset) => void;
    onOpenLargeChart: (stock: Asset) => void;
}

export const StockTableRow: React.FC<StockTableRowProps> = memo(({ stock, onEditStock, onDeleteStock, onLogDividend, onOpenLargeChart }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [liveData, setLiveData] = useState<MarketData | null>(null);
    const [priceChangeIndicator, setPriceChangeIndicator] = useState<'up' | 'down' | 'none'>('none');

    useEffect(() => {
        let isMounted = true;
        if (!stock.ticker) return;

        const fetchData = async () => {
            try {
                const data = await marketDataService.getLiveStockData(stock.ticker!);
                if (isMounted && data.price > 0) {
                    setLiveData(prevData => {
                        if (prevData && prevData.price && data.price > prevData.price) {
                            setPriceChangeIndicator('up');
                        } else if (prevData && prevData.price && data.price < prevData.price) {
                            setPriceChangeIndicator('down');
                        }
                        return data;
                    });
                } else if(isMounted) {
                    setLiveData(null); // Set to null if fetch fails or returns 0
                }
            } catch (error) {
                console.error(`Failed to fetch data for ${stock.ticker}`, error);
                 if (isMounted) setLiveData(null);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 60000); // Refresh every minute

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [stock.ticker]);
    
    useEffect(() => {
        if (priceChangeIndicator !== 'none') {
            const timer = setTimeout(() => setPriceChangeIndicator('none'), 500);
            return () => clearTimeout(timer);
        }
    }, [priceChangeIndicator]);

    const toggleRow = () => setIsExpanded(prev => !prev);

    const { plValue, plColor, dayChangeColor, dayChangePercent, totalValue } = useMemo(() => {
        if (!liveData || liveData.price === 0 || !stock.purchasePrice || !stock.numberOfShares) {
            return { 
                plValue: 0, 
                plColor: 'text-cosmic-text-secondary', 
                dayChangeColor: 'text-cosmic-text-secondary', 
                dayChangePercent: 0, 
                totalValue: stock.numberOfShares && stock.purchasePrice ? stock.numberOfShares * stock.purchasePrice : 0
            };
        }
        
        const currentTotalValue = liveData.price * stock.numberOfShares;
        const purchaseTotalValue = stock.purchasePrice * stock.numberOfShares;
        const value = currentTotalValue - purchaseTotalValue;
        
        const pColor = value >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';
        const dColor = liveData.dayChange >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';
        
        const dPercent = liveData.previousClose > 0 ? (liveData.dayChange / liveData.previousClose) * 100 : 0;

        return { plValue: value, plColor: pColor, dayChangeColor: dColor, dayChangePercent: dPercent, totalValue: currentTotalValue };
    }, [liveData, stock.purchasePrice, stock.numberOfShares]);
    
    const priceIndicatorClass = priceChangeIndicator === 'up' ? 'bg-green-500/20' : priceChangeIndicator === 'down' ? 'bg-red-500/20' : '';

    return (
        <React.Fragment>
            <tr 
                className="border-b border-cosmic-border hover:bg-cosmic-bg cursor-pointer"
                onClick={toggleRow}
            >
                <td className="px-6 py-4 font-medium text-cosmic-text-primary whitespace-nowrap">{stock.ticker}</td>
                <td className="px-6 py-4">{stock.numberOfShares}</td>
                <td className="px-6 py-4">${stock.purchasePrice?.toFixed(2)}</td>
                <td className={`px-6 py-4 font-bold text-cosmic-text-primary transition-colors duration-300 ${priceIndicatorClass}`}>
                     {liveData && liveData.price > 0 ? `$${liveData.price.toFixed(2)}` : <span className="text-xs text-cosmic-text-secondary">N/A</span>}
                </td>
                <td className="px-6 py-4 font-semibold text-cosmic-text-primary">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`px-6 py-4 ${dayChangeColor}`}>
                    {liveData && liveData.price > 0 ? (
                        <>
                            <p className="font-semibold">{liveData.dayChange >= 0 ? '+' : ''}{liveData.dayChange.toFixed(2)}</p>
                            <p className="text-xs">({dayChangePercent.toFixed(2)}%)</p>
                        </>
                    ) : <span className="text-xs text-cosmic-text-secondary">N/A</span>}
                </td>
                <td className={`px-6 py-4 font-bold ${plColor}`}>
                    {liveData && liveData.price > 0 ? `${plValue >= 0 ? '+' : ''}${plValue.toFixed(2)}` : <span className="text-xs text-cosmic-text-secondary">N/A</span>}
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
                    <td colSpan={10} className="p-0">
                         <div className="p-4" style={{ height: '400px' }}>
                            <EmbeddedStockChart ticker={stock.ticker!} takeProfit={stock.takeProfit} stopLoss={stock.stopLoss} />
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
});