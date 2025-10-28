import React, { useState, useEffect, useCallback } from 'react';
import type { Asset, Account, Team } from '../types';
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


export const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, onSave, stockToEdit, accounts, teams, defaultTeamId }) => {
    const [ticker, setTicker] = useState('');
    const [name, setName] = useState('');
    const [numberOfShares, setNumberOfShares] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [strategy, setStrategy] = useState('');
    const [teamId, setTeamId] = useState(defaultTeamId || '');
    
    const [searchResults, setSearchResults] = useState<{ticker: string, name: string}[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const isEditing = !!stockToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditing && stockToEdit) {
                setTicker(stockToEdit.ticker || '');
                setName(stockToEdit.name || '');
                setNumberOfShares(String(stockToEdit.numberOfShares || ''));
                setPurchasePrice(String(stockToEdit.purchasePrice || ''));
                setTakeProfit(String(stockToEdit.takeProfit || ''));
                setStopLoss(String(stockToEdit.stopLoss || ''));
                setStrategy(stockToEdit.strategy || '');
                setTeamId(stockToEdit.teamId || '');
            } else {
                // Reset form for adding new
                setTicker('');
                setName('');
                setNumberOfShares('');
                setPurchasePrice('');
                setTakeProfit('');
                setStopLoss('');
                setStrategy('');
                setTeamId(defaultTeamId || '');
            }
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [isOpen, stockToEdit, isEditing, defaultTeamId]);

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

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const stockData: Partial<Asset> = {
            ticker: ticker.toUpperCase(),
            name: name || ticker.toUpperCase(), // Default name to ticker if empty
            numberOfShares: parseFloat(numberOfShares) || 0,
            purchasePrice: parseFloat(purchasePrice) || 0,
            takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
            stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
            strategy: strategy || undefined,
            teamId: teamId || undefined,
            value: (parseFloat(numberOfShares) || 0) * (parseFloat(purchasePrice) || 0) // Set initial value
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
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-lg shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">{isEditing ? 'Edit Stock' : 'Add Stock to Portfolio'}</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="teamId" className="block text-sm font-medium text-cosmic-text-secondary mb-1">For</label>
                        <select id="teamId" value={teamId} onChange={e => setTeamId(e.target.value)} disabled={!!defaultTeamId} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 disabled:bg-cosmic-border">
                            <option value="">Personal</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="relative">
                            <label htmlFor="ticker" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Ticker Symbol</label>
                            <input type="text" id="ticker" value={ticker} onChange={handleTickerChange} autoComplete="off" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
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
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} placeholder={ticker} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="numberOfShares" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Number of Shares</label>
                            <input type="number" id="numberOfShares" value={numberOfShares} onChange={e => setNumberOfShares(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                        </div>
                        <div>
                            <label htmlFor="purchasePrice" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Purchase Price / Share</label>
                            <input type="number" id="purchasePrice" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-cosmic-text-secondary mb-2">Alerts & Strategy (Optional)</p>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="takeProfit" className="block text-xs font-medium text-cosmic-text-secondary mb-1">Take Profit Price</label>
                                <input type="number" id="takeProfit" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" />
                            </div>
                            <div>
                                <label htmlFor="stopLoss" className="block text-xs font-medium text-cosmic-text-secondary mb-1">Stop Loss Price</label>
                                <input type="number" id="stopLoss" value={stopLoss} onChange={e => setStopLoss(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" />
                            </div>
                        </div>
                        <div className="mt-2">
                             <label htmlFor="strategy" className="block text-xs font-medium text-cosmic-text-secondary mb-1">Strategy / Notes</label>
                             <textarea id="strategy" value={strategy} onChange={e => setStrategy(e.target.value)} rows={2} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" placeholder="e.g., Long-term hold for dividend growth..."></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400 transition-colors">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
