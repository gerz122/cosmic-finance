import React from 'react';

export interface ChartData {
    label: string;
    value: number;
    color: string;
}

interface DoughnutChartProps {
    data: ChartData[];
    size?: number;
    centerLabel?: string;
    onSliceClick?: (label: string) => void;
}

const getCoords = (percent: number, radius: number, size: number) => {
    const x = size / 2 + radius * Math.cos(2 * Math.PI * percent);
    const y = size / 2 + radius * Math.sin(2 * Math.PI * percent);
    return [x, y];
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, size = 200, centerLabel, onSliceClick }) => {
    const total = data.reduce((sum, chartItem) => sum + chartItem.value, 0);

    if (total === 0) {
        return (
            <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
                 <svg viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={size * 0.4}
                        fill="transparent"
                        stroke="#30363D"
                        strokeWidth={size * 0.15}
                    />
                </svg>
                <span className="absolute text-cosmic-text-secondary text-sm">No data</span>
            </div>
        );
    }

    let cumulativePercent = 0;
    
    const outerRadius = size * 0.45;
    const innerRadius = size * 0.3;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                {data.map((chartItem) => {
                    const percent = chartItem.value / total;
                    
                    const [startX, startY] = getCoords(cumulativePercent, outerRadius, size);
                    const [startInnerX, startInnerY] = getCoords(cumulativePercent, innerRadius, size);
                    
                    cumulativePercent += percent;
                    
                    const [endX, endY] = getCoords(cumulativePercent, outerRadius, size);
                    const [endInnerX, endInnerY] = getCoords(cumulativePercent, innerRadius, size);
                    
                    const largeArcFlag = percent > 0.5 ? 1 : 0;

                    const pathData = [
                        `M ${startX} ${startY}`,
                        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `L ${endInnerX} ${endInnerY}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInnerX} ${startInnerY}`,
                        'Z'
                    ].join(' ');

                    return (
                        <path
                            key={chartItem.label}
                            d={pathData}
                            fill={chartItem.color}
                            onClick={() => onSliceClick && onSliceClick(chartItem.label)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                        />
                    );
                })}
            </svg>
             {centerLabel && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
                    <span className="text-cosmic-text-secondary font-semibold text-sm">{centerLabel}</span>
                </div>
            )}
        </div>
    );
};
