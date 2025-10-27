import React from 'react';
import EmbeddedStockChart from './EmbeddedStockChart';
import { XIcon } from './icons';
import type { Asset } from '../types';

interface LargeChartModalProps {
    stock: Asset;
    onClose: () => void;
}

export const LargeChartModal: React.FC<LargeChartModalProps> = ({ stock, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-cosmic-bg bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" 
            onClick={onClose}
        >
            <div 
                className="bg-cosmic-surface rounded-lg border border-cosmic-border w-11/12 h-5/6 shadow-2xl p-4 flex flex-col animate-slide-in-up" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                    <h2 className="text-xl font-bold text-cosmic-text-primary">Chart: {stock.ticker}</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow w-full h-full min-h-0">
                    <EmbeddedStockChart 
                        ticker={stock.ticker!} 
                        height="100%" 
                        takeProfit={stock.takeProfit}
                        stopLoss={stock.stopLoss}
                    />
                </div>
            </div>
        </div>
    );
};