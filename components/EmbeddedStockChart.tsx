import React, { useEffect, memo, useRef } from 'react';

declare global {
    interface Window {
        TradingView: any;
    }
}

interface EmbeddedStockChartProps {
    ticker: string;
    height?: string;
    takeProfit?: number;
    stopLoss?: number;
}

const EmbeddedStockChart: React.FC<EmbeddedStockChartProps> = ({ ticker, height = '400px', takeProfit, stopLoss }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<any>(null); // To hold the widget instance

    useEffect(() => {
        const createWidget = () => {
            if (!containerRef.current || !window.TradingView) return;

            // Clear previous widget if it exists
            containerRef.current.innerHTML = '';

            const studies: any[] = [
                "MAExp@tv-basicstudies",
                "MACD@tv-basicstudies",
                "RSI@tv-basicstudies",
                "Volume@tv-basicstudies"
            ];

            const horzLines: any[] = [];
            if (takeProfit) {
                horzLines.push({
                    price: takeProfit,
                    color: "#22c55e",
                    width: 2,
                    style: 2, // 0-solid, 1-dotted, 2-dashed
                    text: "Take Profit",
                    axisLabelVisible: true,
                });
            }
            if (stopLoss) {
                horzLines.push({
                    price: stopLoss,
                    color: "#ef4444",
                    width: 2,
                    style: 2,
                    text: "Stop Loss",
                    axisLabelVisible: true,
                });
            }
            
            widgetRef.current = new window.TradingView.widget({
                "autosize": true,
                "symbol": ticker,
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "dark",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "#161B22",
                "enable_publishing": false,
                "hide_side_toolbar": true,
                "allow_symbol_change": true,
                "details": true,
                "studies": studies,
                "container_id": containerRef.current.id,
                "backgroundColor": "rgba(13, 17, 23, 1)",
                "gridColor": "rgba(48, 54, 61, 0.5)",
                "horz_lines": horzLines,
            });
        };
        
        // Use a timeout to ensure the TradingView script has loaded
        const scriptCheck = setInterval(() => {
            if (window.TradingView) {
                clearInterval(scriptCheck);
                createWidget();
            }
        }, 100);

        return () => {
            clearInterval(scriptCheck);
            if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
                widgetRef.current.remove();
                widgetRef.current = null;
            }
             if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };

    }, [ticker, takeProfit, stopLoss]);

    const containerId = `tv-advanced-chart-container-${ticker}-${Math.random().toString(36).substring(7)}`;

    return (
        <div className="tradingview-widget-container" style={{ height: height, width: '100%' }}>
            <div id={containerId} ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default memo(EmbeddedStockChart);
