import React, { useMemo } from 'react';
import type { FinancialStatement } from '../types';
import { AssetType } from '../types';
import { DoughnutChart } from './DoughnutChart';

interface PortfolioProps {
    statement: FinancialStatement;
}

const tailwindColors = {
    primary: '#58A6FF',
    secondary: '#F778BA',
    success: '#3FB950',
    danger: '#F85149',
    yellow: '#FDB813',
    purple: '#A371F7'
};

const AssetTypeColors: { [key in AssetType]: string } = {
    [AssetType.REAL_ESTATE]: tailwindColors.primary,
    [AssetType.STOCK]: tailwindColors.success,
    [AssetType.CASH]: tailwindColors.yellow,
};

const Section: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-cosmic-surface rounded-lg border border-cosmic-border overflow-hidden">
        <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">{title}</h3>
        <div className="p-4">{children}</div>
    </div>
);

const DataRow: React.FC<{ label: string; value: string; sublabel?: string; color?: string;}> = ({ label, value, sublabel, color = 'text-cosmic-text-primary' }) => (
    <div className="flex justify-between items-center py-2 border-b border-cosmic-border last:border-b-0">
        <div>
            <p className={`font-semibold ${color}`}>{label}</p>
            {sublabel && <p className="text-xs text-cosmic-text-secondary">{sublabel}</p>}
        </div>
        <p className="font-bold text-cosmic-text-primary">{value}</p>
    </div>
);


export const Portfolio: React.FC<PortfolioProps> = ({ statement }) => {
    const { assets, liabilities } = statement;

    const assetChartData = useMemo(() => assets.map(asset => ({
        label: asset.name,
        value: asset.value,
        color: AssetTypeColors[asset.type] || tailwindColors.secondary
    })), [assets]);

    const liabilityChartData = useMemo(() => liabilities.map(lia => ({
        label: lia.name,
        value: lia.balance,
        color: tailwindColors.danger
    })), [liabilities]);

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-cosmic-text-primary">Player Portfolio</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Assets">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-shrink-0">
                            <DoughnutChart data={assetChartData} />
                        </div>
                        <div className="w-full">
                            {assets.map(asset => (
                                <DataRow 
                                    key={asset.id} 
                                    label={asset.name} 
                                    sublabel={asset.type}
                                    value={`$${asset.value.toLocaleString()}`} 
                                    color="text-cosmic-primary"
                                />
                            ))}
                        </div>
                    </div>
                </Section>
                 <Section title="Liabilities">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                         <div className="flex-shrink-0">
                            <DoughnutChart data={liabilityChartData} />
                        </div>
                        <div className="w-full">
                            {liabilities.map(liability => (
                                <DataRow 
                                    key={liability.id} 
                                    label={liability.name} 
                                    sublabel={`${liability.interestRate}% Interest`}
                                    value={`$${liability.balance.toLocaleString()}`} 
                                    color="text-cosmic-secondary"
                                />
                            ))}
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
};
