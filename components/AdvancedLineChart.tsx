import React, { useState, useMemo, useRef, useCallback } from 'react';
import type { HistoricalDataPoint, ChartSeries } from '../types';

interface AdvancedLineChartProps {
    data: HistoricalDataPoint[];
    series: ChartSeries[];
}

const PADDING = { top: 20, right: 20, bottom: 40, left: 60 };

export const AdvancedLineChart: React.FC<AdvancedLineChartProps> = ({ data, series }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; data: HistoricalDataPoint } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const { width, height, xScale, yScales, paths, gridLines, xLabels, yLabels } = useMemo(() => {
        if (!data || data.length < 1) return { width: 0, height: 0, xScale: () => 0, yScales: {}, paths: {}, gridLines: [], xLabels: [], yLabels: [] };

        const w = 800;
        const h = 400;

        const dateValues = data.map(dataPoint => new Date(dataPoint.date).getTime());
        const minTime = Math.min(...dateValues);
        const maxTime = Math.max(...dateValues);

        const localXScale = (time: number) => PADDING.left + ((time - minTime) / (maxTime - minTime || 1)) * (w - PADDING.left - PADDING.right);

        const localYScales: { [key: string]: (val: number) => number } = {};
        const localPaths: { [key: string]: string } = {};
        let allValues: number[] = [];

        series.forEach(seriesItem => {
            const values = data.map(dataPoint => dataPoint[seriesItem.key] as number).filter(v => v !== undefined && v !== null);
            allValues.push(...values);
        });
        
        const minY = Math.min(0, ...allValues);
        const maxY = Math.max(...allValues);

        series.forEach(seriesItem => {
             localYScales[seriesItem.key] = (val: number) => h - PADDING.bottom - ((val - minY) / (maxY - minY || 1)) * (h - PADDING.top - PADDING.bottom);
             
             const points = data
                .map(point => {
                    const val = point[seriesItem.key] as number;
                    if(val === undefined || val === null) return null;
                    const x = localXScale(new Date(point.date).getTime());
                    const y = localYScales[seriesItem.key](val);
                    return `${x},${y}`;
                })
                .filter(Boolean)
                .join(' ');

            localPaths[seriesItem.key] = points;
        });

        // Grid Lines and Labels
        const numGridLines = 5;
        const localGridLines = [...Array(numGridLines)].map((_, i) => {
            const y = PADDING.top + i * ((h - PADDING.top - PADDING.bottom) / (numGridLines - 1));
            const value = maxY - i * ((maxY - minY) / (numGridLines - 1));
            return { y, value: value.toLocaleString() };
        });

        const numXLabels = Math.min(data.length, 6);
        const localXLabels = [...Array(numXLabels)].map((_, i) => {
            const index = Math.floor(i * (data.length - 1) / (numXLabels - 1));
            const date = new Date(data[index].date);
            return {
                x: localXScale(date.getTime()),
                label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            };
        });

        return { width: w, height: h, xScale: localXScale, yScales: localYScales, paths: localPaths, gridLines: localGridLines, xLabels: localXLabels, yLabels: localGridLines };
    }, [data, series]);
    
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || data.length === 0) return;
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const { x } = pt.matrixTransform(svg.getScreenCTM()!.inverse());

        let closestIndex = 0;
        let minDistance = Infinity;
        for (let i = 0; i < data.length; i++) {
            const dataX = xScale(new Date(data[i].date).getTime());
            const distance = Math.abs(x - dataX);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }
        
        const closestData = data[closestIndex];
        const tooltipX = xScale(new Date(closestData.date).getTime());
        setTooltip({ x: tooltipX, y: PADDING.top, data: closestData });

    }, [data, xScale]);

    if (!data || data.length < 1) return null;

    return (
        <div className="w-full h-full relative">
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
                {/* Grid */}
                {gridLines.map(gridLine => (
                    <g key={gridLine.y}>
                        <line x1={PADDING.left} y1={gridLine.y} x2={width - PADDING.right} y2={gridLine.y} stroke="#30363D" strokeWidth="1" />
                        <text x={PADDING.left - 8} y={gridLine.y} fill="#8B949E" fontSize="10" textAnchor="end" alignmentBaseline="middle">{gridLine.value}</text>
                    </g>
                ))}
                {xLabels.map(xLabel => (
                     <text key={xLabel.label} x={xLabel.x} y={height - PADDING.bottom + 15} fill="#8B949E" fontSize="10" textAnchor="middle">{xLabel.label}</text>
                ))}

                {/* Paths */}
                {series.map(seriesItem => (
                    paths[seriesItem.key] && (
                        <polyline key={seriesItem.key} fill="none" stroke={seriesItem.color} strokeWidth="2.5" points={paths[seriesItem.key]} strokeLinecap="round" strokeLinejoin="round" />
                    )
                ))}

                {/* Tooltip */}
                {tooltip && (
                    <g>
                        <line x1={tooltip.x} y1={PADDING.top} x2={tooltip.x} y2={height - PADDING.bottom} stroke="#8B949E" strokeWidth="1" strokeDasharray="4" />
                        {series.map(seriesItem => {
                            const value = tooltip.data[seriesItem.key] as number;
                            if (value === undefined || value === null) return null;
                            const y = yScales[seriesItem.key](value);
                            return <circle key={seriesItem.key} cx={tooltip.x} cy={y} r="5" fill={seriesItem.color} stroke="#161B22" strokeWidth="2" />;
                        })}
                    </g>
                )}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4 text-xs">
                {series.map(seriesItem => (
                    <div key={seriesItem.key} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seriesItem.color }}></span>
                        <span className="text-cosmic-text-secondary">{seriesItem.label}</span>
                    </div>
                ))}
            </div>

            {/* Tooltip HTML */}
            {tooltip && (
                <div className="absolute pointer-events-none p-2 rounded-md bg-cosmic-bg border border-cosmic-border text-xs shadow-lg"
                     style={{ 
                        left: `${tooltip.x + 10}px`, 
                        top: `${tooltip.y + 10}px`, 
                        transform: `translateX(${tooltip.x > width / 2 ? '-110%' : '10%'})` 
                    }}
                >
                    <p className="font-bold mb-1">{new Date(tooltip.data.date).toLocaleDateString()}</p>
                    {series.map(seriesItem => {
                        const value = tooltip.data[seriesItem.key] as number;
                        if (value === undefined || value === null) return null;
                        return (
                            <div key={seriesItem.key} className="flex justify-between items-center gap-4">
                                <span style={{ color: seriesItem.color }}>{seriesItem.label}:</span>
                                <span className="font-semibold">{value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};