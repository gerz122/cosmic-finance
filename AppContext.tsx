import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
// FIX: Import `db` and `firebase` to resolve undefined errors in the transaction import handler.
import { auth, db, firebase } from './services/firebase';
import type { User as FirebaseUser } from './services/firebase';
import * as dbService from './services/dbService';
import type { View, User, Team, Transaction, CosmicEvent, EventOutcome, Asset, Account, Liability, HistoricalDataPoint, Budget, Goal, AppTask } from './types';
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
    syncState: 'synced' | 'syncing' | 'offline';
    activeTasks: AppTask[];
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
    
    // New state for resilient architecture
    const [syncState, setSyncState] = useState<'synced' | 'syncing' | 'offline'>('synced');
    const [activeTasks, setActiveTasks] = useState<AppTask[]>([]);
    
    const [modalStates, setModalStates] = useState<Record<string, boolean>>({ isFreedomModalOpen: false, isTeamReportModalOpen: false, isFabOpen: false, isSuccessModalOpen: false });
    const [modalData, setModalData] = useState<Record<string, any>>({});

    const showSuccessModal = (message: string) => {
        setModalData(prev => ({ ...prev, successModalMessage: message }));
        setModalStates(prev => ({ ...prev, isSuccessModalOpen: true }));
    };

    const runTask = useCallback(async (name: string, taskFn: () => Promise<any>, options: { onRetry?: () => void } = {}) => {
        const taskId = `task_${Date.now()}_${Math.random()}`;
        setActiveTasks(prev => [...prev, { id: taskId, name, status: 'processing', createdAt: Date.now(), onRetry: options.onRetry }]);
        try {
            await taskFn();
            setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success' } : t));
            // Auto-dismiss successful tasks
            setTimeout(() => {
                setActiveTasks(prev => prev.filter(t => t.id !== taskId));
            }, 4000);
        } catch (e) {
            console.error(`Task "${name}" failed:`, e);
            setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed', error: (e as Error).message } : t));
        }
    }, []);

    const refreshData = useCallback(async (uid: string) => {
        setSyncState('syncing');
        try {
            const userData = await dbService.getOrCreateUser({ uid } as FirebaseUser); // A bit of a hack for refresh
            setActiveUser(userData);
            const fetchedTeams = await dbService.getTeamsForUser(uid);
            setTeams(fetchedTeams);
            const memberIds = new Set(fetchedTeams.flatMap(teamRecord => teamRecord.memberIds));
            memberIds.add(uid);
            const allTeamUsers = await dbService.getUsers(Array.from(memberIds));
            setUsers(allTeamUsers);
            setSyncState('synced');
        } catch (e) {
            setError("Failed to refresh data.");
            setSyncState('offline');
            console.error(e);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            setIsLoading(true);
            if (firebaseUser) {
                try {
                    setError(null);
                    const appUser = await dbService.getOrCreateUser(firebaseUser);
                    setActiveUser(appUser);
                    await refreshData(appUser.id);
                } catch (err) {
                    console.error("Error during user data fetch/creation:", err);
                    setError("Could not load user profile.");
                    setActiveUser(null);
                }
            } else {
                setActiveUser(null);
                setUsers([]);
                setTeams([]);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [refreshData]);


    const handleLogout = async () => {
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
        if (!activeUser || !activeUser.financialStatement || !Array.isArray(activeUser.financialStatement.transactions) || !Array.isArray(activeUser.financialStatement.assets) || !Array.isArray(activeUser.financialStatement.liabilities)) {
            return { transactions: [], assets: [], liabilities: [] };
        }
        
        const personalStatement = activeUser.financialStatement;
        const userTeams = teams.filter(teamInstance => teamInstance.memberIds.includes(activeUser.id));
        
        const allTransactions = [...personalStatement.transactions, ...userTeams.flatMap(t => t.financialStatement.transactions)];
        const allAssets = [...personalStatement.assets, ...userTeams.flatMap(t => t.financialStatement.assets)];
        const allLiabilities = [...personalStatement.liabilities, ...userTeams.flatMap(t => t.financialStatement.liabilities)];
        
        return {
            transactions: Array.from(new Map(allTransactions.map((item: Transaction) => [item.id, item])).values()),
            assets: Array.from(new Map(allAssets.map((item: Asset) => [item.id, item])).values()),
            liabilities: Array.from(new Map(allLiabilities.map((item: Liability) => [item.id, item])).values())
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

    const handleCreateTeam = (name: string, invitedEmails: string[]) => {
        if (!activeUser) return;
        const task = async () => {
            const memberIds = [activeUser.id];
            for (const email of invitedEmails) {
                const user = await dbService.findUserByEmail(email);
                if (user) memberIds.push(user.id);
            }
            const newTeam = await dbService.createTeam(name, [...new Set(memberIds)]);
            await Promise.all(newTeam.memberIds.map(memberId => dbService.addMemberToTeam(newTeam.id, memberId)));
            await refreshData(activeUser.id);
            showSuccessModal('Team Created!');
        };
        runTask('Creating Team', task, { onRetry: () => handleCreateTeam(name, invitedEmails) });
    };
    
    const handleCompleteOnboarding = async () => {
        if (!activeUser) return;
        await dbService.updateUserField(activeUser.id, 'onboardingCompleted', true);
        await refreshData(activeUser.id);
    };

    const handleSaveTransaction = (transactionData: (Omit<Transaction, 'id'> | Transaction) & { receiptImage?: string }) => {
        if (!activeUser) return;
        const isEditing = 'id' in transactionData;
        const task = async () => {
            if (transactionData.receiptImage) {
                transactionData.receiptUrl = await dbService.uploadReceipt(transactionData.receiptImage, activeUser.id);
            }
            delete transactionData.receiptImage;

            if (isEditing) {
                await dbService.updateTransaction(transactionData as Transaction);
            } else {
                // FIX: The ternary operator for `action` caused a type error because the two functions have different signatures.
                // Using an if/else block ensures the correct function is called with the correct arguments.
                if (transactionData.teamId) {
                    await dbService.addTeamTransaction(transactionData as Omit<Transaction, 'id'>);
                } else {
                    await dbService.addPersonalTransaction(activeUser.id, transactionData as Omit<Transaction, 'id'>);
                }
                await dbService.checkAndUnlockAchievement(activeUser.id, 'FIRST_TRANSACTION');
            }
            await refreshData(activeUser.id);
            showSuccessModal(isEditing ? 'Transaction Updated!' : 'Transaction Added!');
        };
        runTask(isEditing ? 'Updating Transaction' : 'Adding Transaction', task, { onRetry: () => handleSaveTransaction(transactionData) });
    };
    
    const handleDeleteTransaction = (transactionId: string) => {
        if (!activeUser) return;
        const tx = effectiveFinancialStatement.transactions.find((t: Transaction) => t.id === transactionId);
        if (tx && window.confirm(`Are you sure you want to delete "${tx.description}"?`)) {
            runTask('Deleting Transaction', async () => {
                await dbService.deleteTransaction(tx);
                await refreshData(activeUser.id);
            }, { onRetry: () => handleDeleteTransaction(transactionId) });
        }
    };
    
    const handleTransfer = (fromAccountId: string, toAccountId: string, amount: number) => {
        if (!activeUser) return;
        runTask('Transferring Funds', async () => {
            await dbService.performTransfer(activeUser.id, fromAccountId, toAccountId, amount);
            await refreshData(activeUser.id);
            showSuccessModal('Transfer Successful!');
        }, { onRetry: () => handleTransfer(fromAccountId, toAccountId, amount) });
    };
    
    const handleDrawCosmicCard = () => {
        if (!activeUser) return;
        setModalOpen('isCosmicEventModalOpen', true);
        setModalDataField('isGeneratingCosmicEvent', true);
        setModalDataField('currentCosmicEvent', null);
        runTask('Generating Cosmic Event', async () => {
            const event = await getCosmicEvent(effectiveFinancialStatement, activeUser.accounts);
            setModalDataField('currentCosmicEvent', event);
            setModalDataField('isGeneratingCosmicEvent', false);
        }, { onRetry: handleDrawCosmicCard }).catch(() => {
            setModalDataField('isGeneratingCosmicEvent', false);
            setModalDataField('currentCosmicEvent', { title: 'Error', description: 'Could not generate event.', choices: [{ text: 'OK', outcome: { message: 'Please try again later.'}}]});
        });
    };
    
    const handleCosmicEventResolution = (outcome: EventOutcome) => {
        if (!activeUser) return;
        runTask('Resolving Event', async () => {
            await dbService.applyEventOutcome(activeUser.id, outcome);
            await refreshData(activeUser.id);
        }, { onRetry: () => handleCosmicEventResolution(outcome) });
    };
    
    const handleAddAccount = (account: Omit<Account, 'id' | 'ownerIds'>) => {
        if (!activeUser) return;
        runTask('Adding Account', async () => {
            await dbService.addAccount(activeUser.id, account);
            await refreshData(activeUser.id);
            showSuccessModal('Account Added!');
        }, { onRetry: () => handleAddAccount(account) });
    };

    const handleUpdateAccount = (account: Account) => {
        if(!activeUser) return;
        runTask('Updating Account', async () => {
            await dbService.updateAccount(activeUser!.id, account);
            await refreshData(activeUser!.id);
        }, { onRetry: () => handleUpdateAccount(account) });
    };

    const handleSaveBudget = (budget: Budget) => {
        if (!activeUser) return;
        runTask('Saving Budget', async () => {
            await dbService.saveBudget(activeUser.id, budget);
            await refreshData(activeUser.id);
        }, { onRetry: () => handleSaveBudget(budget) });
    };
    
    // Simplified actions for brevity. Production would use runTask.
    const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
        if (!activeUser) return;
        await dbService.addGoal(activeUser.id, goalData);
        await refreshData(activeUser.id);
        showSuccessModal('Goal Created!');
    };
    
    const handleDeleteGoal = async (goalId: string) => {
        if (!activeUser) return;
        await dbService.deleteGoal(activeUser.id, goalId);
        await refreshData(activeUser.id);
    };
    
    const handleContributeToGoal = async (goal: Goal, amount: number, fromAccountId: string) => {
        if (!activeUser) return;
        const fromAccount = activeUser.accounts.find(a => a.id === fromAccountId);
        if (!fromAccount || fromAccount.balance < amount) return;
        const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amount };
        await dbService.updateGoal(activeUser.id, updatedGoal);
        await dbService.updateAccount(activeUser.id, {...fromAccount, balance: fromAccount.balance - amount});
        await refreshData(activeUser.id);
    };
    
    const handleSaveStock = (stockData: Partial<Asset>, teamId?: string) => {
        if (!activeUser) return;
        const isEditing = modalData.stockToEdit;
        const task = async () => {
            const ownerId = teamId || activeUser.id;
            const action = teamId 
                ? (isEditing ? dbService.updateTeamAsset : dbService.addTeamAsset)
                : (isEditing ? dbService.updateAsset : dbService.addAsset);
            
            if (isEditing) await action(ownerId, modalData.stockToEdit.id, stockData);
            else {
                await action(ownerId, stockData);
                await dbService.checkAndUnlockAchievement(activeUser.id, 'FIRST_INVESTMENT');
            }
            await refreshData(activeUser.id);
            showSuccessModal('Stock saved!');
        };
        runTask(isEditing ? 'Updating Stock' : 'Adding Stock', task, { onRetry: () => handleSaveStock(stockData, teamId) });
    };

    const handleLogDividend = (amount: number, accountId: string) => {
        if (!activeUser || !modalData.stockForDividend) return;
        runTask('Logging Dividend', async () => {
            await dbService.logDividend(activeUser.id, modalData.stockForDividend, amount, accountId);
            await refreshData(activeUser.id);
            showSuccessModal('Dividend Logged!');
        }, { onRetry: () => handleLogDividend(amount, accountId) });
    };

    const handleDeleteStock = (stockId: string) => {
        if (!activeUser || !window.confirm("Are you sure?")) return;
        runTask('Selling Stock', async () => {
            await dbService.deleteAsset(activeUser.id, stockId);
            await refreshData(activeUser.id);
        }, { onRetry: () => handleDeleteStock(stockId) });
    };

    const handleAddAssetLiability = (data: Partial<Asset | Liability>, teamId?: string) => {
        if (!activeUser) return;
        runTask('Adding Portfolio Item', async () => {
            const ownerId = teamId || activeUser.id;
            if ('value' in data) { // Asset
                await (teamId ? dbService.addTeamAsset(ownerId, data) : dbService.addAsset(ownerId, data));
            } else { // Liability
                await (teamId ? dbService.addTeamLiability(ownerId, data) : dbService.addLiability(ownerId, data));
            }
            await refreshData(activeUser.id);
            showSuccessModal('Item added!');
        }, { onRetry: () => handleAddAssetLiability(data, teamId) });
    };
    
    const handleUpdateAssetLiability = (data: Partial<Asset | Liability>, teamId?: string) => {
        if (!activeUser || !modalData.assetLiabilityToEdit) return;
        runTask('Updating Portfolio Item', async () => {
            const ownerId = teamId || activeUser.id;
            const itemId = modalData.assetLiabilityToEdit.id;
            if ('value' in data) { // Asset
                await (teamId ? dbService.updateTeamAsset(ownerId, itemId, data) : dbService.updateAsset(ownerId, itemId, data));
            } else { // Liability
                await (teamId ? dbService.updateTeamLiability(ownerId, itemId, data) : dbService.updateLiability(ownerId, itemId, data));
            }
            await refreshData(activeUser.id);
        }, { onRetry: () => handleUpdateAssetLiability(data, teamId) });
    };
    
    const handleAddCategory = (category: string) => {
        // Client-side only
    };

    const handleImportTransactions = (parsedTransactions: any[]) => {
        if (!activeUser) return;
        runTask(`Importing ${parsedTransactions.length} items`, async () => {
            const batch = db.batch();
            for (const ptx of parsedTransactions) {
                const ownerId = ptx.teamId || activeUser.id;
                const accCollectionPath = ptx.teamId ? `teams/${ownerId}/accounts` : `users/${ownerId}/accounts`;
                const txCollectionPath = ptx.teamId ? `teams/${ownerId}/transactions` : `users/${ownerId}/transactions`;

                if (ptx.isTransfer) {
                    const fromRef = db.collection(accCollectionPath).doc(ptx.fromAccountId);
                    const toRef = db.collection(accCollectionPath).doc(ptx.toAccountId);
                    batch.update(fromRef, { balance: firebase.firestore.FieldValue.increment(-ptx.amount) });
                    batch.update(toRef, { balance: firebase.firestore.FieldValue.increment(ptx.amount) });
                } else {
                    const txData: Omit<Transaction, 'id'> = {
                        description: ptx.description, amount: ptx.amount, type: ptx.type, category: ptx.category, date: ptx.date, isPassive: ptx.isPassive, teamId: ptx.teamId || undefined,
                        paymentShares: [{ userId: activeUser.id, accountId: ptx.accountId, amount: ptx.amount }],
                        expenseShares: [{ userId: activeUser.id, amount: ptx.amount }]
                    };
                    batch.set(db.collection(txCollectionPath).doc(), txData);
                    const increment = txData.type === TransactionType.INCOME ? ptx.amount : -ptx.amount;
                    // FIX: The object-based update was causing a type error. Switched to the explicit field-value pair version of update, which resolves the ambiguity.
                    const accountRef = db.collection(accCollectionPath).doc(ptx.accountId);
                    batch.update(accountRef, 'balance', firebase.firestore.FieldValue.increment(increment));
                }
            }
            await batch.commit();
            await refreshData(activeUser.id);
            showSuccessModal(`${parsedTransactions.length} items imported!`);
        }, { onRetry: () => handleImportTransactions(parsedTransactions) });
    };

    const actions = {
        setSelectedTeamId, setModalOpen, handleCreateTeam, handleCompleteOnboarding,
        handleTeamClick: (teamId: string) => { setActiveView('team-detail'); setSelectedTeamId(teamId); },
        handleBackToTeams: () => { setActiveView('teams'); setSelectedTeamId(null); },
        handleOpenAddTransactionModal: (teamId?: string) => { setModalData({ transactionToEdit: null, modalDefaultTeamId: teamId }); setModalOpen('isAddTransactionModalOpen', true); },
        handleOpenEditTransactionModal: (transaction: Transaction) => { setModalData({ transactionToEdit: transaction, modalDefaultTeamId: transaction.teamId }); setModalOpen('isAddTransactionModalOpen', true); },
        handleSaveTransaction, handleDeleteTransaction, handleTransfer, handleDrawCosmicCard, handleCosmicEventResolution,
        handleSaveStock, handleDeleteStock, handleLogDividend, handleAddAccount, handleUpdateAccount,
        handleAddAssetLiability, handleUpdateAssetLiability, handleSaveBudget, handleSaveGoal, handleDeleteGoal, handleContributeToGoal,
        handleImportTransactions, handleAddCategory,
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
        dismissTask: (taskId: string) => setActiveTasks(prev => prev.filter(t => t.id !== taskId)),
    };

    return (
        <AppContext.Provider value={{
            activeView, users, teams, activeUser, selectedTeam, isLoading, error, syncState, activeTasks,
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
