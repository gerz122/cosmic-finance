import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Asset, Account, Team, Share, User } from '../types';
import { XIcon } from './icons';
import { marketDataService } from '../services/marketDataService';

interface AddStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (stockData: Partial<Asset>, teamId?: string) => void;
    stockToEdit: Asset | null;
    accounts: Account[];
    teams: Team[];
    defaultTeamId?: string;
    allUsers: User[];
}

// A simple debounce function
const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};


export const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, onSave, stockToEdit, accounts, teams, defaultTeamId, allUsers }) => {
    const [ticker, setTicker] = useState('');
    const [name, setName] = useState('');
    const [numberOfShares, setNumberOfShares] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [strategy, setStrategy] = useState('');
    const [teamId, setTeamId] = useState(defaultTeamId || '');
    const [shares, setShares] = useState<Share[]>([]);
    const [isShared, setIsShared] = useState(false);

    const [searchResults, setSearchResults] = useState<{ticker: string, name: string}[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const isEditing = !!stockToEdit;
    
    const currentUser = allUsers.find(u => u.accounts.some(a => (accounts || []).includes(a)));


    useEffect(() => {
        if (isOpen) {
            const effectiveTeamId = (isEditing && stockToEdit?.teamId) || defaultTeamId || '';
            setTeamId(effectiveTeamId);
            setIsShared(false); // Reset

            if (isEditing && stockToEdit) {
                setTicker(stockToEdit.ticker || '');
                setName(stockToEdit.name || '');
                setNumberOfShares(String(stockToEdit.numberOfShares || ''));
                setPurchasePrice(String(stockToEdit.purchasePrice || ''));
                setTakeProfit(String(stockToEdit.takeProfit || ''));
                setStopLoss(String(stockToEdit.stopLoss || ''));
                setStrategy(stockToEdit.strategy || '');
                if (stockToEdit.shares && stockToEdit.shares.length > 1) {
                    setIsShared(true);
                    setShares(stockToEdit.shares);
                } else {
                    setShares(currentUser ? [{ userId: currentUser.id, percentage: 100 }] : []);
                }
            } else {
                // Reset form for adding new
                setTicker('');
                setName('');
                setNumberOfShares('');
                setPurchasePrice('');
                setTakeProfit('');
                setStopLoss('');
                setStrategy('');
                setShares(currentUser ? [{ userId: currentUser.id, percentage: 100 }] : []);
            }
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [isOpen, stockToEdit, isEditing, defaultTeamId, currentUser]);

    const totalPercentage = useMemo(() => shares.reduce((sum, share) => sum + (share.percentage || 0), 0), [shares]);

    const handleTickerSearch = async (query: string) => {
        if (query.length > 0) {
            setIsSearching(true);
            try {
                const results = await marketDataService.searchTickers(query);
                setSearchResults(results);
            } catch (error) {
                console.error("Ticker search failed", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const debouncedSearch = useCallback(debounce(handleTickerSearch, 300), []);

    const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toUpperCase();
        setTicker(query);
        debouncedSearch(query);
    };
    
    const handleSelectTicker = async (result: {ticker: string, name: string}) => {
        setTicker(result.ticker);
        setName(result.name);
        setSearchResults([]);
        
        try {
            const liveData = await marketDataService.getLiveStockData(result.ticker);
            if (liveData && liveData.price) {
                setPurchasePrice(liveData.price.toFixed(2));
            }
        } catch (error) {
            console.error(`Could not pre-fill price for ${result.ticker}`, error);
        }
    }
    
    const handleAddOwner = () => {
        const existingUserIds = shares.map(s => s.userId);
        const nextUser = allUsers.find(u => !existingUserIds.includes(u.id));
        if (nextUser) {
            setShares(prev => [...prev, { userId: nextUser.id, percentage: 0 }]);
        }
    };

    const handleShareChange = (index: number, field: 'userId' | 'percentage', value: string) => {
        const newShares = [...shares];
        if (field === 'percentage') {
            newShares[index].percentage = parseFloat(value) || 0;
        } else {
            newShares[index].userId = value;
        }
        setShares(newShares);
    };

    const handleRemoveOwner = (index: number) => setShares(shares.filter((_, i) => i !== index));


    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isShared && !teamId && Math.abs(totalPercentage - 100) > 0.1) {
             alert(`Ownership percentages must add up to 100%. Current total: ${totalPercentage.toFixed(2)}%`);
            return;
        }

        const stockData: Partial<Asset> = {
            ticker: ticker.toUpperCase(),
            name: name || ticker.toUpperCase(),
            numberOfShares: parseFloat(numberOfShares) || 0,
            purchasePrice: parseFloat(purchasePrice) || 0,
            ...(takeProfit && { takeProfit: parseFloat(takeProfit) }),
            ...(stopLoss && { stopLoss: parseFloat(stopLoss) }),
            ...(strategy && { strategy }),
            ...(teamId && { teamId }),
            value: (parseFloat(numberOfShares) || 0) * (parseFloat(purchasePrice) || 0),
            ...(isShared && !teamId && { shares }),
        };
        
        // Basic validation
        if (!stockData.ticker || !stockData.numberOfShares || stockData.numberOfShares <= 0 || !stockData.purchasePrice || stockData.purchasePrice <= 0) {
            alert('Please fill in Ticker, Shares, and Purchase Price.');
            return;
        }

        onSave(stockData, teamId || undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-lg shadow-2xl p-6 m-4 animate-slide-in-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">{isEditing ? 'Edit Stock' : 'Add Stock to Portfolio'}</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                    <div>
                        <label htmlFor="teamId" className="block text-sm font-medium text-cosmic-text-secondary mb-1">For</label>
                        <select id="teamId" value={teamId} onChange={e => setTeamId(e.target.value)} disabled={!!defaultTeamId} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 disabled:bg-cosmic-border">
                            <option value="">Personal</option>
                            {teams.map(teamRecord => <option key={teamRecord.id} value={teamRecord.id}>{teamRecord.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="relative">
                            <label htmlFor="ticker" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Ticker Symbol</label>
                            <input type="text" id="ticker" value={ticker} onChange={handleTickerChange} autoComplete="off" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" required />
                             { (isSearching || searchResults.length > 0) &&
                                <div className="absolute z-10 w-full mt-1 bg-cosmic-bg border border-cosmic-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {isSearching && <div className="p-2 text-xs text-cosmic-text-secondary">Searching...</div>}
                                    {searchResults.map(res => (
                                        <div key={res.ticker} onClick={() => handleSelectTicker(res)} className="p-2 hover:bg-cosmic-border cursor-pointer">
                                            <p className="font-bold text-sm text-cosmic-text-primary">{res.ticker}</p>
                                            <p className="text-xs text-cosmic-text-secondary">{res.name}</p>
                                        </div>
                                    ))}
                                </div>
                             }
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Stock Name</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} placeholder={ticker} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="numberOfShares" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Number of Shares</label>
                            <input type="number" id="numberOfShares" value={numberOfShares} onChange={e => setNumberOfShares(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" required />
                        </div>
                        <div>
                            <label htmlFor="purchasePrice" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Purchase Price / Share</label>
                            <input type="number" id="purchasePrice" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" required />
                        </div>
                    </div>
                    
                    {!teamId && (
                         <div className="space-y-3 pt-3 border-t border-cosmic-border">
                             <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" />
                                Share this personal stock with another user
                            </label>
                            {isShared && (
                                <div className="space-y-2 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-cosmic-text-primary">Ownership Split</h3>
                                        <p className={`text-sm font-semibold ${Math.abs(totalPercentage - 100) > 0.1 ? 'text-cosmic-danger' : 'text-cosmic-success'}`}>
                                            Total: {totalPercentage.toFixed(2)}%
                                        </p>
                                    </div>
                                    {shares.map((share, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <select value={share.userId} onChange={e => handleShareChange(index, 'userId', e.target.value)} className="col-span-6 bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-sm">
                                                {allUsers.map(u => <option key={u.id} value={u.id} disabled={shares.some((s, i) => i !== index && s.userId === u.id)}>{u.name}</option>)}
                                            </select>
                                            <input type="number" value={share.percentage} onChange={e => handleShareChange(index, 'percentage', e.target.value)} className="col-span-4 bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-sm text-right"/>
                                            <span className="text-cosmic-text-secondary text-sm">%</span>
                                            <button type="button" onClick={() => handleRemoveOwner(index)} disabled={shares.length <= 1} className="col-span-1 text-cosmic-danger disabled:text-cosmic-border"><XIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddOwner} className="text-sm text-cosmic-primary font-semibold">+ Add owner</button>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <p className="text-sm font-medium text-cosmic-text-secondary mb-2">Alerts & Strategy (Optional)</p>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="takeProfit" className="block text-xs font-medium text-cosmic-text-secondary mb-1">Take Profit Price</label>
                                <input type="number" id="takeProfit" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" />
                            </div>
                            <div>
                                <label htmlFor="stopLoss" className="block text-xs font-medium text-cosmic-text-secondary mb-1">Stop Loss Price</label>
                                <input type="number" id="stopLoss" value={stopLoss} onChange={e => setStopLoss(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" />
                            </div>
                        </div>
                        <div className="mt-2">
                             <label htmlFor="strategy" className="block text-xs font-medium text-cosmic-text-secondary mb-1">Strategy / Notes</label>
                             <textarea id="strategy" value={strategy} onChange={e => setStrategy(e.target.value)} rows={2} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" placeholder="e.g., Long-term hold for dividend growth..."></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-auto border-t border-cosmic-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400 transition-colors">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
