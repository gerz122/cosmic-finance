import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction, User, Team, PaymentShare, ExpenseShare, Account, SplitMode } from '../types';
import { TransactionType } from '../types';
import { XIcon, PlusIcon, UploadIcon } from './icons';
import { AddCategoryModal } from './AddCategoryModal';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id'> | (Transaction & { receiptImage?: string })) => void;
    transactionToEdit: Transaction | null;
    currentUser: User;
    allUsers: User[];
    teams: Team[];
    onAddAccountClick: () => void;
    onAddCategory: (category: string) => void;
    defaultTeamId?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSave, transactionToEdit, currentUser, allUsers, teams, onAddAccountClick, onAddCategory, defaultTeamId }) => {
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [isPassive, setIsPassive] = useState(false);
    const [teamId, setTeamId] = useState(defaultTeamId || '');
    const [receiptImage, setReceiptImage] = useState<string | null>(null); // base64 string
    const [isTaxDeductible, setIsTaxDeductible] = useState(false);

    const [paymentShares, setPaymentShares] = useState<PaymentShare[]>([{ userId: currentUser.id, accountId: '', amount: 0 }]);
    const [expenseShares, setExpenseShares] = useState<ExpenseShare[]>([{ userId: currentUser.id, amount: 0 }]);
    
    const [splitMode, setSplitMode] = useState<SplitMode>('equal');
    const isEditing = !!transactionToEdit;
    
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

    const { contextMembers, userAccounts } = useMemo(() => {
        const members = teamId ? allUsers.filter(u => teams.find(t => t.id === teamId)?.memberIds.includes(u.id)) : [currentUser];
        const accounts: Record<string, Account[]> = {};
        allUsers.forEach(u => {
            accounts[u.id] = u.accounts;
        });
        teams.forEach(t => {
            t.accounts.forEach(acc => {
                t.memberIds.forEach(memberId => {
                    if (!accounts[memberId]) accounts[memberId] = [];
                    // Avoid duplicating team accounts for every member
                    if (!accounts[memberId].find(a => a.id === acc.id)) {
                        accounts[memberId].push(acc);
                    }
                })
            })
        })
        return { contextMembers: members, userAccounts: accounts };
    }, [teamId, teams, allUsers, currentUser]);
    
    useEffect(() => {
        if (isOpen) {
            const isEditMode = !!transactionToEdit;
            const effectiveTeamId = isEditMode ? (transactionToEdit.teamId || '') : (defaultTeamId || '');
            setTeamId(effectiveTeamId);
            
            const members = effectiveTeamId ? allUsers.filter(u => teams.find(t => t.id === effectiveTeamId)?.memberIds.includes(u.id)) : [currentUser];

            setDescription(isEditMode ? transactionToEdit.description : '');
            setTotalAmount(isEditMode ? String(transactionToEdit.amount) : '');
            setCategoryInput(isEditMode ? transactionToEdit.category : '');
            setDate(isEditMode ? transactionToEdit.date : new Date().toISOString().split('T')[0]);
            setType(isEditMode ? transactionToEdit.type : TransactionType.EXPENSE);
            setIsPassive(isEditMode ? transactionToEdit.isPassive || false : false);
            setReceiptImage(null); // Always reset image preview
            setIsTaxDeductible(isEditMode ? transactionToEdit.isTaxDeductible || false : false);

            setPaymentShares(isEditMode && transactionToEdit.paymentShares.length > 0 ? transactionToEdit.paymentShares : [{ userId: currentUser.id, accountId: userAccounts[currentUser.id]?.[0]?.id || '', amount: parseFloat(totalAmount) || 0 }]);
            
            if (isEditMode && transactionToEdit.expenseShares && transactionToEdit.expenseShares.length > 0) {
                setExpenseShares(transactionToEdit.expenseShares);
            } else {
                 setExpenseShares(members.map(member => ({ userId: member.id, amount: (parseFloat(totalAmount) || 0) / members.length })));
            }
            
            setSplitMode('equal');
        }
    }, [isOpen, transactionToEdit, defaultTeamId, teams, allUsers, currentUser]);

    useEffect(() => {
        const amount = parseFloat(totalAmount) || 0;
        if (splitMode === 'equal') {
            const shareAmount = contextMembers.length > 0 ? amount / contextMembers.length : 0;
            setExpenseShares(contextMembers.map(member => ({ userId: member.id, amount: shareAmount })));
        }
        if (paymentShares.length === 1) {
            setPaymentShares(prev => [{...prev[0], amount}]);
        }
    }, [totalAmount, splitMode, contextMembers]);

    const expenseSplitTotal = useMemo(() => expenseShares.reduce((sum, s) => sum + s.amount, 0), [expenseShares]);
    const paymentSplitTotal = useMemo(() => paymentShares.reduce((sum, s) => sum + s.amount, 0), [paymentShares]);
    
    const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericTotal = parseFloat(totalAmount) || 0;
        if(Math.abs(numericTotal - paymentSplitTotal) > 0.01) {
            alert(`Payment total ($${paymentSplitTotal.toFixed(2)}) does not match transaction amount ($${numericTotal.toFixed(2)}).`);
            return;
        }
        if(type === TransactionType.EXPENSE && Math.abs(numericTotal - expenseSplitTotal) > 0.01) {
            alert(`Expense split total ($${expenseSplitTotal.toFixed(2)}) does not match transaction amount ($${numericTotal.toFixed(2)}).`);
            return;
        }
        
        const transactionData = {
            id: isEditing ? transactionToEdit.id : crypto.randomUUID(),
            description,
            amount: numericTotal,
            category: categoryInput,
            date,
            type,
            isPassive: type === TransactionType.INCOME ? isPassive : false,
            teamId: teamId || undefined,
            isTaxDeductible,
            paymentShares,
            expenseShares: type === TransactionType.EXPENSE ? expenseShares : [],
            receiptImage: receiptImage || undefined,
            receiptUrl: transactionToEdit?.receiptUrl
        };
        
        onSave(transactionData);
        onClose();
    };

    const handleAddNewCategory = (newCategory: string) => {
        onAddCategory(newCategory);
        setCategoryInput(newCategory);
        setIsAddCategoryModalOpen(false);
    };

    const updatePaymentShare = (index: number, field: keyof PaymentShare, value: string | number) => {
        const newShares = [...paymentShares];
        (newShares[index] as any)[field] = value;
        setPaymentShares(newShares);
    }
    const addPaymentShare = () => setPaymentShares([...paymentShares, { userId: '', accountId: '', amount: 0 }]);
    const removePaymentShare = (index: number) => setPaymentShares(paymentShares.filter((_, i) => i !== index));

    const updateExpenseShare = (index: number, field: keyof ExpenseShare, value: string | number) => {
        const newShares = [...expenseShares];
        (newShares[index] as any)[field] = value;
        if (field === 'amount') {
            newShares[index].amount = parseFloat(value as string) || 0;
        }
        setExpenseShares(newShares);
    }

    if (!isOpen) return null;
    
    return (
        <>
        <AddCategoryModal isOpen={isAddCategoryModalOpen} onClose={() => setIsAddCategoryModalOpen(false)} onAddCategory={handleAddNewCategory} />
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-3xl shadow-2xl p-6 m-4 animate-slide-in-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary"><XIcon className="w-6 h-6" /></button>
                </div>
                
                 <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Description</label>
                             <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Total Amount</label>
                             <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} min="0.01" step="0.01" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Date</label>
                             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Type</label>
                             <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2">
                                <option value={TransactionType.EXPENSE}>Expense</option>
                                <option value={TransactionType.INCOME}>Income</option>
                             </select>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Category</label>
                             <div className="flex gap-2">
                                <input type="text" value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required list="categories" />
                                <datalist id="categories">
                                    {(currentUser.financialStatement.transactions.map(t => t.category)).reduce((acc: string[], cur) => acc.includes(cur) ? acc : [...acc, cur], []).map(c => <option key={c} value={c} />)}
                                </datalist>
                                <button type="button" onClick={() => setIsAddCategoryModalOpen(true)} className="p-2 bg-cosmic-primary rounded-md text-white"><PlusIcon className="w-5 h-5"/></button>
                             </div>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Team (Optional)</label>
                             <select value={teamId} onChange={e => setTeamId(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2">
                                <option value="">Personal</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                             </select>
                        </div>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-cosmic-border">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-cosmic-text-primary">Who Paid?</h3>
                            <p className={`text-sm font-semibold ${Math.abs(parseFloat(totalAmount) - paymentSplitTotal) > 0.01 ? 'text-cosmic-danger' : 'text-cosmic-success'}`}>
                                Total: ${paymentSplitTotal.toFixed(2)}
                            </p>
                        </div>
                        {paymentShares.map((share, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <select value={share.userId} onChange={e => updatePaymentShare(index, 'userId', e.target.value)} className="col-span-4 bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-sm">
                                    {contextMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <select value={share.accountId} onChange={e => updatePaymentShare(index, 'accountId', e.target.value)} className="col-span-4 bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-sm">
                                    <option value="">Select Account...</option>
                                    {(userAccounts[share.userId] || []).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                                <input type="number" value={share.amount} onChange={e => updatePaymentShare(index, 'amount', parseFloat(e.target.value) || 0)} className="col-span-3 bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-sm text-right"/>
                                <button type="button" onClick={() => removePaymentShare(index)} disabled={paymentShares.length <= 1} className="col-span-1 text-cosmic-danger disabled:text-cosmic-border"><XIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                         <button type="button" onClick={addPaymentShare} className="text-sm text-cosmic-primary font-semibold">+ Add another payer</button>
                    </div>

                    {type === TransactionType.EXPENSE && (
                        <div className="space-y-2 pt-2 border-t border-cosmic-border">
                             <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-cosmic-text-primary">How was it split?</h3>
                                 <p className={`text-sm font-semibold ${Math.abs(parseFloat(totalAmount) - expenseSplitTotal) > 0.01 ? 'text-cosmic-danger' : 'text-cosmic-success'}`}>
                                    Total: ${expenseSplitTotal.toFixed(2)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {(['equal', 'amount', 'percentage'] as SplitMode[]).map(mode => (
                                    <button key={mode} type="button" onClick={() => setSplitMode(mode)} className={`px-2 py-1 text-xs rounded-md ${splitMode === mode ? 'bg-cosmic-primary text-white' : 'bg-cosmic-bg border border-cosmic-border'}`}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</button>
                                ))}
                            </div>
                             <div className="space-y-2">
                                {expenseShares.map((share, index) => (
                                    <div key={share.userId} className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm text-cosmic-text-secondary">{contextMembers.find(m=>m.id === share.userId)?.name}</label>
                                        <input type="number" value={share.amount.toFixed(2)} disabled={splitMode === 'equal'} onChange={e => updateExpenseShare(index, 'amount', e.target.value)} className="bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-sm text-right disabled:bg-cosmic-border"/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-cosmic-border">
                        <div>
                            <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Receipt</label>
                            {receiptImage ? (
                                <div className="relative">
                                    <img src={receiptImage} alt="Receipt preview" className="w-full h-32 object-cover rounded-md border border-cosmic-border" />
                                    <button type="button" onClick={() => setReceiptImage(null)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"><XIcon className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <label htmlFor="receipt-upload" className="cursor-pointer bg-cosmic-bg border-2 border-dashed border-cosmic-border rounded-lg p-4 text-center hover:border-cosmic-primary flex flex-col items-center justify-center h-full">
                                    <UploadIcon className="w-8 h-8 mx-auto text-cosmic-text-secondary" />
                                    <span className="text-sm text-cosmic-text-secondary">Attach Receipt</span>
                                </label>
                            )}
                            <input id="receipt-upload" type="file" className="hidden" accept="image/*" onChange={handleReceiptChange} />
                        </div>
                        <div className="flex flex-col justify-center space-y-2">
                            {type === TransactionType.INCOME && (
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={isPassive} onChange={e => setIsPassive(e.target.checked)} className="rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" />
                                    Passive Income
                                </label>
                            )}
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={isTaxDeductible} onChange={e => setIsTaxDeductible(e.target.checked)} className="rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" />
                                Tax Deductible
                            </label>
                        </div>
                    </div>
                 </form>

                 <div className="flex justify-end gap-3 pt-4 mt-auto border-t border-cosmic-border flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">Save</button>
                </div>
            </div>
        </div>
        </>
    );
};