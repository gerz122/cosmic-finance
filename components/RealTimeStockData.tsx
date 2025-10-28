
import React, { useEffect, memo } from 'react';
// Fix: Import marketDataService which contains the getLiveStockData function.
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
            // Fix: Call getLiveStockData from the imported marketDataService.
            const data = await marketDataService.getLiveStockData(ticker);
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
