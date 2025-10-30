import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
// FIX: Update firebase imports to align with v8 syntax changes
import { auth } from './services/firebase';
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
    modalStates: Record<string, boolean>;
    modalData: Record<string, any>;
    effectiveFinancialStatement: any;
    historicalData: HistoricalDataPoint[];
    allUserAccounts: Account[];
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
    
    const [modalStates, setModalStates] = useState<Record<string, boolean>>({ isFreedomModalOpen: false, isTeamReportModalOpen: false, isFabOpen: false });
    const [modalData, setModalData] = useState<Record<string, any>>({});

    const refreshData = useCallback(async (uid: string) => {
        setIsLoading(true);
        try {
            const userData = await dbService.getOrCreateUser({ uid } as FirebaseUser); // A bit of a hack for refresh
            setActiveUser(userData);
            const fetchedTeams = await dbService.getTeamsForUser(uid);
            setTeams(fetchedTeams);
            const memberIds = new Set(fetchedTeams.flatMap(t => t.memberIds));
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

                    const memberIds = new Set(fetchedTeams.flatMap(t => t.memberIds));
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

    const selectedTeam = useMemo(() => teams.find(t => t.id === selectedTeamId), [teams, selectedTeamId]);
    const allUserAccounts = useMemo(() => users.flatMap(u => u.accounts || []), [users]);

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

        const userTeams = teams.filter(t => t.memberIds.includes(activeUser.id));
        
        const allTransactions = [...personalStatement.transactions];
        const allAssets = [...personalStatement.assets];
        const allLiabilities = [...personalStatement.liabilities];

        for(const team of userTeams) {
            allTransactions.push(...team.financialStatement.transactions);
            allAssets.push(...team.financialStatement.assets);
            allLiabilities.push(...team.financialStatement.liabilities);
        }
        
        return {
            transactions: Array.from(new Map(allTransactions.map((t: Transaction) => [t.id, t])).values()),
            assets: Array.from(new Map(allAssets.map((a: Asset) => [a.id, a])).values()),
            liabilities: Array.from(new Map(allLiabilities.map((l: Liability) => [l.id, l])).values())
        };
    }, [activeUser, teams]);

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
                    alert(`User with email ${email} not found. They need to register first.`);
                }
            }
            const newTeam = await dbService.createTeam(name, [...new Set(memberIds)]);
            for (const memberId of newTeam.memberIds) {
                if (memberId !== activeUser.id) {
                    await dbService.addMemberToTeam(newTeam.id, memberId);
                }
            }
            await refreshData(activeUser.id);
        } catch (e) {
            console.error(e);
            alert("Failed to create team.");
        }
    };
    
    const handleCompleteOnboarding = async () => {
        if (!activeUser) return;
        await dbService.updateUserField(activeUser.id, 'onboardingCompleted', true);
        await refreshData(activeUser.id);
    };

    const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id'> | Transaction) => {
        if (!activeUser) return;
        const isEditing = 'id' in transactionData;
        try {
            if (isEditing) {
                await dbService.updateTransaction(transactionData as Transaction);
            } else {
                if (transactionData.teamId) {
                    await dbService.addTeamTransaction(transactionData);
                } else {
                    // This is a personal transaction
                    await dbService.addPersonalTransaction(activeUser.id, transactionData);
                }
            }
            await refreshData(activeUser.id);
            if (!isEditing) {
                const unlocked = await dbService.checkAndUnlockAchievement(activeUser.id, 'FIRST_TRANSACTION');
                if (unlocked) setActiveUser(unlocked); // Optimistic update
            }
        } catch(e) { console.error(e); alert(`Failed to save transaction: ${(e as Error).message}`); }
    };
    
    const handleDeleteTransaction = async (transactionId: string) => {
        if (!activeUser) return;
        const tx = effectiveFinancialStatement.transactions.find((t: Transaction) => t.id === transactionId);
        if (tx && window.confirm(`Are you sure you want to delete "${tx.description}"?`)) {
            try {
                await dbService.deleteTransaction(tx);
                await refreshData(activeUser.id);
            } catch(e) { console.error(e); alert('Failed to delete transaction.'); }
        }
    };
    
    const handleTransfer = async (fromAccountId: string, toAccountId: string, amount: number) => {
        if (!activeUser) return;
        try {
            await dbService.performTransfer(activeUser.id, fromAccountId, toAccountId, amount);
            await refreshData(activeUser.id);
        } catch(e) { console.error(e); alert((e as Error).message); }
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
        } catch(e) { console.error(e); alert('Failed to apply event outcome.'); }
    };
    
    const handleAddAccount = async (account: Omit<Account, 'id' | 'ownerIds'>) => {
        if (!activeUser) return;
        try {
            await dbService.addAccount(activeUser.id, account);
            await refreshData(activeUser.id);
        } catch(e) { console.error(e); alert('Failed to add account.'); }
    };

    const handleUpdateAccount = async (account: Account) => {
        try {
            await dbService.updateAccount(activeUser!.id, account);
             if (activeUser) await refreshData(activeUser.id);
        } catch (e) { console.error(e); alert("Failed to update account."); }
    };

    const handleSaveBudget = async (budget: Budget) => {
        if (!activeUser) return;
        try {
            const updatedUser = await dbService.saveBudget(activeUser.id, budget);
            setActiveUser(updatedUser);
        } catch (e) { console.error(e); alert("Failed to save budget."); }
    };
    
    const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
        if (!activeUser) return;
        try {
            const updatedUser = await dbService.addGoal(activeUser.id, goalData);
            setActiveUser(updatedUser);
        } catch (e) { console.error(e); alert("Failed to save goal."); }
    };
    
    const handleDeleteGoal = async (goalId: string) => {
        if (!activeUser) return;
        try {
            const updatedUser = await dbService.deleteGoal(activeUser.id, goalId);
            setActiveUser(updatedUser);
        } catch (e) { console.error(e); alert("Failed to delete goal."); }
    };
    
    const handleContributeToGoal = async (goal: Goal, amount: number, fromAccountId: string) => {
        if (!activeUser) return;
        try {
            const fromAccount = activeUser.accounts.find(a => a.id === fromAccountId);
            if (!fromAccount || fromAccount.balance < amount) throw new Error("Insufficient funds");
            
            // This logic should be a single transaction in a real backend
            fromAccount.balance -= amount;
            const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amount };
            const updatedUser = await dbService.updateGoal(activeUser.id, updatedGoal);
            await dbService.updateAccount(activeUser.id, fromAccount);
            
            setActiveUser(updatedUser);
            await refreshData(activeUser.id);
        } catch(e) { console.error(e); alert((e as Error).message); }
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
            await refreshData(activeUser.id);
            if (!isEditing) {
                const unlocked = await dbService.checkAndUnlockAchievement(activeUser.id, 'FIRST_INVESTMENT');
                if (unlocked) setActiveUser(unlocked); // Optimistic update
            }
        } catch (e) { console.error(e); alert("Failed to save stock."); }
    };

    const handleLogDividend = async (amount: number, accountId: string) => {
        if (!activeUser || !modalData.stockForDividend) return;
        try {
            await dbService.logDividend(activeUser.id, modalData.stockForDividend, amount, accountId);
            await refreshData(activeUser.id);
        } catch (e) { console.error(e); alert((e as Error).message); }
    };

    const handleDeleteStock = async (stockId: string) => {
        if (!activeUser) return;
        if (window.confirm("Are you sure you want to sell this stock? This will remove it from your portfolio.")) {
            try {
                await dbService.deleteAsset(activeUser.id, stockId);
                await refreshData(activeUser.id);
            } catch (e) { console.error(e); alert("Failed to delete stock."); }
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
        } catch (e) { console.error(e); alert("Failed to add item."); }
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
        } catch (e) { console.error(e); alert("Failed to update item."); }
    };
    
    const handleAddCategory = (category: string) => {
        // This is a client-side only operation for now.
        // In a real app, you might save this to user preferences in the DB.
        alert(`Category "${category}" added to selection lists! (demo)`);
    };

    const handleImportTransactions = (transactions: any[]) => {
        // This is a client-side only operation for now.
        // It would batch-add these to the database.
        alert(`Simulating import of ${transactions.length} transactions.`);
        console.log("Transactions to import:", transactions);
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
    };

    return (
        <AppContext.Provider value={{
            activeView, users, teams, activeUser, selectedTeam, isLoading, error,
            modalStates, modalData, effectiveFinancialStatement, historicalData, allUserAccounts,
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
