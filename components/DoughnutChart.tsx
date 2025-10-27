import React from 'react';

interface ChartData {
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

export const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, size = 200, centerLabel = "Total", onSliceClick }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return <div className="text-cosmic-text-secondary flex items-center justify-center" style={{ width: size, height: size }}>No data</div>;
    }
    
    let cumulative = 0;
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    const segments = data.map(item => {
        const percentage = item.value / total;
        const dasharray = circumference;
        const dashoffset = circumference * (1 - percentage);
        const rotation = cumulative * 360;
        cumulative += percentage;
        
        return {
            ...item,
            dasharray,
            dashoffset,
            rotation
        };
    });

    return (
        <div className="relative group" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`}>
                {segments.map((segment, index) => (
                    <circle
                        key={index}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={segment.dasharray}
                        strokeDashoffset={segment.dashoffset}
                        transform={`rotate(-90 ${center} ${center}) rotate(${segment.rotation} ${center} ${center})`}
                        className={onSliceClick ? 'cursor-pointer transition-opacity duration-200 group-hover:opacity-50 hover:!opacity-100' : ''}
                        onClick={() => onSliceClick?.(segment.label)}
                    >
                         <title>{`${segment.label}: $${segment.value.toFixed(2)}`}</title>
                    </circle>
                ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                 <span className="text-cosmic-text-secondary text-sm">{centerLabel}</span>
                 <span className="text-2xl font-bold text-cosmic-text-primary">${total.toLocaleString()}</span>
            </div>
        </div>
    );
};
