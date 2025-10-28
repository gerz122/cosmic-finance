import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './services/firebase';
import * as dbService from './services/dbService';
import type { View, User, Team, Transaction, CosmicEvent, EventOutcome, Asset, Account, Liability, HistoricalDataPoint, Budget, Goal } from './types';
import { generateHistoricalData } from './utils/financialCalculations';
import { getCosmicEvent } from './services/geminiService';
import Auth from './Auth';
import Onboarding from './Onboarding';

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
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [authReady, setAuthReady] = useState(false);
    
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
        const userData = await dbService.getUserData(uid);
        setActiveUser(userData);
        const fetchedTeams = await dbService.getTeamsForUser(uid);
        setTeams(fetchedTeams);
        const memberIds = new Set(fetchedTeams.flatMap(t => t.memberIds));
        memberIds.add(uid);
        const allTeamUsers = await dbService.getUsers(Array.from(memberIds));
        setUsers(allTeamUsers);
    }, []);

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
                    await refreshData(firebaseUser.uid);
                } catch (e) {
                    setError("Failed to load your financial data.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
                setActiveUser(null);
                setUsers([]);
                setTeams([]);
            }
        };
        loadData();
    }, [authReady, firebaseUser, refreshData]);

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
        personalStatement.transactions = Array.from(new Map(personalStatement.transactions.map((t: Transaction) => [t.id, t])).values());
        return personalStatement;
    }, [activeUser, teams]);

    const historicalData = useMemo(() => activeUser ? generateHistoricalData(activeUser, teams) : [], [activeUser, teams]);
    
    // ACTIONS
    const setModalOpen = (modal: string, isOpen: boolean) => setModalStates(prev => ({ ...prev, [modal]: isOpen }));

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

    // Placeholder for many more actions...
    const actions = {
        setSelectedTeamId, setModalOpen, handleCreateTeam, handleCompleteOnboarding,
        // ... stubs for all other actions from App.tsx ...
        handleTeamClick: (teamId: string) => { setActiveView('team-detail'); setSelectedTeamId(teamId); },
        handleBackToTeams: () => { setActiveView('teams'); setSelectedTeamId(null); },
        handleOpenAddTransactionModal: (teamId?: string) => { setModalData(p => ({...p, transactionToEdit: null, modalDefaultTeamId: teamId})); setModalOpen('isAddTransactionModalOpen', true); },
    };

    if (!authReady) {
         return <div className="flex items-center justify-center h-screen bg-cosmic-bg text-lg animate-pulse-fast">Initializing Authentication...</div>;
    }

    return (
        <AppContext.Provider value={{
            activeView, users, teams, activeUser, selectedTeam, isLoading, error,
            modalStates, modalData, effectiveFinancialStatement, historicalData, allUserAccounts,
            setActiveView, handleLogout, actions
        }}>
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