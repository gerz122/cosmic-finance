import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction, User, Team, PaymentShare, ExpenseShare, Account } from '../types';
import { TransactionType } from '../types';
import { XIcon, PlusIcon } from './icons';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    currentUser: User;
    allUsers: User[];
    teams: Team[];
    onAddAccountClick: () => void;
    onAddCategoryClick: () => void;
    defaultTeamId?: string;
}

const defaultCategories = [
    'Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Job', 'Investment', 'Loan', 'Shopping', 'Business Expense', 'Team Contribution'
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAddTransaction, currentUser, allUsers, teams, onAddAccountClick, onAddCategoryClick, defaultTeamId }) => {
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [isPassive, setIsPassive] = useState(false);
    const [teamId, setTeamId] = useState(defaultTeamId || '');

    // New state for advanced splits
    const [paymentShares, setPaymentShares] = useState<PaymentShare[]>([{ userId: currentUser.id, accountId: '', amount: 0 }]);
    const [expenseShares, setExpenseShares] = useState<ExpenseShare[]>([{ userId: currentUser.id, amount: 0 }]);
    
    // UI state
    const [splitEqually, setSplitEqually] = useState(true);

    const contextMembers = useMemo(() => {
        if (!teamId) return allUsers;
        const team = teams.find(t => t.id === teamId);
        return team ? allUsers.filter(u => team.memberIds.includes(u.id)) : [currentUser];
    }, [teamId, teams, allUsers, currentUser]);

    // Reset form when opening or defaultTeamId changes
    useEffect(() => {
        if (isOpen) {
            setDescription(''); setTotalAmount(''); setCategoryInput('');
            setDate(new Date().toISOString().split('T')[0]);
            setType(TransactionType.EXPENSE); setIsPassive(false);
            setTeamId(defaultTeamId || '');
            const initialAccountId = teamId 
                ? teams.find(t => t.id === teamId)?.accounts[0]?.id || ''
                : currentUser.accounts?.[0]?.id || '';
            setPaymentShares([{ userId: currentUser.id, accountId: initialAccountId, amount: 0 }]);
            setExpenseShares(contextMembers.map(m => ({ userId: m.id, amount: 0 })));
            setSplitEqually(true);
        }
    }, [isOpen, currentUser, contextMembers, defaultTeamId, teamId, teams]);
    
    // Auto-update shares when total amount or members change
    useEffect(() => {
        const amount = parseFloat(totalAmount) || 0;
        if (splitEqually) {
            const shareAmount = contextMembers.length > 0 ? amount / contextMembers.length : 0;
            setExpenseShares(contextMembers.map(m => ({ userId: m.id, amount: shareAmount })));
        }
        if (paymentShares.length === 1) {
            setPaymentShares(prev => [{...prev[0], amount}]);
        }
    }, [totalAmount, splitEqually, contextMembers, paymentShares.length]);

    if (!isOpen) return null;
    
    const handlePaymentShareChange = (index: number, field: keyof PaymentShare, value: string | number) => {
        const newShares = [...paymentShares];
        (newShares[index] as any)[field] = value;
        setPaymentShares(newShares);
    };

    const handleExpenseShareChange = (index: number, value: string) => {
        const newShares = [...expenseShares];
        newShares[index].amount = parseFloat(value) || 0;
        setExpenseShares(newShares);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(totalAmount);
        if (!description || !numericAmount || numericAmount <= 0 || !categoryInput || !date) {
            alert('Please fill out description, amount, category, and date.');
            return;
        }
        
        // Validate Payments
        const totalPaid = paymentShares.reduce((sum, share) => sum + Number(share.amount), 0);
        if (Math.abs(totalPaid - numericAmount) > 0.01) {
            alert(`The total paid ($${totalPaid.toFixed(2)}) does not match the transaction amount ($${numericAmount.toFixed(2)}).`);
            return;
        }
        if (paymentShares.some(p => !p.accountId)) {
            alert('Please select an account for each payer.');
            return;
        }

        // Validate Expenses
        let finalExpenseShares: ExpenseShare[] | undefined = undefined;
        if (type === TransactionType.EXPENSE) {
            const totalSplit = expenseShares.reduce((sum, share) => sum + share.amount, 0);
             if (Math.abs(totalSplit - numericAmount) > 0.01) {
                alert(`The expense split total ($${totalSplit.toFixed(2)}) does not match the transaction amount ($${numericAmount.toFixed(2)}).`);
                return;
            }
            finalExpenseShares = expenseShares;
        }

        onAddTransaction({
            description, amount: numericAmount, type, category: categoryInput, date,
            teamId: teamId || undefined,
            isPassive: type === TransactionType.INCOME ? isPassive : undefined,
            paymentShares: paymentShares,
            expenseShares: finalExpenseShares,
        });
        onClose();
    };

    const getAccountsForUser = (userId: string): Account[] => {
        if(teamId) { // Team context
            const team = teams.find(t => t.id === teamId);
            return team?.accounts || [];
        }
        // Personal context
        const user = allUsers.find(u => u.id === userId);
        return user?.accounts || [];
    }

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-3xl shadow-2xl p-6 m-4 animate-slide-in-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Add New Play</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary"><XIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="teamId" className="block text-sm font-medium text-cosmic-text-secondary mb-1">For</label><select id="teamId" value={teamId} onChange={e => setTeamId(e.target.value)} disabled={!!defaultTeamId} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 disabled:bg-cosmic-border"><option value="">Personal</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Type</label><div className="flex gap-4 p-2 bg-cosmic-bg border border-cosmic-border rounded-md"><label className="flex items-center flex-1 justify-center"><input type="radio" name="type" value={TransactionType.EXPENSE} checked={type === TransactionType.EXPENSE} onChange={() => setType(TransactionType.EXPENSE)} className="w-4 h-4 text-cosmic-secondary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-secondary" /><span className="ml-2">Expense</span></label><label className="flex items-center flex-1 justify-center"><input type="radio" name="type" value={TransactionType.INCOME} checked={type === TransactionType.INCOME} onChange={() => setType(TransactionType.INCOME)} className="w-4 h-4 text-cosmic-success bg-cosmic-bg border-cosmic-border focus:ring-cosmic-success" /><span className="ml-2">Income</span></label></div></div>
                    </div>
                    <div><label htmlFor="description" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Description</label><input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="amount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Total Amount</label><input type="number" id="amount" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} min="0.01" step="0.01" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required /></div>
                        <div className="flex items-end gap-2">
                            <div className="flex-grow"><label htmlFor="category" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Category</label><input list="category-suggestions" id="category" value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required/><datalist id="category-suggestions">{defaultCategories.map(cat => <option key={cat} value={cat}/>)}</datalist></div>
                            <button type="button" onClick={onAddCategoryClick} className="p-2 bg-cosmic-bg border border-cosmic-border rounded-md hover:border-cosmic-primary"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="date" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Date</label><input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary date-input" required /></div>
                         {type === TransactionType.INCOME && (<div className="self-center"><label className="flex items-center"><input type="checkbox" checked={isPassive} onChange={(e) => setIsPassive(e.target.checked)} className="w-4 h-4 rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" /><span className="ml-2 text-sm text-cosmic-text-secondary">Is this passive income?</span></label></div>)}
                    </div>

                    {/* Payment Split */}
                    <div className="space-y-3 pt-3 border-t border-cosmic-border">
                        <h3 className="font-medium text-cosmic-text-primary">{type === TransactionType.EXPENSE ? "Who Paid?" : "Who Received?"}</h3>
                         {paymentShares.map((share, index) => (
                            <div key={index} className="grid grid-cols-3 gap-2 items-center">
                                 <select value={share.userId} onChange={e => handlePaymentShareChange(index, 'userId', e.target.value)} className="bg-cosmic-bg border border-cosmic-border rounded p-2"><option value="" disabled>Select Player</option>{contextMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                                <div className="flex items-stretch gap-2">
                                <select value={share.accountId} onChange={e => handlePaymentShareChange(index, 'accountId', e.target.value)} className="flex-grow bg-cosmic-bg border border-cosmic-border rounded p-2" required><option value="" disabled>Select Account</option>{getAccountsForUser(share.userId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
                                <button type="button" onClick={onAddAccountClick} className="p-2 bg-cosmic-bg border border-cosmic-border rounded-md hover:border-cosmic-primary"><PlusIcon className="w-5 h-5"/></button>
                                </div>
                                <input type="number" value={share.amount} onChange={e => handlePaymentShareChange(index, 'amount', e.target.value)} placeholder="Amount" className="bg-cosmic-bg border border-cosmic-border rounded p-2" />
                            </div>
                        ))}
                        <button type="button" onClick={() => setPaymentShares(prev => [...prev, {userId: '', accountId: '', amount: 0}])} className="text-sm text-cosmic-primary hover:underline">+ Add another payer</button>
                    </div>

                    {/* Expense Split */}
                    {type === TransactionType.EXPENSE && (
                         <div className="space-y-3 pt-3 border-t border-cosmic-border">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-cosmic-text-primary">How was this split?</h3>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={splitEqually} onChange={e => setSplitEqually(e.target.checked)} className="w-4 h-4 rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border" /> Split equally</label>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {expenseShares.map((share, index) => (
                                    <div key={share.userId} className="flex items-center gap-3">
                                        <label className="w-1/3 truncate">{contextMembers.find(m => m.id === share.userId)?.name}</label>
                                        <input type="number" value={share.amount} onChange={e => handleExpenseShareChange(index, e.target.value)} disabled={splitEqually} className="flex-grow bg-cosmic-bg border border-cosmic-border rounded p-1.5 disabled:bg-cosmic-border" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button><button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">Save Transaction</button></div>
                </form>
            </div><style>{`.date-input::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }`}</style>
        </div>
    );
};