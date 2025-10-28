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
        setIsLoading(true);

        const fetchAllStockData = async () => {
            if (stocks.length === 0) {
                setIsLoading(false);
                return;
            }
            try {
                const results = await marketDataService.getMultipleStockData(stocks.map(s => s.ticker).filter(Boolean) as string[]);
                if (isMounted) {
                    const dataMap: Record<string, { price: number; dayChange: number }> = {};
                    stocks.forEach(stock => {
                        const data = results.find(r => r.ticker === stock.ticker);
                        if (data) {
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

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [stocks]);

    const totalPL = useMemo(() => {
        return stocks.reduce((acc, stock) => {
            const data = liveData[stock.id];
            if (data && stock.numberOfShares) {
                const pl = data.dayChange * stock.numberOfShares;
                return acc + pl;
            }
            return acc;
        }, 0);
    }, [liveData, stocks]);

    if (stocks.length === 0) {
        return <span>$0.00</span>;
    }

    if (isLoading) {
        return <span className="text-sm animate-pulse-fast">Calculating...</span>;
    }

    const plColor = totalPL >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';

    return (
        <span className={plColor}>
            {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
        </span>
    );
};
