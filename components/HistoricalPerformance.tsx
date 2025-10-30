import React, { useState, useMemo } from 'react';
import type { HistoricalDataPoint, ChartSeries } from '../types';
import { AdvancedLineChart } from './AdvancedLineChart';

interface HistoricalPerformanceProps {
    data: HistoricalDataPoint[];
}

type ChartView = 'netWorth' | 'cashFlow' | 'incomeVsExpense';

const viewConfig: Record<ChartView, { title: string; series: ChartSeries[] }> = {
    netWorth: {
        title: 'Net Worth Over Time',
        series: [{ key: 'netWorth', label: 'Net Worth', color: '#58A6FF' }],
    },
    cashFlow: {
        title: 'Monthly Cash Flow',
        series: [{ key: 'cashFlow', label: 'Cash Flow', color: '#3FB950' }],
    },
    incomeVsExpense: {
        title: 'Passive Income vs. Expenses',
        series: [
            { key: 'passiveIncome', label: 'Passive Income', color: '#58A6FF' },
            { key: 'expenses', label: 'Expenses', color: '#F85149' },
        ],
    },
};

export const HistoricalPerformance: React.FC<HistoricalPerformanceProps> = ({ data }) => {
    const [activeView, setActiveView] = useState<ChartView>('netWorth');

    const chartData = useMemo(() => {
        const currentKeys = viewConfig[activeView].series.map(seriesItem => seriesItem.key);
        // Fill forward logic: If a data point doesn't have a value for a key, use the last known value.
        let lastKnownValues: Record<string, number> = {};
        return data.map(dataPoint => {
            const newPoint = { date: dataPoint.date };
            currentKeys.forEach(key => {
                if (dataPoint[key] !== undefined) {
                    lastKnownValues[key] = dataPoint[key] as number;
                }
                (newPoint as any)[key] = lastKnownValues[key];
            });
            return newPoint as HistoricalDataPoint;
        }).filter(point => currentKeys.some(key => point[key] !== undefined));
    }, [data, activeView]);

    return (
        <div className="animate-fade-in space-y-6">
             <div>
                <h1 className="text-3xl font-bold text-cosmic-text-primary">Historical Analysis</h1>
                <p className="text-cosmic-text-secondary">Visualize your financial journey through the cosmos.</p>
            </div>

            <div className="bg-cosmic-surface p-2 rounded-lg border border-cosmic-border self-start flex items-center gap-2">
                {(Object.keys(viewConfig) as ChartView[]).map(viewKey => (
                    <button 
                        key={viewKey}
                        onClick={() => setActiveView(viewKey)}
                        className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
                            activeView === viewKey ? 'bg-cosmic-primary text-white' : 'bg-transparent text-cosmic-text-primary hover:bg-cosmic-border'
                        }`}
                    >
                        {viewConfig[viewKey].title}
                    </button>
                ))}
            </div>

            <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                <h2 className="text-xl font-bold text-cosmic-text-primary mb-4">{viewConfig[activeView].title}</h2>
                <div className="h-96">
                    {chartData.length > 1 ? (
                        <AdvancedLineChart 
                            data={chartData} 
                            series={viewConfig[activeView].series} 
                        />
                    ) : (
                         <div className="flex items-center justify-center h-full text-cosmic-text-secondary">
                            <p>Not enough data to display this chart. Keep adding transactions to see your history grow!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
