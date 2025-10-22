import React, { useEffect, memo } from 'react';
import { getLiveStockData } from '../services/geminiService';

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
            const data = await getLiveStockData(ticker);
            if (isMounted && data) {
                onDataUpdate(data);
            }
        };

        fetchData(); // Fetch immediately on mount

        const intervalId = setInterval(fetchData, 30000); // Refresh every 30 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [ticker, onDataUpdate]);
    
    // This component no longer needs to render anything to the DOM.
    return null; 
});
