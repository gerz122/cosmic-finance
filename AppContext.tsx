import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './services/firebase';
import * as dbService from './services/dbService';
import type { View, User, Team, Transaction, CosmicEvent, EventOutcome, Asset, Account, Liability, HistoricalDataPoint, Budget, Goal } from './types';
import { generateHistoricalData } from './utils/financialCalculations';
import { getCosmicEvent } from './services/geminiService';
import { AssetType } from './types';
// Fix: Import the Auth component to be used in the render logic.
import Auth from './Auth';

interface AppContextType {
    // State
    activeView: View;
    users: User[];
    teams: Team[];
    activeUser: User | null;
    selectedTeam: Team | null;
    isLoading: boolean;
    error: string | null;
    modalStates: Record<string, boolean>;
    modalData: Record<string, any>;
    
    // Derived State
    effectiveFinancialStatement: any;
    historicalData: HistoricalDataPoint[];
    allUserAccounts: Account[];

    // Setters & Actions
    setActiveView: (view: View) => void;
    handleLogout: () => void;
    setSelectedTeamId: (id: string | null) => void;
    setModalOpen: (modal: string, isOpen: boolean) => void;
    
    // App Logic (Actions) - a subset for demonstration
    handleSaveTransaction: (transaction: Omit<Transaction, 'id'> | Transaction) => Promise<void>;
    handleDeleteTransaction: (transaction: Transaction) => Promise<void>;
    handleDrawCosmicCard: () => Promise<void>;
    handleCosmicEventResolution: (outcome: EventOutcome) => Promise<void>;
    
    // Combined objects for easier passing
    actions: Record<string, (...args: any[]) => any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [authReady, setAuthReady] = useState(false);
    
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeUser, setActiveUser] = useState<User | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal States
    const [modalStates, setModalStates] = useState<Record<string, boolean>>({
        isAddTransactionModalOpen: false, isTransferModalOpen: false, isCosmicEventModalOpen: false,
        isAddStockModalOpen: false, isLogDividendModalOpen: false, isAddAccountModalOpen: false,
        isEditAccountModalOpen: false, isAddAssetLiabilityModalOpen: false, isTransactionDetailModalOpen: false,
        isCategoryModalOpen: false, isCreateTeamModalOpen: false, isNetWorthBreakdownModalOpen: false,
        isAddCategoryModalOpen: false, isAccountTransactionsModalOpen: false, isFabOpen: false,
        isAddBudgetModalOpen: false, isAddGoalModalOpen: false, isContributeToGoalModalOpen: false,
        isReceiptModalOpen: false, isSplitDetailModalOpen: false
    });
    
    // Data for Modals
    const [modalData, setModalData] = useState<Record<string, any>>({
        assetLiabilityToAdd: null, assetLiabilityToEdit: null, stockToEdit: null,
        stockForDividend: null, stockForLargeChart: null, isGeneratingCosmicEvent: false,
        currentCosmicEvent: null, selectedTransaction: null, transactionToEdit: null,
        selectedCategory: null, modalDefaultTeamId: undefined, accountToEdit: null,
        accountForTransactionList: null, goalToContribute: null, receiptUrlToView: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            setAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!authReady) return;

        const loadData = async () => {
            if (firebaseUser) {
                setIsLoading(true);
                setError(null);
                try {
                    const userData = await dbService.getUserData(firebaseUser.uid);
                    setActiveUser(userData);
                    
                    const fetchedTeams = await dbService.getTeamsForUser(firebaseUser.uid);
                    setTeams(fetchedTeams);
                    
                    // Fetch other users from teams for context (e.g., split details)
                    const memberIds = new Set(fetchedTeams.flatMap(t => t.memberIds));
                    memberIds.add(firebaseUser.uid);
                    const allTeamUsers = await dbService.getUsers(Array.from(memberIds));
                    setUsers(allTeamUsers);
                    
                } catch (e) {
                    console.error("Failed to load user data:", e);
                    setError("Failed to load your financial data from the cosmos.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                // User is logged out
                setIsLoading(false);
                setActiveUser(null);
                setUsers([]);
                setTeams([]);
            }
        };

        loadData();
    }, [authReady, firebaseUser]);

    const handleLogout = async () => {
        await signOut(auth);
        setActiveUser(null);
        setActiveView('dashboard');
    };

    const selectedTeam = useMemo(() => teams.find(t => t.id === selectedTeamId), [teams, selectedTeamId]);
    
    const allUserAccounts = useMemo(() => users.flatMap(u => u.accounts || []), [users]);

    const effectiveFinancialStatement = useMemo(() => {
        if (!activeUser) return { transactions: [], assets: [], liabilities: [] };
        
        const personalStatement = JSON.parse(JSON.stringify(activeUser.financialStatement));
        const userTeams = teams.filter(t => t.memberIds.includes(activeUser.id));

        for(const team of userTeams) {
            personalStatement.transactions.push(...team.financialStatement.transactions);
            team.financialStatement.assets.forEach(a => personalStatement.assets.push({ ...a }));
            team.financialStatement.liabilities.forEach(l => personalStatement.liabilities.push({ ...l }));
        }
        
        const uniqueTransactions = Array.from(new Map(personalStatement.transactions.map((t: Transaction) => [t.id, t])).values());
        personalStatement.transactions = uniqueTransactions;
        
        return personalStatement;
    }, [activeUser, teams]);

    const historicalData = useMemo((): HistoricalDataPoint[] => {
        if (!activeUser) return [];
        return generateHistoricalData(activeUser, teams);
    }, [activeUser, teams]);


    // ACTIONS
    const setModalOpen = (modal: string, isOpen: boolean) => {
        setModalStates(prev => ({ ...prev, [modal]: isOpen }));
    };

    const handleSaveTransaction = async (transaction: Omit<Transaction, 'id'> | Transaction) => {
        if (!activeUser) return;
        
        if ('id' in transaction) { // Editing existing transaction
            await dbService.updateTransaction(transaction);
        } else { // Adding new transaction
            if(transaction.teamId) {
                await dbService.addTeamTransaction(transaction);
            } else {
                await dbService.addTransaction(activeUser.id, transaction, users);
            }
        }
        // TODO: Refresh data more efficiently
        const updatedTeams = await dbService.getTeamsForUser(activeUser.id);
        setTeams(updatedTeams);
    };

    const handleDeleteTransaction = async (transaction: Transaction) => {
        if (!window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) return;
        await dbService.deleteTransaction(transaction);
        // TODO: Refresh data
        if(activeUser) setTeams(await dbService.getTeamsForUser(activeUser.id));
    };
    
    const handleDrawCosmicCard = async () => {
        if (!activeUser) return;
        setModalData(p => ({ ...p, isGeneratingCosmicEvent: true, currentCosmicEvent: null }));
        setModalOpen('isCosmicEventModalOpen', true);
        const event = await getCosmicEvent(activeUser.financialStatement, activeUser.accounts);
        setModalData(p => ({ ...p, currentCosmicEvent: event, isGeneratingCosmicEvent: false }));
    };

    const handleCosmicEventResolution = async (outcome: EventOutcome) => {
        console.log("Applying outcome", outcome);
        // This part needs full implementation with dbService
    };
    
    // This is just a fraction of all the handlers. We can add more here as needed.
    const actions = {
        setSelectedTeamId,
        setModalOpen,
        handleSaveTransaction, handleDeleteTransaction, handleDrawCosmicCard, handleCosmicEventResolution,
        // ... many other handlers would go here ...
    };

    // Fix: Add all required functions to the context value object to match the AppContextType interface.
    const value: AppContextType = {
        activeView, users, teams, activeUser, selectedTeam, isLoading, error,
        modalStates, modalData, effectiveFinancialStatement, historicalData, allUserAccounts,
        setActiveView, handleLogout,
        setSelectedTeamId,
        setModalOpen,
        handleSaveTransaction,
        handleDeleteTransaction,
        handleDrawCosmicCard,
        handleCosmicEventResolution,
        actions: actions as any // Cast to any to avoid listing all actions
    };

    if (!authReady) {
         return <div className="flex items-center justify-center h-screen bg-cosmic-bg text-lg animate-pulse-fast">Initializing Authentication...</div>;
    }

    return (
        <AppContext.Provider value={value}>
            {/* Fix: Use the imported Auth component. */}
            {firebaseUser ? children : <Auth />}
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