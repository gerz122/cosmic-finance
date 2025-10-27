import React, { useMemo } from 'react';
import type { HistoricalDataPoint } from '../types';

interface LineChartProps {
    data: HistoricalDataPoint[];
    width?: number;
    height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {

    const { points, maxX, minVal, maxVal } = useMemo(() => {
        if (!data || data.length < 2) return { points: '', maxX: 0, minVal: 0, maxVal: 0 };

        const width = 500;
        const height = 200;
        const padding = 20;

        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const valueRange = maxVal - minVal;

        const maxX = data.length - 1;

        const points = data.map((d, i) => {
            const x = (i / maxX) * (width - 2 * padding) + padding;
            const y = height - (((d.value - minVal) / (valueRange || 1)) * (height - 2 * padding) + padding);
            return `${x},${y}`;
        }).join(' ');

        return { points, maxX, minVal, maxVal };
    }, [data]);
    
    if (!data || data.length < 2) {
        return <div className="flex items-center justify-center h-full text-cosmic-text-secondary">Not enough data to display chart.</div>
    }

    return (
        <svg viewBox="0 0 500 200" className="w-full h-full" preserveAspectRatio="none">
            {/* Grid Lines */}
            {[...Array(5)].map((_, i) => (
                <line
                    key={i}
                    x1="20"
                    y1={20 + i * (160 / 4)}
                    x2="480"
                    y2={20 + i * (160 / 4)}
                    stroke="#30363D"
                    strokeWidth="1"
                />
            ))}

            {/* Main Path */}
            <polyline
                fill="none"
                stroke="#58A6FF"
                strokeWidth="2"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Gradient under the line */}
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#58A6FF', stopOpacity: 0.4}} />
                    <stop offset="100%" style={{stopColor: '#58A6FF', stopOpacity: 0}} />
                </linearGradient>
            </defs>
            <polyline
                fill="url(#gradient)"
                stroke="none"
                points={`20,200 ${points} 480,200`}
            />

            {/* Labels (simplified) */}
            <text x="5" y="20" fill="#8B949E" fontSize="10" textAnchor="start" alignmentBaseline="middle">${maxVal.toFixed(0)}</text>
            <text x="5" y="180" fill="#8B949E" fontSize="10" textAnchor="start" alignmentBaseline="middle">${minVal.toFixed(0)}</text>
        </svg>
    );
};
