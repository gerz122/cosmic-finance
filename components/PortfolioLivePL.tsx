import React, { useState, useEffect, useMemo } from 'react';
import type { Asset } from '../types';
import { marketDataService } from '../services/marketDataService';

interface PortfolioLivePLProps {
    stocks: Asset[];
}

export const PortfolioLivePL: React.FC<PortfolioLivePLProps> = ({ stocks }) => {
    const [liveData, setLiveData] = useState<Record<string, { price: number; dayChange: number }>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        if (stocks.length === 0) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const fetchAllStockData = async () => {
            try {
                const results = await marketDataService.getMultipleStockData(stocks.map(s => s.ticker).filter(Boolean) as string[]);
                if (isMounted) {
                    const dataMap: Record<string, { price: number; dayChange: number }> = {};
                    stocks.forEach(stock => {
                        const data = results.find(r => r.ticker === stock.ticker);
                        if (data && data.price > 0) { // Only store valid data
                            dataMap[stock.id] = { price: data.price, dayChange: data.dayChange };
                        }
                    });
                    setLiveData(dataMap);
                }
            } catch (error) {
                console.error("Failed to fetch portfolio data", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchAllStockData();
        const intervalId = setInterval(fetchAllStockData, 60000); // Refresh every minute

        // FIX: Added clearInterval to the cleanup function and completed the file.
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [stocks]);

    const totalDayPL = useMemo(() => {
        return stocks.reduce((total, stock) => {
            const data = liveData[stock.id];
            if (data && stock.numberOfShares) {
                return total + data.dayChange * stock.numberOfShares;
            }
            return total;
        }, 0);
    }, [stocks, liveData]);

    // FIX: Added JSX return to render the calculated P/L.
    if (isLoading) {
        return <span className="text-sm text-cosmic-text-secondary animate-pulse">Loading...</span>;
    }
    
    if (stocks.length === 0) {
        return <>$0.00</>;
    }
    
    const plColor = totalDayPL >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';

    return (
        <span className={plColor}>
            {totalDayPL >= 0 ? '+' : ''}${totalDayPL.toFixed(2)}
        </span>
    );
};
