import React, { useState } from 'react';
import { SparklesIcon, UploadIcon, PlusIcon } from './icons';
import { parseStatementWithGemini } from '../services/geminiService';
import type { User, Transaction } from '../types';
import { AddCategoryModal } from './AddCategoryModal';

interface ParsedTransactionForReview {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    accountId: string;
}

interface StatementImporterProps {
    user: User;
    onImport: (transactions: ParsedTransactionForReview[]) => void;
    allCategories: string[];
    onAddCategory: (category: string) => void;
}

export const StatementImporter: React.FC<StatementImporterProps> = ({ user, onImport, allCategories, onAddCategory }) => {
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState('');
    const [parsedTransactions, setParsedTransactions] = useState<ParsedTransactionForReview[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

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
            const reviewableResults = results.map((transactionRecord: any) => ({
                ...transactionRecord,
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
    
    const handleTransactionUpdate = (id: number, field: keyof ParsedTransactionForReview, value: string | number) => {
        setParsedTransactions(current => 
            current.map(tx => tx.id === id ? { ...tx, [field]: value } : tx)
        );
    };

    const handleImportClick = () => {
        const incompleteTransaction = parsedTransactions.find(tx => !tx.accountId || !tx.category);
        if (incompleteTransaction) {
            alert(`Please assign an account and category for all transactions. The transaction "${incompleteTransaction.description}" is incomplete.`);
            return;
        }
        onImport(parsedTransactions);
        setParsedTransactions([]);
        setText('');
        setFileName('');
    };

    const handleAddNewCategory = (newCategory: string) => {
        onAddCategory(newCategory);
        // Optionally, find the first transaction without a category and set it
        const firstUncategorized = parsedTransactions.find(tx => !tx.category);
        if (firstUncategorized) {
            handleTransactionUpdate(firstUncategorized.id, 'category', newCategory);
        }
    };


    return (
        <div className="animate-fade-in space-y-8">
            <AddCategoryModal 
                isOpen={isAddCategoryModalOpen} 
                onClose={() => setIsAddCategoryModalOpen(false)} 
                onAddCategory={handleAddNewCategory} 
            />
             <div>
                <h1 className="text-3xl font-bold text-cosmic-text-primary">Intelligent Import</h1>
                <p className="text-cosmic-text-secondary">Upload a bank statement or paste text to auto-detect transactions with AI.</p>
            </div>

            {/* Step 1: Provide Data */}
            <div className="bg-cosmic-surface p-6 rounded-lg border border-cosmic-border">
                <h2 className="text-xl font-bold text-cosmic-text-primary mb-4">Step 1: Provide Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="file-upload" className="w-full text-center cursor-pointer bg-cosmic-bg border-2 border-dashed border-cosmic-border rounded-lg p-8 hover:border-cosmic-primary transition-colors flex flex-col items-center justify-center h-full">
                            <UploadIcon className="w-10 h-10 mx-auto text-cosmic-text-secondary" />
                            <p className="mt-2 font-semibold text-cosmic-primary">Click to upload a file</p>
                            <p className="text-xs text-cosmic-text-secondary">(.txt, .csv)</p>
                            {fileName && <p className="text-sm mt-2 text-cosmic-success font-semibold">{fileName}</p>}
                        </label>
                        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.csv"/>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2 md:hidden">
                            <hr className="flex-grow border-cosmic-border" /><span className="text-cosmic-text-secondary text-sm">OR</span><hr className="flex-grow border-cosmic-border" />
                        </div>
                        <textarea 
                            value={text}
                            onChange={(e) => { setText(e.target.value); setFileName(''); setParsedTransactions([]); setError(null); }}
                            rows={8}
                            placeholder="Or paste statement text here..."
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-sm flex-grow"
                        />
                    </div>
                </div>
            </div>

            {/* Step 2: Analyze */}
            <div className="bg-cosmic-surface p-6 rounded-lg border border-cosmic-border flex flex-col justify-center items-center gap-4">
                <h2 className="text-xl font-bold text-cosmic-text-primary">Step 2: Analyze</h2>
                <p className="text-cosmic-text-secondary text-center">Let the AI parse your data. You'll be able to review and categorize everything before importing.</p>
                 <button onClick={handleAnalyze} disabled={isAnalyzing || !text.trim()} className="w-full max-w-xs flex items-center justify-center gap-2 bg-cosmic-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-400 transition-colors disabled:bg-cosmic-border disabled:cursor-not-allowed">
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

            {/* Step 3: Review */}
            {parsedTransactions.length > 0 && (
                <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-cosmic-text-primary">Step 3: Review Transactions</h2>
                         <button onClick={() => setIsAddCategoryModalOpen(true)} className="flex items-center gap-2 text-sm bg-cosmic-bg border border-cosmic-border text-cosmic-primary font-semibold py-1 px-3 rounded-md hover:bg-cosmic-border">
                            <PlusIcon className="w-4 h-4" /> Add New Category
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-cosmic-text-secondary">
                                <tr>
                                    <th className="p-2">Date</th>
                                    <th className="p-2 w-2/5">Description</th>
                                    <th className="p-2 text-right">Amount</th>
                                    <th className="p-2">Category</th>
                                    <th className="p-2">Account</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedTransactions.map(tx => (
                                    <tr key={tx.id} className="border-b border-cosmic-border last:border-0 hover:bg-cosmic-bg">
                                        <td className="p-2"><input type="date" value={tx.date} onChange={(e) => handleTransactionUpdate(tx.id, 'date', e.target.value)} className="bg-cosmic-bg border border-cosmic-border rounded p-1 w-full"/></td>
                                        <td className="p-2"><input type="text" value={tx.description} onChange={(e) => handleTransactionUpdate(tx.id, 'description', e.target.value)} className="bg-cosmic-bg border border-cosmic-border rounded p-1 w-full"/></td>
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
                                                {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                 value={tx.accountId} 
                                                 onChange={(e) => handleTransactionUpdate(tx.id, 'accountId', e.target.value)}
                                                 className="w-full bg-cosmic-bg border border-cosmic-border rounded p-1"
                                            >
                                                <option value="">Select Account...</option>
                                                {user.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={handleImportClick} className="bg-cosmic-success text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                            Import {parsedTransactions.length} Transactions
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};