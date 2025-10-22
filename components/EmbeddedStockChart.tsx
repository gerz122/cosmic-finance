import React, { useEffect, memo } from 'react';

declare global {
    interface Window {
        TradingView: any;
    }
}

interface EmbeddedStockChartProps {
    ticker: string;
}

const EmbeddedStockChart: React.FC<EmbeddedStockChartProps> = ({ ticker }) => {
    const containerId = `tv-advanced-chart-container-${ticker}-${Math.random()}`;

    useEffect(() => {
        if (window.TradingView && document.getElementById(containerId)) {
            new window.TradingView.widget({
                "width": "100%",
                "height": 400,
                "symbol": ticker,
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "dark",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "#f1f3f6",
                "enable_publishing": false,
                "hide_side_toolbar": false,
                "allow_symbol_change": true,
                "details": true,
                "studies": [
                    "MAExp@tv-basicstudies",
                    "MACD@tv-basicstudies",
                    "RSI@tv-basicstudies",
                    "Volume@tv-basicstudies"
                ],
                "container_id": containerId
            });
        }
    }, [ticker, containerId]);

    return (
        <div className="tradingview-widget-container" style={{ height: 400, width: '100%' }}>
            <div id={containerId} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default memo(EmbeddedStockChart);