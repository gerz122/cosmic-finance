import React, { useEffect, useRef, memo } from 'react';

declare global {
    interface Window {
        TradingView: any;
    }
}

export interface LiveStockData {
    price: number;
    dayChange: number;
    dayChangePercent: number;
}

interface StockPriceProviderProps {
    ticker: string;
    onDataUpdate: (data: LiveStockData) => void;
}

export const StockPriceProvider: React.FC<StockPriceProviderProps> = memo(({ ticker, onDataUpdate }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastReportedPrice = useRef<number | null>(null);

    useEffect(() => {
        if (!ticker) return;

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "symbol": ticker,
            "width": "100%",
            "locale": "en",
            "colorTheme": "dark",
            "isTransparent": true
        });

        const currentContainer = containerRef.current;
        if (currentContainer) {
            currentContainer.innerHTML = '';
            currentContainer.appendChild(script);
        }

        const observer = new MutationObserver(() => {
            if (!currentContainer) return;

            const priceElement = currentContainer.querySelector('.tv-symbol-price-quote__value span:first-child');
            const changeElement = currentContainer.querySelector('.tv-symbol-price-quote__change-value');
            
            if (priceElement?.textContent && changeElement?.textContent) {
                const price = parseFloat(priceElement.textContent.replace(/,/g, ''));

                const changeContent = changeElement.textContent;
                const changeParts = changeContent.split(/\s+/);
                const dayChange = parseFloat(changeParts[0]);
                const dayChangePercent = parseFloat(changeParts[1]?.replace(/[()%]/g, ''));

                if (!isNaN(price) && !isNaN(dayChange) && !isNaN(dayChangePercent) && price !== lastReportedPrice.current) {
                    lastReportedPrice.current = price;
                    onDataUpdate({ price, dayChange, dayChangePercent });
                }
            }
        });
        
        if (currentContainer) {
            observer.observe(currentContainer, { childList: true, subtree: true, characterData: true });
        }

        return () => observer.disconnect();
    }, [ticker, onDataUpdate]);
    
    return <div ref={containerRef} style={{ display: 'none' }} />;
});