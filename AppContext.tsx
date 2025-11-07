import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback, ErrorInfo } from 'react';
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
            const result = await taskFn();
            setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success' } : t));
            return result;
        } catch (e) {
            console.error(`Task "${name}" failed:`, e);
            const errorMessage = (e as Error).message;
            setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed', error: errorMessage } : t));
            throw e; // Re-throw to be caught by caller if needed
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
        return ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Business Expense', 'Maintenance', 'Other', 'Goals', 'Job', 'Investment', 'Loan', 'Team Contribution', 'Transfer', 'Cosmic Event', 'Initial Balance', 'Rental', 'Mortgage', 'Business Income', ...Array.from(categories)].filter((v, i, a) => a.indexOf(v) === i).sort();
    }, [effectiveFinancialStatement.transactions]);

    const historicalData = useMemo(() => activeUser ? generateHistoricalData(activeUser, teams) : [], [activeUser, teams]);
    
    // ACTIONS
    const setModalOpen = (modal: string, isOpen: boolean) => setModalStates(prev => ({ ...prev, [modal]: isOpen }));
    const setModalDataField = (field: string, value: any) => setModalData(p => ({...p, [field]: value}));
    
    const logErrorTask = useCallback((error: Error, errorInfo: ErrorInfo) => {
        const taskId = `error_${Date.now()}`;
        const name = `UI Error: ${error.message}`;
        const errorDetails = `Component Stack:\n${errorInfo.componentStack}`;
        setActiveTasks(prev => [...prev, { id: taskId, name, status: 'failed', error: errorDetails, createdAt: Date.now() }]);
    }, []);

    const handleCreateTeam = (name: string, invitedEmails: string[], initialGoal: string, initialAccountName: string) => {
        if (!activeUser) return;
        const task = async () => {
            const memberIds = [activeUser.id];
            for (const email of invitedEmails) {
                const user = await dbService.findUserByEmail(email);
                if (user) memberIds.push(user.id);
            }
            await dbService.createTeam(name, [...new Set(memberIds)], initialGoal, initialAccountName);
            await refreshData(activeUser.id);
            showSuccessModal('Team Created!');
        };
        runTask('Creating Team', task, { onRetry: () => handleCreateTeam(name, invitedEmails, initialGoal, initialAccountName) });
    };
    
    const handleCompleteOnboarding = async () => {
        if (!activeUser) return;
        await dbService.updateUserField(activeUser.id, 'onboardingCompleted', true);
        await refreshData(activeUser.id);
    };

    const handleSaveTransaction = (transactionData: Omit<Transaction, 'id'> | (Transaction & { receiptImage?: string })) => {
        if (!activeUser) return;
        const isEditing = 'id' in transactionData;
        const task = async () => {
            let fullTransactionData: Transaction;
            if ('receiptImage' in transactionData && transactionData.receiptImage) {
                transactionData.receiptUrl = await dbService.uploadReceipt(transactionData.receiptImage, activeUser.id);
            }
            delete (transactionData as any).receiptImage;

            if (isEditing) {
                fullTransactionData = transactionData as Transaction;
                await dbService.updateTransaction(fullTransactionData);
            } else {
                 fullTransactionData = { ...transactionData, id: crypto.randomUUID() } as Transaction;
                if (fullTransactionData.teamId) {
                    await dbService.addTeamTransaction(fullTransactionData);
                } else {
                    await dbService.addPersonalTransaction(activeUser.id, fullTransactionData);
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
    
    const handleAddAccount = (accountData: Omit<Account, 'id' | 'ownerIds'>, teamId?: string): Promise<Account | void> => {
        if (!activeUser) return Promise.resolve();
        const team = teams.find(t => t.id === teamId);
        const task = async () => {
            let newAccount: Account;
            if (teamId && team) {
                newAccount = await dbService.addTeamAccount(teamId, team.memberIds, accountData);
            } else {
                newAccount = await dbService.addAccount(activeUser.id, accountData);
            }
            await refreshData(activeUser.id);
            showSuccessModal('Account Added!');
            return newAccount;
        };
        return runTask('Adding Account', task, { onRetry: () => handleAddAccount(accountData, teamId) });
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
    
    const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'currentAmount'>, initialContribution: number, fromAccountId: string) => {
        if (!activeUser) return;
        const newGoal: Goal = { ...goalData, id: crypto.randomUUID(), currentAmount: 0 };
        runTask('Creating Goal', async () => {
            await dbService.addGoal(activeUser.id, newGoal, initialContribution, fromAccountId);
            await refreshData(activeUser.id);
            showSuccessModal('Goal Created!');
        }, { onRetry: () => handleSaveGoal(goalData, initialContribution, fromAccountId) });
    };
    
    const handleDeleteGoal = async (goalId: string) => {
        if (!activeUser) return;
        if (!window.confirm("Are you sure you want to delete this goal?")) return;
        runTask('Deleting Goal', async () => {
            await dbService.deleteGoal(activeUser.id, goalId);
            await refreshData(activeUser.id);
        });
    };
    
    const handleContributeToGoal = async (goal: Goal, amount: number, fromAccountId: string) => {
        if (!activeUser) return;
        runTask('Contributing to Goal', async () => {
            await dbService.contributeToGoal(activeUser.id, goal, amount, fromAccountId);
            await refreshData(activeUser.id);
            showSuccessModal(`$${amount} added to ${goal.name}!`);
        }, { onRetry: () => handleContributeToGoal(goal, amount, fromAccountId) });
    };
    
    const handleSaveStock = (stockData: Partial<Asset>, teamId?: string) => {
        if (!activeUser) return;
        const isEditing = modalData.stockToEdit;
        const task = async () => {
            const ownerId = teamId || activeUser.id;
            
            if (isEditing) {
                const action = teamId ? dbService.updateTeamAsset : dbService.updateAsset;
                await action(ownerId, modalData.stockToEdit.id, stockData);
            } else {
                const action = teamId ? dbService.addTeamAsset : dbService.addAsset;
                const fullAsset: Asset = { ...stockData, id: crypto.randomUUID() } as Asset;
                await action(ownerId, fullAsset);
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
            const fullItem = { ...data, id: crypto.randomUUID() };
            if ('value' in fullItem) { // Asset
                await (teamId ? dbService.addTeamAsset(ownerId, fullItem as Asset) : dbService.addAsset(ownerId, fullItem as Asset));
            } else { // Liability
                await (teamId ? dbService.addTeamLiability(ownerId, fullItem as Liability) : dbService.addLiability(ownerId, fullItem as Liability));
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
    
    const handleAddCategory = useCallback((category: string) => {
       // This is a client-side only action now, but we keep the structure for potential future persistence
       console.log("New category added client-side:", category);
    }, []);

    const handleAddCategoryWithCallback = (category: string) => {
        handleAddCategory(category);
        if (modalData.addCategorySuccessCallback) {
            modalData.addCategorySuccessCallback(category);
        }
    };
    
    const handleImportData = (data: { user: User, teams: Team[] }) => {
        if (!activeUser) return;
        runTask('Importing Data', async () => {
            const batch = db.batch();
            
            const processTransactions = async (transactions: any[], ownerId: string, isTeam: boolean) => {
                const collectionPath = isTeam ? `teams/${ownerId}/transactions` : `users/${ownerId}/transactions`;
                for (let t of transactions) {
                    if (t.receiptDataUrl) {
                        t.receiptUrl = await dbService.uploadReceipt(t.receiptDataUrl, activeUser.id);
                        delete t.receiptDataUrl;
                    }
                    batch.set(db.collection(collectionPath).doc(t.id), t, { merge: true });
                }
            };

            const { financialStatement, accounts, budgets, goals, ...mainUser } = data.user;
            batch.set(db.collection('users').doc(mainUser.id), mainUser, { merge: true });
            accounts.forEach(a => batch.set(db.collection('users').doc(mainUser.id).collection('accounts').doc(a.id), a, { merge: true }));
            budgets.forEach(b => batch.set(db.collection('users').doc(mainUser.id).collection('budgets').doc(b.month), b, { merge: true }));
            goals.forEach(g => batch.set(db.collection('users').doc(mainUser.id).collection('goals').doc(g.id), g, { merge: true }));
            financialStatement.assets.forEach(a => batch.set(db.collection('users').doc(mainUser.id).collection('assets').doc(a.id), a, { merge: true }));
            financialStatement.liabilities.forEach(l => batch.set(db.collection('users').doc(mainUser.id).collection('liabilities').doc(l.id), l, { merge: true }));
            await processTransactions(financialStatement.transactions, mainUser.id, false);

            for (const team of data.teams) {
                const { financialStatement: tf, accounts: ta, ...mainTeam } = team;
                batch.set(db.collection('teams').doc(mainTeam.id), mainTeam, { merge: true });
                ta.forEach(a => batch.set(db.collection('teams').doc(mainTeam.id).collection('accounts').doc(a.id), a, { merge: true }));
                tf.assets.forEach(a => batch.set(db.collection('teams').doc(mainTeam.id).collection('assets').doc(a.id), a, { merge: true }));
                tf.liabilities.forEach(l => batch.set(db.collection('teams').doc(mainTeam.id).collection('liabilities').doc(l.id), l, { merge: true }));
                await processTransactions(tf.transactions, mainTeam.id, true);
            }
            
            await batch.commit();
            await refreshData(activeUser.id);
            showSuccessModal('Data imported successfully!');

        }, { onRetry: () => handleImportData(data) });
    };

    const handleImportFromAI = (proposedActions: any[]) => {
        if (!activeUser) return;
        runTask(`Importing ${proposedActions.length} AI actions`, async () => {
            for (const action of proposedActions) {
                const { name, args } = action;
                switch (name) {
                    case 'add_transaction': {
                        const allAccounts = [...activeUser.accounts, ...teams.flatMap(t => t.accounts)];
                        let account = allAccounts.find(a => a.name.toLowerCase() === args.account_name.toLowerCase());
                        if (!account) { // Create if not exists
                           const newAccData = { name: args.account_name, type: 'Checking' as any, balance: 0 };
                           account = await dbService.addAccount(activeUser.id, newAccData);
                        }
                        const txData = {
                             description: args.description, amount: args.amount, type: args.type, category: args.category, date: args.date, isPassive: args.is_passive,
                             paymentShares: [{ userId: activeUser.id, accountId: account.id, amount: args.amount }],
                             expenseShares: args.type === 'EXPENSE' ? [{ userId: activeUser.id, amount: args.amount }] : []
                        };
                        await handleSaveTransaction(txData);
                        break;
                    }
                    case 'create_account': {
                        await handleAddAccount({ name: args.name, type: args.type, balance: args.initial_balance });
                        break;
                    }
                    case 'create_team': {
                         await handleCreateTeam(args.name, [], '', '');
                         break;
                    }
                }
            }
            await refreshData(activeUser.id);
        });
    };
    
    const actions = {
        setSelectedTeamId, setModalOpen, handleCreateTeam, handleCompleteOnboarding, logErrorTask,
        handleTeamClick: (teamId: string) => { setActiveView('team-detail'); setSelectedTeamId(teamId); },
        handleBackToTeams: () => { setActiveView('teams'); setSelectedTeamId(null); },
        handleOpenAddTransactionModal: (teamId?: string, onSaveOverride?: (data: any) => void) => { setModalData({ transactionToEdit: null, modalDefaultTeamId: teamId, transactionSaveOverride: onSaveOverride }); setModalOpen('isAddTransactionModalOpen', true); },
        handleOpenEditTransactionModal: (transaction: Transaction, onSaveOverride?: (data: any) => void) => { setModalData({ transactionToEdit: transaction, modalDefaultTeamId: transaction.teamId, transactionSaveOverride: onSaveOverride }); setModalOpen('isAddTransactionModalOpen', true); },
        handleSaveTransaction, handleDeleteTransaction, handleTransfer, handleDrawCosmicCard, handleCosmicEventResolution,
        handleSaveStock, handleDeleteStock, handleLogDividend, handleAddAccount, handleUpdateAccount,
        handleAddAssetLiability, handleUpdateAssetLiability, handleSaveBudget, handleSaveGoal, handleDeleteGoal, handleContributeToGoal,
        handleImportFromAI, handleAddCategory, handleAddCategoryWithCallback, handleImportData,
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
        handleOpenAddAccountModal: (contextTeamId?: string, onSuccess?: (newAccount: Account) => void, onSaveOverride?: (data: any) => void) => { setModalData({ modalDefaultTeamId: contextTeamId, addAccountSuccessCallback: onSuccess, accountSaveOverride: onSaveOverride }); setModalOpen('isAddAccountModalOpen', true); },
        handleOpenAddCategoryModal: (onSuccess?: (newCategory: string) => void) => { setModalData(prev => ({ ...prev, addCategorySuccessCallback: onSuccess })); setModalOpen('isAddCategoryModalOpen', true); },
        handleOpenCreateTeamModal: (onSaveOverride?: (data: any) => void) => { setModalData({ teamSaveOverride: onSaveOverride, teamToEdit: null }); setModalOpen('isCreateTeamModalOpen', true) },
        handleOpenAddGoalModal: () => setModalOpen('isAddGoalModalOpen', true),
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
