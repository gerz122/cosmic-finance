import React, { useEffect, memo, useRef } from 'react';

declare global {
    interface Window {
        TradingView: any;
    }
}

interface EmbeddedStockChartProps {
    ticker: string;
}

const EmbeddedStockChart: React.FC<EmbeddedStockChartProps> = ({ ticker }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetLoaded = useRef(false);

    useEffect(() => {
        if (widgetLoaded.current || !containerRef.current || !window.TradingView) {
            return;
        }

        const createWidget = () => {
            if (!containerRef.current) return;
            
            // Clear container and create widget
            containerRef.current.innerHTML = '';
            new window.TradingView.widget({
                "autosize": true,
                "symbol": ticker,
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "dark",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "#f1f3f6",
                "enable_publishing": false,
                "hide_side_toolbar": true,
                "allow_symbol_change": true,
                "details": true,
                "studies": [
                    "MAExp@tv-basicstudies",
                    "MACD@tv-basicstudies",
                    "RSI@tv-basicstudies",
                    "Volume@tv-basicstudies"
                ],
                "container_id": containerRef.current.id
            });
            widgetLoaded.current = true;
        };
        
        createWidget();

    }, [ticker]);

    const containerId = `tv-advanced-chart-container-${ticker}-${Math.random().toString(36).substring(7)}`;

    return (
        <div className="tradingview-widget-container" style={{ height: '400px', width: '100%' }}>
            <div id={containerId} ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default memo(EmbeddedStockChart);