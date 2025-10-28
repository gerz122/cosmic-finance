import React, { useState } from 'react';
import { SparklesIcon, UploadIcon } from './icons';
import { parseStatementWithGemini } from '../services/geminiService';

interface ParsedTransaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    accountId: string;
}

const defaultCategories = ['Food', 'Transportation', 'Shopping', 'Job', 'Utilities', 'Entertainment', 'Transfer', 'Other'];

export const StatementImporter: React.FC = () => {
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState('');
    const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setError(null);
            const reader = new FileReader();
            reader.onload = (event) => {
                setText(event.target?.result as string);
                setParsedTransactions([]);
            };
            reader.readAsText(file);
        }
    };

    const handleAnalyze = async () => {
        if (!text.trim()) {
            alert("Please upload a file or paste statement text first.");
            return;
        }
        setIsAnalyzing(true);
        setError(null);
        setParsedTransactions([]);
        
        try {
            const results = await parseStatementWithGemini(text);
            // Add default empty category/accountId for review step
            const reviewableResults = results.map((tx: any) => ({
                ...tx,
                category: '',
                accountId: ''
            }));
            setParsedTransactions(reviewableResults);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleTransactionUpdate = (id: number, field: keyof ParsedTransaction, value: string | number) => {
        setParsedTransactions(current => 
            current.map(tx => tx.id === id ? { ...tx, [field]: value } : tx)
        );
    };

    const handleImport = () => {
        // In a real implementation, this would save the `parsedTransactions` array to the database.
        alert(`Importing ${parsedTransactions.length} transactions! (This is a demo)`);
        setParsedTransactions([]);
        setText('');
        setFileName('');
    };

    return (
        <div className="animate-fade-in space-y-6">
             <div>
                <h1 className="text-3xl font-bold text-cosmic-text-primary">Intelligent Import</h1>
                <p className="text-cosmic-text-secondary">Upload a bank statement or paste text to auto-detect transactions with AI.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cosmic-surface p-6 rounded-lg border border-cosmic-border flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-cosmic-text-primary">1. Provide Data</h2>
                    <div>
                        <label htmlFor="file-upload" className="w-full text-center cursor-pointer bg-cosmic-bg border-2 border-dashed border-cosmic-border rounded-lg p-8 hover:border-cosmic-primary transition-colors">
                            <UploadIcon className="w-10 h-10 mx-auto text-cosmic-text-secondary" />
                            <p className="mt-2 font-semibold text-cosmic-primary">Click to upload a file</p>
                            <p className="text-xs text-cosmic-text-secondary">(.txt, .csv)</p>
                            {fileName && <p className="text-sm mt-2 text-cosmic-success font-semibold">{fileName}</p>}
                        </label>
                        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.csv"/>
                    </div>
                    <div className="flex items-center gap-2">
                        <hr className="flex-grow border-cosmic-border" />
                        <span className="text-cosmic-text-secondary text-sm">OR</span>
                        <hr className="flex-grow border-cosmic-border" />
                    </div>
                    <textarea 
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            setFileName('');
                            setParsedTransactions([]);
                            setError(null);
                        }}
                        rows={6}
                        placeholder="Paste statement text here..."
                        className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-sm"
                    />
                </div>

                <div className="bg-cosmic-surface p-6 rounded-lg border border-cosmic-border flex flex-col justify-center items-center gap-4">
                    <h2 className="text-xl font-bold text-cosmic-text-primary">2. Analyze & Review</h2>
                    <p className="text-cosmic-text-secondary text-center">Let the AI parse your data. You'll be able to review and categorize everything before importing.</p>
                     <button onClick={handleAnalyze} disabled={isAnalyzing || !text.trim()} className="w-full flex items-center justify-center gap-2 bg-cosmic-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-400 transition-colors disabled:bg-cosmic-border disabled:cursor-not-allowed">
                        {isAnalyzing ? (
                             <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5" />
                                <span>Analyze with AI</span>
                            </>
                        )}
                    </button>
                    {error && <p className="text-sm text-center text-cosmic-danger mt-2">{error}</p>}
                </div>
            </div>

            {parsedTransactions.length > 0 && (
                <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border">
                    <h2 className="text-xl font-bold text-cosmic-text-primary mb-4">3. Review Transactions</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-cosmic-text-secondary">
                                <tr>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Description</th>
                                    <th className="p-2 text-right">Amount</th>
                                    <th className="p-2">Category</th>
                                    <th className="p-2">Account</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedTransactions.map(tx => (
                                    <tr key={tx.id} className="border-b border-cosmic-border last:border-0 hover:bg-cosmic-bg">
                                        <td className="p-2"><input type="date" value={tx.date} onChange={(e) => handleTransactionUpdate(tx.id, 'date', e.target.value)} className="bg-transparent w-full"/></td>
                                        <td className="p-2"><input type="text" value={tx.description} onChange={(e) => handleTransactionUpdate(tx.id, 'description', e.target.value)} className="bg-transparent w-full"/></td>
                                        <td className={`p-2 text-right font-semibold ${tx.type === 'income' ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                value={tx.category} 
                                                onChange={(e) => handleTransactionUpdate(tx.id, 'category', e.target.value)}
                                                className="w-full bg-cosmic-bg border border-cosmic-border rounded p-1"
                                            >
                                                <option value="">Select Category...</option>
                                                {defaultCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                 value={tx.accountId} 
                                                 onChange={(e) => handleTransactionUpdate(tx.id, 'accountId', e.target.value)}
                                                 className="w-full bg-cosmic-bg border border-cosmic-border rounded p-1"
                                            >
                                                <option value="">Select Account...</option>
                                                {/* In real app, map user accounts here */}
                                                <option value="acc1">Checking</option>
                                                <option value="acc2">Credit Card</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={handleImport} className="bg-cosmic-success text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                            Import {parsedTransactions.length} Transactions
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};