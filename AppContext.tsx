import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
// FIX: Import `db` and `firebase` to resolve undefined errors in the transaction import handler.
import { auth, db, firebase } from './services/firebase';
import type { User as FirebaseUser } from './services/firebase';
import * as dbService from './services/dbService';
import type { View, User, Team, Transaction, CosmicEvent, EventOutcome, Asset, Account, Liability, HistoricalDataPoint, Budget, Goal } from './types';
import { TransactionType } from './types';
import { generateHistoricalData } from './utils/financialCalculations';
import { getCosmicEvent } from './services/geminiService';

interface AppContextType {
    activeView: View;
    users: User[];
    teams: Team[];
    activeUser: User | null;
    selectedTeam: Team | null;
    isLoading: boolean;
    error: string | null;
    notification: { message: string; type: 'success' | 'error' } | null;
    modalStates: Record<string, boolean>;
    modalData: Record<string, any>;
    effectiveFinancialStatement: any;
    historicalData: HistoricalDataPoint[];
    allUserAccounts: Account[];
    allCategories: string[];
    setActiveView: (view: View) => void;
    handleLogout: () => void;
    actions: Record<string, (...args: any[]) => any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeUser, setActiveUser] = useState<User | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [modalStates, setModalStates] = useState<Record<string, boolean>>({ isFreedomModalOpen: false, isTeamReportModalOpen: false, isFabOpen: false, isSuccessModalOpen: false });
    const [modalData, setModalData] = useState<Record<string, any>>({});

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 5000);
    };

    const showSuccessModal = (message: string) => {
        setModalData(prev => ({ ...prev, successModalMessage: message }));
        setModalStates(prev => ({ ...prev, isSuccessModalOpen: true }));
    };

    const refreshData = useCallback(async (uid: string) => {
        setIsLoading(true);
        try {
            const userData = await dbService.getOrCreateUser({ uid } as FirebaseUser); // A bit of a hack for refresh
            setActiveUser(userData);
            const fetchedTeams = await dbService.getTeamsForUser(uid);
            setTeams(fetchedTeams);
            const memberIds = new Set(fetchedTeams.flatMap(teamRecord => teamRecord.memberIds));
            memberIds.add(uid);
            const allTeamUsers = await dbService.getUsers(Array.from(memberIds));
            setUsers(allTeamUsers);
        } catch (e) {
            setError("Failed to refresh data.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // FIX: Use v8 auth method syntax
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            setIsLoading(true);
            if (firebaseUser) {
                try {
                    setError(null);
                    // This is the core logic: get the user data, or create it if it's a new login.
                    const appUser = await dbService.getOrCreateUser(firebaseUser);
                    setActiveUser(appUser);

                    // Once we have the user, fetch their related data.
                    const fetchedTeams = await dbService.getTeamsForUser(appUser.id);
                    setTeams(fetchedTeams);

                    const memberIds = new Set(fetchedTeams.flatMap(teamRecord => teamRecord.memberIds));
                    memberIds.add(appUser.id);
                    const allTeamUsers = await dbService.getUsers(Array.from(memberIds));
                    setUsers(allTeamUsers);

                } catch (err) {
                    console.error("Error during user data fetch/creation:", err);
                    setError("Could not load user profile.");
                    setActiveUser(null);
                }
            } else {
                // User is signed out
                setActiveUser(null);
                setUsers([]);
                setTeams([]);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);


    const handleLogout = async () => {
        // FIX: Use v8 auth method syntax
        await auth.signOut();
        setActiveUser(null);
        setActiveView('dashboard');
    };

    const selectedTeam = useMemo(() => teams.find(teamRecord => teamRecord.id === selectedTeamId), [teams, selectedTeamId]);
    const allUserAccounts = useMemo(() => {
        const personalAccounts = users.flatMap(userRecord => userRecord.accounts || []);
        const teamAccounts = teams.flatMap(teamRecord => teamRecord.accounts || []);
        return [...personalAccounts, ...teamAccounts];
    }, [users, teams]);


    const effectiveFinancialStatement = useMemo(() => {
        // DEFINITIVE FIX: This guard prevents calculations on partially loaded data.
        // It ensures the user object, its financial statement, and all transaction/asset arrays
        // exist before proceeding, preventing the race condition that caused the crash.
        if (
            !activeUser || 
            !activeUser.financialStatement || 
            !Array.isArray(activeUser.financialStatement.transactions) ||
            !Array.isArray(activeUser.financialStatement.assets) ||
            !Array.isArray(activeUser.financialStatement.liabilities)
        ) {
            return { transactions: [], assets: [], liabilities: [] };
        }
        
        const personalStatement = {
            transactions: activeUser.financialStatement.transactions,
            assets: activeUser.financialStatement.assets,
            liabilities: activeUser.financialStatement.liabilities
        };

        const userTeams = teams.filter(teamInstance => teamInstance.memberIds.includes(activeUser.id));
        
        const allTransactions = [...personalStatement.transactions];
        const allAssets = [...personalStatement.assets];
        const allLiabilities = [...personalStatement.liabilities];

        for(const teamItem of userTeams) {
            allTransactions.push(...teamItem.financialStatement.transactions);
            allAssets.push(...teamItem.financialStatement.assets);
            allLiabilities.push(...teamItem.financialStatement.liabilities);
        }
        
        return {
            transactions: Array.from(new Map(allTransactions.map((transactionItem: Transaction) => [transactionItem.id, transactionItem])).values()),
            assets: Array.from(new Map(allAssets.map((assetItem: Asset) => [assetItem.id, assetItem])).values()),
            liabilities: Array.from(new Map(allLiabilities.map((liabilityItem: Liability) => [liabilityItem.id, liabilityItem])).values())
        };
    }, [activeUser, teams]);

    const allCategories = useMemo(() => {
        const categories = new Set(effectiveFinancialStatement.transactions.map((tx: Transaction) => tx.category));
        return [...Array.from(categories)].sort();
    }, [effectiveFinancialStatement.transactions]);

    const historicalData = useMemo(() => activeUser ? generateHistoricalData(activeUser, teams) : [], [activeUser, teams]);
    
    // ACTIONS
    const setModalOpen = (modal: string, isOpen: boolean) => setModalStates(prev => ({ ...prev, [modal]: isOpen }));
    const setModalDataField = (field: string, value: any) => setModalData(p => ({...p, [field]: value}));

    const handleCreateTeam = async (name: string, invitedEmails: string[]) => {
        if (!activeUser) return;
        try {
            const memberIds = [activeUser.id];
            for (const email of invitedEmails) {
                const user = await dbService.findUserByEmail(email);
                if (user) {
                    memberIds.push(user.id);
                } else {
                    showNotification(`User with email ${email} not found. They need to register first.`, 'error');
                }
            }
            const newTeam = await dbService.createTeam(name, [...new Set(memberIds)]);
            for (const memberId of newTeam.memberIds) {
                if (memberId !== activeUser.id) {
                    await dbService.addMemberToTeam(newTeam.id, memberId);
                }
            }
            await refreshData(activeUser.id);
            showSuccessModal('Team Created!');
        } catch (e) {
            console.error(e);
            showNotification("Failed to create team.", 'error');
        }
    };
    
    const handleCompleteOnboarding = async () => {
        if (!activeUser) return;
        await dbService.updateUserField(activeUser.id, 'onboardingCompleted', true);
        await refreshData(activeUser.id);
    };

    const handleSaveTransaction = async (transactionData: (Omit<Transaction, 'id'> | Transaction) & { receiptImage?: string }) => {
        if (!activeUser) return;
        const isEditing = 'id' in transactionData;

        try {
            // Handle receipt upload if a new image is attached
            if (transactionData.receiptImage) {
                const newReceiptUrl = await dbService.uploadReceipt(transactionData.receiptImage, activeUser.id);
                transactionData.receiptUrl = newReceiptUrl;
            }
            // Remove the temporary base64 image data before saving
            delete transactionData.receiptImage;

            if (isEditing) {
                await dbService.updateTransaction(transactionData as Transaction);
            } else {
                if (transactionData.teamId) {
                    await dbService.addTeamTransaction(transactionData as Omit<Transaction, 'id'>);
                } else {
                    await dbService.addPersonalTransaction(activeUser.id, transactionData as Omit<Transaction, 'id'>);
                }
            }
            
            if (!isEditing) {
                await dbService.checkAndUnlockAchievement(activeUser.id, 'FIRST_TRANSACTION');
            }

            await refreshData(activeUser.id);
            showSuccessModal(isEditing ? 'Transaction Updated!' : 'Transaction Added!');
        } catch(e) { 
            console.error(e); 
            showNotification(`Failed to save transaction: ${(e as Error).message}`, 'error'); 
        }
    };
    
    const handleDeleteTransaction = async (transactionId: string) => {
        if (!activeUser) return;
        const tx = effectiveFinancialStatement.transactions.find((transactionItem: Transaction) => transactionItem.id === transactionId);
        if (tx && window.confirm(`Are you sure you want to delete "${tx.description}"?`)) {
            try {
                await dbService.deleteTransaction(tx);
                await refreshData(activeUser.id);
                showNotification('Transaction deleted.', 'success');
            } catch(e) { console.error(e); showNotification('Failed to delete transaction.', 'error'); }
        }
    };
    
    const handleTransfer = async (fromAccountId: string, toAccountId: string, amount: number) => {
        if (!activeUser) return;
        try {
            await dbService.performTransfer(activeUser.id, fromAccountId, toAccountId, amount);
            await refreshData(activeUser.id);
            showSuccessModal('Transfer Successful!');
        } catch(e) { console.error(e); showNotification((e as Error).message, 'error'); }
    };
    
    const handleDrawCosmicCard = async () => {
        if (!activeUser) return;
        setModalOpen('isCosmicEventModalOpen', true);
        setModalDataField('isGeneratingCosmicEvent', true);
        setModalDataField('currentCosmicEvent', null);
        try {
            const event = await getCosmicEvent(effectiveFinancialStatement, activeUser.accounts);
            setModalDataField('currentCosmicEvent', event);
        } catch(e) {
            console.error(e);
            setModalDataField('currentCosmicEvent', { title: 'Error', description: 'Could not generate event.', choices: [{ text: 'OK', outcome: { message: 'Please try again later.'}}]});
        } finally {
            setModalDataField('isGeneratingCosmicEvent', false);
        }
    };
    
    const handleCosmicEventResolution = async (outcome: EventOutcome) => {
        if (!activeUser) return;
        try {
            await dbService.applyEventOutcome(activeUser.id, outcome);
            await refreshData(activeUser.id);
        } catch(e) { console.error(e); showNotification('Failed to apply event outcome.', 'error'); }
    };
    
    const handleAddAccount = async (account: Omit<Account, 'id' | 'ownerIds'>) => {
        if (!activeUser) return;
        try {
            await dbService.addAccount(activeUser.id, account);
            await refreshData(activeUser.id);
            showSuccessModal('Account Added!');
        } catch(e) { console.error(e); showNotification('Failed to add account.', 'error'); }
    };

    const handleUpdateAccount = async (account: Account) => {
        try {
            await dbService.updateAccount(activeUser!.id, account);
             if (activeUser) await refreshData(activeUser.id);
             showNotification('Account updated.', 'success');
        } catch (e) { console.error(e); showNotification("Failed to update account.", 'error'); }
    };

    const handleSaveBudget = async (budget: Budget) => {
        if (!activeUser) return;
        try {
            await dbService.saveBudget(activeUser.id, budget);
            await refreshData(activeUser.id);
            showNotification('Budget saved!', 'success');
        } catch (e) { console.error(e); showNotification("Failed to save budget.", 'error'); }
    };
    
    const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
        if (!activeUser) return;
        try {
            await dbService.addGoal(activeUser.id, goalData);
            await refreshData(activeUser.id);
            showSuccessModal('Goal Created!');
        } catch (e) { console.error(e); showNotification("Failed to save goal.", 'error'); }
    };
    
    const handleDeleteGoal = async (goalId: string) => {
        if (!activeUser) return;
        try {
            await dbService.deleteGoal(activeUser.id, goalId);
            await refreshData(activeUser.id);
            showNotification('Goal deleted.', 'success');
        } catch (e) { console.error(e); showNotification("Failed to delete goal.", 'error'); }
    };
    
    const handleContributeToGoal = async (goal: Goal, amount: number, fromAccountId: string) => {
        if (!activeUser) return;
        try {
            const fromAccount = activeUser.accounts.find(accountItem => accountItem.id === fromAccountId);
            if (!fromAccount || fromAccount.balance < amount) throw new Error("Insufficient funds");
            
            // This logic should be a single transaction in a real backend
            fromAccount.balance -= amount;
            const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amount };
            await dbService.updateGoal(activeUser.id, updatedGoal);
            await dbService.updateAccount(activeUser.id, fromAccount);
            
            await refreshData(activeUser.id);
            showNotification('Contribution successful!', 'success');
        } catch(e) { console.error(e); showNotification((e as Error).message, 'error'); }
    };

    const handleSaveStock = async (stockData: Partial<Asset>, teamId?: string) => {
        if (!activeUser) return;
        const isEditing = modalData.stockToEdit;
        try {
            if (teamId) {
                if (isEditing) await dbService.updateTeamAsset(teamId, modalData.stockToEdit.id, stockData);
                else await dbService.addTeamAsset(teamId, stockData);
            } else {
                if (isEditing) await dbService.updateAsset(activeUser.id, modalData.stockToEdit.id, stockData);
                else await dbService.addAsset(activeUser.id, stockData);
            }
            if (!isEditing) {
                await dbService.checkAndUnlockAchievement(activeUser.id, 'FIRST_INVESTMENT');
            }
            await refreshData(activeUser.id);
            showSuccessModal('Stock saved!');
        } catch (e) { console.error(e); showNotification("Failed to save stock.", 'error'); }
    };

    const handleLogDividend = async (amount: number, accountId: string) => {
        if (!activeUser || !modalData.stockForDividend) return;
        try {
            await dbService.logDividend(activeUser.id, modalData.stockForDividend, amount, accountId);
            await refreshData(activeUser.id);
            showSuccessModal('Dividend Logged!');
        } catch (e) { console.error(e); showNotification((e as Error).message, 'error'); }
    };

    const handleDeleteStock = async (stockId: string) => {
        if (!activeUser) return;
        if (window.confirm("Are you sure you want to sell this stock? This will remove it from your portfolio.")) {
            try {
                await dbService.deleteAsset(activeUser.id, stockId);
                await refreshData(activeUser.id);
                showNotification('Stock sold and removed from portfolio.', 'success');
            } catch (e) { console.error(e); showNotification("Failed to delete stock.", 'error'); }
        }
    };

    const handleAddAssetLiability = async (data: Partial<Asset | Liability>, teamId?: string) => {
        if (!activeUser) return;
        try {
            if (teamId) {
                if ('value' in data) await dbService.addTeamAsset(teamId, data);
                else await dbService.addTeamLiability(teamId, data);
            } else {
                if ('value' in data) await dbService.addAsset(activeUser.id, data);
                else await dbService.addLiability(activeUser.id, data);
            }
            await refreshData(activeUser.id);
            showSuccessModal('Item added to portfolio!');
        } catch (e) { console.error(e); showNotification("Failed to add item.", 'error'); }
    };
    
    const handleUpdateAssetLiability = async (data: Partial<Asset | Liability>, teamId?: string) => {
        if (!activeUser || !modalData.assetLiabilityToEdit) return;
        const itemId = modalData.assetLiabilityToEdit.id;
        try {
            if (teamId) {
                if ('value' in data) await dbService.updateTeamAsset(teamId, itemId, data);
                else await dbService.updateTeamLiability(teamId, itemId, data);
            } else {
                if ('value' in data) await dbService.updateAsset(activeUser.id, itemId, data);
                else await dbService.updateLiability(activeUser.id, itemId, data);
            }
            await refreshData(activeUser.id);
            showNotification('Item updated!', 'success');
        } catch (e) { console.error(e); showNotification("Failed to update item.", 'error'); }
    };
    
    const handleAddCategory = (category: string) => {
        // This is a client-side only operation for now to provide immediate feedback.
        // The category will be saved with the transaction.
        showNotification(`Category "${category}" created!`, 'success');
    };

    const handleImportTransactions = async (parsedTransactions: any[]) => {
        if (!activeUser) return;
        try {
            const batch = db.batch();
            for (const ptx of parsedTransactions) {
                if (ptx.isTransfer) {
                    // This is a simplified transfer for import, assuming it's personal
                    const fromRef = db.collection(`users/${activeUser.id}/accounts`).doc(ptx.fromAccountId);
                    const toRef = db.collection(`users/${activeUser.id}/accounts`).doc(ptx.toAccountId);
                    batch.update(fromRef, { balance: firebase.firestore.FieldValue.increment(-ptx.amount) });
                    batch.update(toRef, { balance: firebase.firestore.FieldValue.increment(ptx.amount) });
                } else {
                    const transactionData: Omit<Transaction, 'id'> = {
                        description: ptx.description,
                        amount: ptx.amount,
                        type: ptx.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
                        category: ptx.category,
                        date: ptx.date,
                        isPassive: ptx.isPassive || false,
                        teamId: ptx.teamId || undefined,
                        paymentShares: [{ userId: activeUser.id, accountId: ptx.accountId, amount: ptx.amount }],
                        expenseShares: [{ userId: activeUser.id, amount: ptx.amount }]
                    };

                    const collectionPath = ptx.teamId ? `teams/${ptx.teamId}/transactions` : `users/${activeUser.id}/transactions`;
                    const txRef = db.collection(collectionPath).doc();
                    batch.set(txRef, transactionData);

                    const accountCollectionPath = ptx.teamId ? `teams/${ptx.teamId}/accounts` : `users/${activeUser.id}/accounts`;
                    const accountRef = db.collection(accountCollectionPath).doc(ptx.accountId);
                    const increment = transactionData.type === TransactionType.INCOME ? ptx.amount : -ptx.amount;
                    batch.update(accountRef, { balance: firebase.firestore.FieldValue.increment(increment) });
                }
            }
            await batch.commit();
            await refreshData(activeUser.id);
            showSuccessModal(`${parsedTransactions.length} items imported!`);
        } catch (e) {
            console.error("Failed to import transactions:", e);
            showNotification(`An error occurred during import: ${(e as Error).message}`, 'error');
        }
    };

    const actions = {
        setSelectedTeamId, setModalOpen, handleCreateTeam, handleCompleteOnboarding,
        handleTeamClick: (teamId: string) => { setActiveView('team-detail'); setSelectedTeamId(teamId); },
        handleBackToTeams: () => { setActiveView('teams'); setSelectedTeamId(null); },
        handleOpenAddTransactionModal: (teamId?: string) => { setModalData({ transactionToEdit: null, modalDefaultTeamId: teamId }); setModalOpen('isAddTransactionModalOpen', true); },
        handleOpenEditTransactionModal: (transaction: Transaction) => { setModalData({ transactionToEdit: transaction, modalDefaultTeamId: transaction.teamId }); setModalOpen('isAddTransactionModalOpen', true); },
        handleSaveTransaction,
        handleDeleteTransaction,
        handleTransfer,
        handleDrawCosmicCard,
        handleCosmicEventResolution,
        handleSaveStock,
        handleDeleteStock,
        handleLogDividend,
        handleAddAccount,
        handleUpdateAccount,
        handleAddAssetLiability,
        handleUpdateAssetLiability,
        handleSaveBudget,
        handleSaveGoal,
        handleDeleteGoal,
        handleContributeToGoal,
        handleImportTransactions,
        handleAddCategory,
        handleTransactionClick: (transaction: Transaction) => { setModalData({ selectedTransaction: transaction }); setModalOpen('isTransactionDetailModalOpen', true); },
        handleCategoryClick: (category: string) => { setModalData({ selectedCategory: category }); setModalOpen('isCategoryModalOpen', true); },
        handleStatCardClick: () => setModalOpen('isNetWorthBreakdownModalOpen', true),
        handleViewReceipt: (url: string) => { setModalData({ receiptUrlToView: url }); setModalOpen('isReceiptModalOpen', true); },
        handleViewSplitDetails: (transaction: Transaction) => { setModalData({ selectedTransaction: transaction }); setModalOpen('isSplitDetailModalOpen', true); },
        handleOpenAddStockModal: (teamId?: string) => { setModalData({ stockToEdit: null, modalDefaultTeamId: teamId }); setModalOpen('isAddStockModalOpen', true); },
        handleOpenEditStockModal: (stock: Asset) => { setModalData({ stockToEdit: stock, modalDefaultTeamId: stock.teamId }); setModalOpen('isAddStockModalOpen', true); },
        handleOpenLogDividendModal: (stock: Asset) => { setModalData({ stockForDividend: stock }); setModalOpen('isLogDividendModalOpen', true); },
        openLargeChartModal: (stock: Asset) => setModalDataField('stockForLargeChart', stock),
        closeLargeChartModal: () => setModalDataField('stockForLargeChart', null),
        handleOpenAccountTransactionsModal: (account: Account) => { setModalData({ accountForTransactionList: account }); setModalOpen('isAccountTransactionsModalOpen', true); },
        handleOpenEditAccountModal: (account: Account) => { setModalData({ accountToEdit: account }); setModalOpen('isEditAccountModalOpen', true); },
        handleOpenAddAssetLiabilityModal: (type: 'asset' | 'liability', teamId?: string) => { setModalData({ assetLiabilityToAdd: type, assetLiabilityToEdit: null, modalDefaultTeamId: teamId }); setModalOpen('isAddAssetLiabilityModalOpen', true); },
        handleOpenEditAssetLiabilityModal: (item: Asset | Liability) => { setModalData({ assetLiabilityToAdd: 'value' in item ? 'asset' : 'liability', assetLiabilityToEdit: item, modalDefaultTeamId: item.teamId }); setModalOpen('isAddAssetLiabilityModalOpen', true); },
        handleOpenContributeToGoalModal: (goal: Goal) => { setModalData({ goalToContribute: goal }); setModalOpen('isContributeToGoalModalOpen', true); },
        setModalDataField,
        setNotification,
    };

    return (
        <AppContext.Provider value={{
            activeView, users, teams, activeUser, selectedTeam, isLoading, error, notification,
            modalStates, modalData, effectiveFinancialStatement, historicalData, allUserAccounts, allCategories,
            setActiveView, handleLogout, actions
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
