import React, { useEffect, useRef, useState, memo } from 'react';
import type { Asset } from '../types';

declare global {
    interface Window {
        TradingView: any;
    }
}

interface RealTimeStockDataProps {
    stock: Asset;
    isPriceOnly?: boolean;
}

export const RealTimeStockData: React.FC<RealTimeStockDataProps> = memo(({ stock, isPriceOnly = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pl, setPl] = useState<{ value: number; percent: number } | null>(null);
    const widgetId = `tradingview-widget-${stock.id}-${isPriceOnly ? 'price' : 'pl'}-${Math.random()}`;

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "symbol": stock.ticker,
            "width": "100%",
            "locale": "en",
            "colorTheme": "dark",
            "isTransparent": true
        });

        if (containerRef.current) {
            containerRef.current.innerHTML = ''; // Clear previous widget
            containerRef.current.appendChild(script);
        }

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const priceElement = containerRef.current?.querySelector('.tv-symbol-price-quote__value span:first-child');
                    if (priceElement) {
                        const priceText = priceElement.textContent;
                        if (priceText) {
                            const currentPrice = parseFloat(priceText.replace(/,/g, ''));
                            if (!isNaN(currentPrice) && stock.purchasePrice && stock.shares) {
                                const pValue = (currentPrice - stock.purchasePrice) * stock.shares;
                                const pPercent = ((currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100;
                                setPl({ value: pValue, percent: pPercent });
                                // No need to disconnect, we want live updates
                            }
                        }
                    }
                }
            }
        });
        
        if (containerRef.current && !isPriceOnly) {
            observer.observe(containerRef.current, { childList: true, subtree: true, characterData: true });
        }

        return () => {
            observer.disconnect();
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [stock, isPriceOnly]);

    if (isPriceOnly) {
        return <div ref={containerRef} id={widgetId} style={{ height: '40px', pointerEvents: 'none' }} />;
    }

    if (!pl) {
        return <span className="text-xs text-cosmic-text-secondary">Loading P/L...</span>;
    }
    
    const plColor = pl.value >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';

    return (
        <div>
            <p className={`font-bold ${plColor}`}>
                {pl.value >= 0 ? '+' : ''}${pl.value.toFixed(2)}
            </p>
            <p className={`text-xs ${plColor}`}>
                ({pl.percent.toFixed(2)}%)
            </p>
        </div>
    );
});