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

    const contextMembers = useMemo(() => {
        if (!teamId) return allUsers;
        const teamRecord = teams.find(teamItem => teamItem.id === teamId);
        return teamRecord ? allUsers.filter(userRecord => teamRecord.memberIds.includes(userRecord.id)) : [currentUser];
    }, [teamId, teams, allUsers, currentUser]);
    
    useEffect(() => {
        if (isOpen) {
            const isEditMode = !!transactionToEdit;
            const members = teamId ? teams.find(t=>t.id===teamId)?.memberIds.map(id => allUsers.find(u=>u.id===id)!) : allUsers;

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
            
            if (isEditMode && transactionToEdit.expenseShares && transactionToEdit.expenseShares.length > 0) {
                setExpenseShares(transactionToEdit.expenseShares);
            } else {
                setExpenseShares(members.map(member => ({ userId: member.id, amount: 0 })));
            }
            
            setSplitMode('equal');
        }
    }, [isOpen, transactionToEdit, defaultTeamId, teamId, allUsers, teams, currentUser.id]);

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
        // ... validation logic ...
        
        const transactionData = {
            id: isEditing ? transactionToEdit.id : Date.now().toString(),
            description,
            amount: parseFloat(totalAmount) || 0,
            category: categoryInput,
            date,
            type,
            isPassive,
            teamId: teamId || undefined,
            isTaxDeductible,
            paymentShares,
            expenseShares,
            receiptImage: receiptImage || undefined,
            receiptUrl: transactionToEdit?.receiptUrl // Preserve existing URL if not changed
        };
        
        onSave(transactionData);
        onClose();
    };

    const handleAddNewCategory = (newCategory: string) => {
        onAddCategory(newCategory);
        setCategoryInput(newCategory);
        setIsAddCategoryModalOpen(false);
    };

    // ... The rest of the component logic ...

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            {/* ... Modal content ... */}
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-2xl shadow-2xl p-6 m-4 animate-slide-in-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 {/* ... header ... */}
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary"><XIcon className="w-6 h-6" /></button>
                </div>
                
                 <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow">
                    {/* ... other form fields ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Receipt</label>
                            {receiptImage ? (
                                <div className="relative">
                                    <img src={receiptImage} alt="Receipt preview" className="w-full h-32 object-cover rounded-md border border-cosmic-border" />
                                    <button type="button" onClick={() => setReceiptImage(null)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"><XIcon className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <label htmlFor="receipt-upload" className="cursor-pointer bg-cosmic-bg border-2 border-dashed border-cosmic-border rounded-lg p-4 text-center hover:border-cosmic-primary">
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

                 <div className="flex justify-end gap-3 pt-4 mt-auto border-t border-cosmic-border">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">Save</button>
                </div>
            </div>
        </div>
    );
};
