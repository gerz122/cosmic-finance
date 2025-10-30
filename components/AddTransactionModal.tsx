import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction, User, Team, PaymentShare, ExpenseShare, Account, SplitMode } from '../types';
import { TransactionType } from '../types';
import { XIcon } from './icons';
import * as dbService from '../services/dbService';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
    transactionToEdit: Transaction | null;
    currentUser: User;
    allUsers: User[];
    teams: Team[];
    onAddAccountClick: () => void;
    onAddCategoryClick: () => void;
    defaultTeamId?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSave, transactionToEdit, currentUser, allUsers, teams, onAddAccountClick, onAddCategoryClick, defaultTeamId }) => {
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [isPassive, setIsPassive] = useState(false);
    const [teamId, setTeamId] = useState(defaultTeamId || '');
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [isTaxDeductible, setIsTaxDeductible] = useState(false);


    const [paymentShares, setPaymentShares] = useState<PaymentShare[]>([{ userId: currentUser.id, accountId: '', amount: 0 }]);
    const [expenseShares, setExpenseShares] = useState<ExpenseShare[]>([{ userId: currentUser.id, amount: 0 }]);
    
    const [splitMode, setSplitMode] = useState<SplitMode>('equal');
    const isEditing = !!transactionToEdit;

    const contextMembers = useMemo(() => {
        if (!teamId) return allUsers;
        const teamRecord = teams.find(teamItem => teamItem.id === teamId);
        return teamRecord ? allUsers.filter(userRecord => teamRecord.memberIds.includes(userRecord.id)) : [currentUser];
    }, [teamId, teams, allUsers, currentUser]);
    
    // Comprehensive state reset
    useEffect(() => {
        if (isOpen) {
            const isEditMode = isEditing && transactionToEdit;

            setDescription(isEditMode ? transactionToEdit.description : '');
            setTotalAmount(isEditMode ? String(transactionToEdit.amount) : '');
            setCategoryInput(isEditMode ? transactionToEdit.category : '');
            setDate(isEditMode ? transactionToEdit.date : new Date().toISOString().split('T')[0]);
            setType(isEditMode ? transactionToEdit.type : TransactionType.EXPENSE);
            setIsPassive(isEditMode ? transactionToEdit.isPassive || false : false);
            setTeamId(isEditMode ? transactionToEdit.teamId || defaultTeamId || '' : defaultTeamId || '');
            setReceiptImage(null); // Always reset image preview
            setIsTaxDeductible(isEditMode ? transactionToEdit.isTaxDeductible || false : false);

            setPaymentShares(isEditMode ? transactionToEdit.paymentShares : [{ userId: currentUser.id, accountId: '', amount: 0 }]);
            
            if (isEditMode) {
                setExpenseShares(transactionToEdit.expenseShares || contextMembers.map(member => ({ userId: member.id, amount: 0 })));
            } else {
                setExpenseShares(contextMembers.map(member => ({ userId: member.id, amount: 0 })));
            }
            
            setSplitMode('equal');
        }
    }, [isOpen, transactionToEdit, isEditing, currentUser, contextMembers, defaultTeamId]);

    useEffect(() => {
        const amount = parseFloat(totalAmount) || 0;
        if (splitMode === 'equal') {
            const shareAmount = contextMembers.length > 0 ? amount / contextMembers.length : 0;
            setExpenseShares(contextMembers.map(member => ({ userId: member.id, amount: shareAmount })));
        }
        if (paymentShares.length === 1) {
            setPaymentShares(prev => [{...prev[0], amount}]);
        }
    }, [totalAmount, splitMode, contextMembers, paymentShares.length]);

    const handlePaymentShareChange = (index: number, field: keyof Omit<PaymentShare, 'userId'>, value: string) => {
        const newShares = [...paymentShares];
        const share = newShares[index];
        
        if (field === 'accountId') {
            share.accountId = value;
        } else if (field === 'amount') {
            share.amount = parseFloat(value) || 0;
        }
        setPaymentShares(newShares);
    };

    const handlePaymentShareUserChange = (index: number, userId: string) => {
        const newShares = [...paymentShares];
        newShares[index].userId = userId;
        newShares[index].accountId = ''; // Reset account when user changes
        setPaymentShares(newShares);
    };

    const addPayer = () => {
        const nextUser = contextMembers.find(m => !paymentShares.some(s => s.userId === m.id));
        setPaymentShares(prev => [...prev, { userId: nextUser?.id || '', accountId: '', amount: 0 }]);
    };
    
    const handleExpenseShareChange = (index: number, field: 'amount' | 'percentage', value: string) => {
        const newShares = [...expenseShares];
        const numericValue = parseFloat(value) || 0;
        const total = parseFloat(totalAmount) || 0;

        if (splitMode === 'amount') {
            newShares[index].amount = numericValue;
        } else if (splitMode === 'percentage') {
            newShares[index].amount = (total * numericValue) / 100;
        }
        setExpenseShares(newShares);
    };

    const getExpenseShareValue = (share: ExpenseShare) => {
        if (splitMode === 'percentage') {
            const total = parseFloat(totalAmount) || 0;
            return total > 0 ? ((share.amount / total) * 100).toFixed(2) : '0';
        }
        return share.amount.toString();
    };

    const totalExpenseSplit = expenseShares.reduce((sum, shareItem) => sum + shareItem.amount, 0);
    const totalPercentage = (parseFloat(totalAmount) > 0 ? (totalExpenseSplit / parseFloat(totalAmount)) * 100 : 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const totalAmountFloat = parseFloat(totalAmount) || 0;
        const paymentSharesTotal = paymentShares.reduce((sum, s) => sum + s.amount, 0);

        if (paymentShares.length > 1 && Math.abs(totalAmountFloat - paymentSharesTotal) > 0.01) {
            alert('The sum of payments does not match the total transaction amount.');
            return;
        }

        for (const share of paymentShares) {
            if (!share.accountId) {
                alert('Please select an account for all payment shares.');
                return;
            }
        }

        let finalReceiptUrl = isEditing ? transactionToEdit.receiptUrl : undefined;

        if (receiptImage) {
            try {
                finalReceiptUrl = await dbService.uploadReceipt(receiptImage, currentUser.id);
            } catch (error) {
                console.error("Failed to upload receipt:", error);
                alert("There was an error uploading the receipt. Please try again.");
                return;
            }
        }

        const transactionBase: Omit<Transaction, 'id' | 'receiptUrl' | 'teamId'> & { receiptUrl?: string; teamId?: string } = {
            description,
            amount: parseFloat(totalAmount),
            category: categoryInput,
            date,
            type,
            isPassive,
            paymentShares,
            expenseShares,
            isTaxDeductible,
        };
        
        if (finalReceiptUrl) {
            transactionBase.receiptUrl = finalReceiptUrl;
        }
        
        const transactionData = teamId ? { ...transactionBase, teamId } : transactionBase;


        if (isEditing) {
            onSave({ ...transactionData as Omit<Transaction, 'id'>, id: transactionToEdit.id });
        } else {
            onSave(transactionData as Omit<Transaction, 'id'>);
        }
        
        onClose();
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getAccountsForUser = (userId: string): Account[] => {
        if(teamId) {
            const teamRecord = teams.find(teamItem => teamItem.id === teamId);
            return teamRecord?.accounts || [];
        }
        const userRecord = allUsers.find(userItem => userItem.id === userId);
        return userRecord?.accounts || [];
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-3xl shadow-2xl p-6 m-4 animate-slide-in-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">{isEditing ? 'Edit Transaction' : 'Add New Play'}</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary"><XIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 bg-cosmic-bg border border-cosmic-border rounded-md p-1">
                            <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`w-1/2 rounded p-2 font-semibold text-sm ${type === TransactionType.EXPENSE ? 'bg-cosmic-danger text-white' : 'text-cosmic-text-secondary'}`}>Expense</button>
                            <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`w-1/2 rounded p-2 font-semibold text-sm ${type === TransactionType.INCOME ? 'bg-cosmic-success text-white' : 'text-cosmic-text-secondary'}`}>Income</button>
                        </div>
                         <div>
                            <label htmlFor="teamId" className="block text-sm font-medium text-cosmic-text-secondary mb-1">For</label>
                            <select id="teamId" value={teamId} onChange={e => setTeamId(e.target.value)} disabled={!!defaultTeamId} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 disabled:bg-cosmic-border">
                                <option value="">Personal</option>
                                {teams.map(teamRecord => <option key={teamRecord.id} value={teamRecord.id}>{teamRecord.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                             <label htmlFor="description" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Description</label>
                            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required/>
                        </div>
                        <div>
                             <label htmlFor="amount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Total Amount</label>
                            <input type="number" id="amount" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} min="0.01" step="0.01" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="category" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Category</label>
                            <input type="text" id="category" value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required/>
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Date</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 date-input" required/>
                        </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-cosmic-border">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-cosmic-text-primary">
                                {type === TransactionType.EXPENSE ? 'Paid From' : 'Deposited To'}
                            </h3>
                            {paymentShares.length > 1 && (
                                <span className="text-xs text-cosmic-text-secondary">
                                    Total Paid: ${paymentShares.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {paymentShares.map((share, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                                    <select
                                        value={share.userId}
                                        onChange={(e) => handlePaymentShareUserChange(index, e.target.value)}
                                        className="w-full bg-cosmic-bg border border-cosmic-border rounded p-1.5 md:col-span-2"
                                        disabled={paymentShares.length === 1 && !teamId}
                                    >
                                        {contextMembers.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={share.accountId}
                                        onChange={(e) => handlePaymentShareChange(index, 'accountId', e.target.value)}
                                        className="w-full bg-cosmic-bg border border-cosmic-border rounded p-1.5 md:col-span-2"
                                        required
                                    >
                                        <option value="">Select Account...</option>
                                        {getAccountsForUser(share.userId).map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="relative md:col-span-1">
                                        <input
                                            type="number"
                                            value={share.amount.toString()}
                                            onChange={(e) => handlePaymentShareChange(index, 'amount', e.target.value)}
                                            className="w-full bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-right pr-4"
                                            required
                                            disabled={paymentShares.length === 1}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-cosmic-text-secondary text-xs">$</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <button type="button" onClick={addPayer} className="text-cosmic-primary hover:underline">
                                + Add another payer
                            </button>
                            {paymentShares.length > 1 && Math.abs(parseFloat(totalAmount) - paymentShares.reduce((sum, s) => sum + s.amount, 0)) > 0.01 && (
                                <span className="text-xs text-cosmic-danger">
                                    Paid total does not match transaction amount!
                                </span>
                            )}
                        </div>
                    </div>
                    

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        {type === TransactionType.INCOME &&
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isPassive} onChange={e => setIsPassive(e.target.checked)} className="w-5 h-5 rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" />
                                <span className="text-sm font-medium text-cosmic-text-primary">Is this passive income?</span>
                            </label>
                        }
                         {type === TransactionType.EXPENSE &&
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isTaxDeductible} onChange={e => setIsTaxDeductible(e.target.checked)} className="w-5 h-5 rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" />
                                <span className="text-sm font-medium text-cosmic-text-primary">Is this tax deductible?</span>
                            </label>
                        }
                         <div>
                            <label htmlFor="receipt" className="cursor-pointer text-sm text-cosmic-primary hover:underline">
                                {receiptImage ? 'Change Receipt' : 'Attach Receipt'}
                            </label>
                            <input type="file" id="receipt" onChange={handleFileChange} accept="image/*" className="hidden"/>
                            {receiptImage && <img src={receiptImage} alt="Receipt preview" className="mt-2 h-16 w-auto rounded" />}
                        </div>
                    </div>
                    

                    {type === TransactionType.EXPENSE && (
                         <div className="space-y-3 pt-3 border-t border-cosmic-border">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-cosmic-text-primary">How was this split?</h3>
                                <div className="flex bg-cosmic-bg border border-cosmic-border rounded-md p-0.5 text-sm">
                                    {(['equal', 'amount', 'percentage'] as SplitMode[]).map(mode => (
                                        <button type="button" key={mode} onClick={() => setSplitMode(mode)} className={`px-2 py-1 rounded capitalize ${splitMode === mode ? 'bg-cosmic-primary text-white' : 'text-cosmic-text-secondary'}`}>
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {splitMode !== 'equal' &&
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {expenseShares.map((paymentShareItem, index) => (
                                        <div key={paymentShareItem.userId} className="flex items-center gap-3">
                                            <label className="w-1/3 truncate">{contextMembers.find(member => member.id === paymentShareItem.userId)?.name}</label>
                                            <div className="relative flex-grow">
                                                <input 
                                                    type="number" 
                                                    value={getExpenseShareValue(paymentShareItem)}
                                                    onChange={e => handleExpenseShareChange(index, splitMode === 'amount' ? 'amount' : 'percentage', e.target.value)}
                                                    className="w-full bg-cosmic-bg border border-cosmic-border rounded p-1.5 pr-8 text-right"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-cosmic-text-secondary">{splitMode === 'percentage' ? '%' : '$'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                             <div className="text-right text-xs text-cosmic-text-secondary">
                                {splitMode === 'amount' && `Total: $${totalExpenseSplit.toFixed(2)}`}
                                {splitMode === 'percentage' && `Total: ${totalPercentage.toFixed(2)}%`}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button><button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">{isEditing ? 'Save Changes' : 'Save Transaction'}</button></div>
                </form>
            </div><style>{`.date-input::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }`}</style>
        </div>
    );
};