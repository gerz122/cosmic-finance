import React, { useState } from 'react';
import { SparklesIcon, UploadIcon, PlusIcon, CheckCircleIcon, CreditCardIcon, TeamsIcon } from './icons';
import { analyzeTextWithTools } from '../services/geminiService';
import type { User, Team, Account } from '../types';

interface StatementImporterProps {
    user: User;
    teams: Team[];
    onImport: (actions: any[]) => void;
    allCategories: string[];
    onAddCategory: (category: string, callback?: (newCategory: string) => void) => void;
    actions: any;
}

export const StatementImporter: React.FC<StatementImporterProps> = ({ user, teams, onImport, allCategories, onAddCategory, actions }) => {
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState('');
    const [proposedActions, setProposedActions] = useState<any[]>([]);
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
                setProposedActions([]);
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
        setProposedActions([]);
        
        try {
            const response = await analyzeTextWithTools(text);
            if (response.functionCalls && response.functionCalls.length > 0) {
                setProposedActions(response.functionCalls.map(fc => ({ id: crypto.randomUUID(), ...fc })));
            } else {
                setError("The AI couldn't find any actionable items in the text.");
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleImportClick = () => {
        onImport(proposedActions);
        setProposedActions([]);
        setText('');
        setFileName('');
    };
    
    const handleEditAction = (actionToEdit: any) => {
        const onSaveOverride = (editedData: any) => {
            setProposedActions(prev => prev.map(p => {
                if (p.id === actionToEdit.id) {
                    // When editing, we receive the full object, but only need to update the `args` part.
                    const newArgs = { ...p.args, ...editedData };
                    return { ...p, args: newArgs };
                }
                return p;
            }));
            // Close all modals, a bit of a brute force but effective
            Object.keys(actions.modalStates).forEach(key => actions.setModalOpen(key, false));
        };
        
        switch (actionToEdit.name) {
            case 'add_transaction':
                 actions.handleOpenEditTransactionModal({ ...actionToEdit.args, id: actionToEdit.id }, (editedTx: any) => {
                    const { id, paymentShares, expenseShares, receiptImage, receiptUrl, ...rest } = editedTx;
                    onSaveOverride(rest);
                });
                break;
            case 'create_account':
                 actions.setModalDataField('accountToEdit', actionToEdit.args);
                 actions.handleOpenAddAccountModal(undefined, undefined, (editedAcc: any) => {
                    onSaveOverride({name: editedAcc.name, type: editedAcc.type, initial_balance: editedAcc.balance });
                 });
                 break;
            case 'create_team':
                 actions.setModalDataField('teamToEdit', actionToEdit.args);
                 actions.handleOpenCreateTeamModal((editedTeam: any) => {
                    onSaveOverride({ name: editedTeam.name });
                 });
                 break;
        }
    };

    const renderAction = (action: any) => {
        const { name, args } = action;
        switch (name) {
            case 'add_transaction':
                const isIncome = args.type === 'INCOME';
                return (
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-cosmic-text-primary">{args.description}</p>
                            <p className="text-xs text-cosmic-text-secondary">{args.date} &bull; {args.category} &bull; to "{args.account_name}"</p>
                        </div>
                        <p className={`font-bold ${isIncome ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
                            {isIncome ? '+' : '-'}${args.amount.toFixed(2)}
                        </p>
                    </div>
                );
            case 'create_account':
                return (
                    <div className="flex items-center gap-3">
                        <CreditCardIcon className="w-5 h-5 text-cosmic-primary" />
                        <div>
                            <p className="font-semibold text-cosmic-text-primary">Create Account: {args.name}</p>
                            <p className="text-xs text-cosmic-text-secondary">Type: {args.type} &bull; Initial Balance: ${args.initial_balance.toFixed(2)}</p>
                        </div>
                    </div>
                );
            case 'create_team':
                 return (
                    <div className="flex items-center gap-3">
                        <TeamsIcon className="w-5 h-5 text-cosmic-primary" />
                        <div>
                            <p className="font-semibold text-cosmic-text-primary">Create Team: {args.name}</p>
                            <p className="text-xs text-cosmic-text-secondary">A new project or business will be created.</p>
                        </div>
                    </div>
                );
            default:
                return <p>Unknown action: {name}</p>;
        }
    };
    
    const summary = proposedActions.reduce((acc, action) => {
        acc[action.name] = (acc[action.name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="animate-fade-in space-y-8">
             <div>
                <h1 className="text-3xl font-bold text-cosmic-text-primary">Intelligent Import</h1>
                <p className="text-cosmic-text-secondary">Upload a statement or paste text to have the AI propose actions for you.</p>
            </div>

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
                         <textarea 
                            value={text}
                            onChange={(e) => { setText(e.target.value); setFileName(''); setProposedActions([]); setError(null); }}
                            rows={8}
                            placeholder="Or paste statement text here..."
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-sm flex-grow"
                        />
                    </div>
                </div>
                 <div className="flex justify-center mt-6">
                    <button onClick={handleAnalyze} disabled={isAnalyzing || !text.trim()} className="w-full max-w-xs flex items-center justify-center gap-2 bg-cosmic-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-400 transition-colors disabled:bg-cosmic-border disabled:cursor-not-allowed">
                        {isAnalyzing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Analyzing...</span></>
                        : <><SparklesIcon className="w-5 h-5" /><span>Analyze with AI</span></>}
                    </button>
                </div>
            </div>

            {error && <p className="text-sm text-center text-cosmic-danger mt-2">{error}</p>}

            {proposedActions.length > 0 && (
                <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border animate-fade-in">
                    <h2 className="text-xl font-bold text-cosmic-text-primary mb-2">Step 2: Review Proposed Actions</h2>
                    <div className="bg-cosmic-bg p-3 rounded-lg text-sm mb-4">
                        <p className="font-semibold text-cosmic-text-primary">AI Analysis Summary:</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-cosmic-text-secondary">
                            {(Object.entries(summary) as [string, number][]).map(([action, count]) => (
                                <span key={action}>{count} {action.replace(/_/g, ' ')}{count > 1 ? 's' : ''}</span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {proposedActions.map(action => (
                            <div key={action.id} className="bg-cosmic-bg p-3 rounded-lg text-sm flex items-center justify-between group">
                                <div className="flex-grow">{renderAction(action)}</div>
                                <button onClick={() => handleEditAction(action)} className="text-xs text-yellow-500 font-semibold ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    EDIT
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end mt-6">
                        <button onClick={handleImportClick} className="flex items-center gap-2 bg-cosmic-success text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                            <CheckCircleIcon className="w-5 h-5" />
                            Approve & Import All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
