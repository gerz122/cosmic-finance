
import React, { useEffect, memo } from 'react';
import { marketDataService } from '../services/marketDataService';

export interface LiveStockData {
    price: number | null;
    dayChange: number | null;
    dayChangePercent: number | null;
}

interface StockPriceProviderProps {
    ticker: string;
    onDataUpdate: (data: LiveStockData) => void;
}

export const StockPriceProvider: React.FC<StockPriceProviderProps> = memo(({ ticker, onDataUpdate }) => {
    
    useEffect(() => {
        if (!ticker) return;

        let isMounted = true;
        
        const fetchData = async () => {
            const data = await marketDataService.getLiveStockData(ticker);
            if (isMounted && data) {
                onDataUpdate({
                    price: data.price,
                    dayChange: data.dayChange,
                    dayChangePercent: data.price > 0 && data.dayChange != null ? (data.dayChange / (data.price - data.dayChange)) * 100 : 0
                });
            }
        };

        fetchData(); // Fetch immediately on mount

        const intervalId = setInterval(fetchData, 60000); // Refresh every 60 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [ticker, onDataUpdate]);
    
    // This component no longer needs to render anything to the DOM.
    return null; 
});
