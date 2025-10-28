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

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");

    return d;
};

export const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, size = 200, centerLabel, onSliceClick }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ width: size, height: size }} className="flex items-center justify-center">
                <p className="text-sm text-cosmic-text-secondary">No data</p>
            </div>
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
         return (
            <div style={{ width: size, height: size }} className="flex items-center justify-center">
                <p className="text-sm text-cosmic-text-secondary">No data</p>
            </div>
        );
    }
    
    const radius = size / 2;
    const strokeWidth = radius * 0.4;
    const innerRadius = radius - strokeWidth;
    let startAngle = 0;

    const slices = data.map(item => {
        const angle = (item.value / total) * 360;
        const endAngle = startAngle + angle;
        const pathData = describeArc(radius, radius, innerRadius + strokeWidth / 2, startAngle, endAngle > 359.99 ? 359.99 : endAngle);
        const slice = {
            path: pathData,
            color: item.color,
            label: item.label
        };
        startAngle = endAngle;
        return slice;
    });

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <g>
                    {slices.map((slice, index) => (
                        <path
                            key={index}
                            d={slice.path}
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={strokeWidth}
                            onClick={() => onSliceClick && onSliceClick(slice.label)}
                            className={onSliceClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                        >
                            <title>{`${slice.label}: ${((data[index].value / total) * 100).toFixed(1)}%`}</title>
                        </path>
                    ))}
                </g>
            </svg>
            {centerLabel && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="text-xs text-cosmic-text-secondary">{centerLabel}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
