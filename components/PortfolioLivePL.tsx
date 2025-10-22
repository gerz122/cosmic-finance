import React, { useState, useMemo } from 'react';
import type { Asset } from '../types';
import { StockPriceProvider, type LiveStockData } from './RealTimeStockData';

interface PortfolioLivePLProps {
    stocks: Asset[];
}

export const PortfolioLivePL: React.FC<PortfolioLivePLProps> = ({ stocks }) => {
    const [livePrices, setLivePrices] = useState<Record<string, number>>({});
    const [pricesLoaded, setPricesLoaded] = useState<Set<string>>(new Set());

    const handleDataUpdate = (stockId: string, data: LiveStockData) => {
        setLivePrices(prevPrices => ({ ...prevPrices, [stockId]: data.price }));
        setPricesLoaded(prevLoaded => new Set(prevLoaded).add(stockId));
    };

    const totalPL = useMemo(() => {
        return stocks.reduce((acc, stock) => {
            const livePrice = livePrices[stock.id];
            if (livePrice && stock.purchasePrice && stock.shares) {
                const pl = (livePrice - stock.purchasePrice) * stock.shares;
                return acc + pl;
            }
            return acc;
        }, 0);
    }, [livePrices, stocks]);
    
    // Render hidden providers for each stock
    const dataProviders = stocks.map(stock => (
        <StockPriceProvider 
            key={stock.id} 
            ticker={stock.ticker!} 
            onDataUpdate={(data) => handleDataUpdate(stock.id, data)}
        />
    ));

    if (stocks.length === 0) {
        return <span>$0.00</span>;
    }

    if (pricesLoaded.size < stocks.length) {
        return <span className="text-sm animate-pulse-fast">Calculating...</span>;
    }

    const plColor = totalPL >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';

    return (
        <>
            <div style={{ display: 'none' }}>{dataProviders}</div>
            <span className={plColor}>
                {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
            </span>
        </>
    );
};