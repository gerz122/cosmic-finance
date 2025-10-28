
import React, { useState, useEffect, useMemo } from 'react';
import type { View, User, Team, Transaction, CosmicEvent, EventOutcome, Asset, Account, Liability, HistoricalDataPoint, Budget, Goal } from './types';
import { AssetType, TransactionType } from './types';
import { dbService } from './services/dbService'; 
import { getCosmicEvent } from './services/geminiService';
import { DashboardIcon, StatementIcon, PortfolioIcon, TeamsIcon, CoachIcon, StarIcon, CreditCardIcon, BudgetIcon, GoalIcon } from './components/icons';
import { Dashboard } from './components/Dashboard';
import { FinancialStatement as FinancialStatementComponent } from './components/FinancialStatement';
import { AICoach } from './components/AICoach';
import { Portfolio } from './components/Portfolio';
import { Teams } from './components/Teams';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransferModal } from './components/TransferModal';
import { CosmicEventModal } from './components/CosmicEventModal';
import { AddStockModal } from './components/AddStockModal';
import { LogDividendModal } from './components/LogDividendModal';
import { LargeChartModal } from './components/LargeChartModal';
import { AccountsView } from './components/AccountsView';
import { AddAccountModal } from './components/AddAccountModal';
import { AddAssetLiabilityModal } from './components/AddAssetLiabilityModal';
import { FloatingActionButton } from './components/FloatingActionButton';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { CategoryTransactionListModal } from './components/CategoryTransactionListModal';
import { CreateTeamModal } from './components/CreateTeamModal';
import { NetWorthBreakdownModal } from './components/NetWorthBreakdownModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import { TeamDashboard } from './components/TeamDashboard';
import { Balances } from './components/Balances';
import { AccountTransactionsModal } from './components/AccountTransactionsModal';
import { BudgetView } from './components/BudgetView';
import { AddBudgetModal } from './components/AddBudgetModal';
import { GoalsView } from './components/GoalsView';
import { AddGoalModal } from './components/AddGoalModal';
import { ContributeToGoalModal } from './components/ContributeToGoalModal';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; isSub?: boolean }> = ({ icon, label, isActive, onClick, isSub }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive ? 'bg-cosmic-primary text-white shadow-lg' : 'text-cosmic-text-secondary hover:bg-cosmic-surface hover:text-cosmic-text-primary'
        } ${isSub ? 'py-2 text-sm' : ''}`}
    >
        {icon}
        <span className={`ml-4 font-semibold ${isSub ? 'font-normal' : ''}`}>{label}</span>
    </button>
);

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal States
    const [isAddTransactionModalOpen, setAddTransactionModalOpen] = useState(false);
    const [isTransferModalOpen, setTransferModalOpen] = useState(false);
    const [isCosmicEventModalOpen, setCosmicEventModalOpen] = useState(false);
    const [isAddStockModalOpen, setAddStockModalOpen] = useState(false);
    const [isLogDividendModalOpen, setLogDividendModalOpen] = useState(false);
    const [isAddAccountModalOpen, setAddAccountModalOpen] = useState(false);
    const [isAddAssetLiabilityModalOpen, setAddAssetLiabilityModalOpen] = useState(false);
    const [isTransactionDetailModalOpen, setTransactionDetailModalOpen] = useState(false);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setCreateTeamModalOpen] = useState(false);
    const [isNetWorthBreakdownModalOpen, setNetWorthBreakdownModalOpen] = useState(false);
    const [isAddCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
    const [isAccountTransactionsModalOpen, setAccountTransactionsModalOpen] = useState(false);
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [isAddBudgetModalOpen, setAddBudgetModalOpen] = useState(false);
    const [isAddGoalModalOpen, setAddGoalModalOpen] = useState(false);
    const [isContributeToGoalModalOpen, setContributeToGoalModalOpen] = useState(false);
    
    // Data for Modals
    const [assetLiabilityToAdd, setAssetLiabilityToAdd] = useState<'asset' | 'liability' | null>(null);
    const [assetLiabilityToEdit, setAssetLiabilityToEdit] = useState<Asset | Liability | null>(null);
    const [stockToEdit, setStockToEdit] = useState<Asset | null>(null);
    const [stockForDividend, setStockForDividend] = useState<Asset | null>(null);
    const [stockForLargeChart, setStockForLargeChart] = useState<Asset | null>(null);
    const [isGeneratingCosmicEvent, setIsGeneratingCosmicEvent] = useState(false);
    const [currentCosmicEvent, setCurrentCosmicEvent] = useState<CosmicEvent | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [modalDefaultTeamId, setModalDefaultTeamId] = useState<string | undefined>(undefined);
    const [accountForTransactionList, setAccountForTransactionList] = useState<Account | null>(null);
    const [goalToContribute, setGoalToContribute] = useState<Goal | null>(null);


    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedUsers = await dbService.getUsers();
                setUsers(fetchedUsers);
                
                if (fetchedUsers.length > 0) {
                    const currentActiveId = fetchedUsers[0].id;
                    setActiveUserId(currentActiveId);
                    const fetchedTeams = await dbService.getTeamsForUser(currentActiveId);
                    setTeams(fetchedTeams);
                }
            } catch (e) {
                console.error("Failed to load data:", e);
                setError("Failed to connect to the cosmos (database). Please check your Firebase setup and security rules. The app won't work until this is resolved.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const activeUser = useMemo(() => users.find(u => u.id === activeUserId), [users, activeUserId]);
    const selectedTeam = useMemo(() => teams.find(t => t.id === selectedTeamId), [teams, selectedTeamId]);
    
    const effectiveFinancialStatement = useMemo(() => {
        if (!activeUser) return { transactions: [], assets: [], liabilities: [] };
        
        const personalStatement = JSON.parse(JSON.stringify(activeUser.financialStatement));
        const userTeams = teams.filter(t => t.memberIds.includes(activeUser.id));

        for(const team of userTeams) {
            personalStatement.transactions.push(...team.financialStatement.transactions);
            const userShare = 1 / team.memberIds.length;
            team.financialStatement.assets.forEach(a => personalStatement.assets.push({ ...a, value: a.value * userShare, shares: [{userId: activeUser.id, percentage: userShare * 100}] }));
            team.financialStatement.liabilities.forEach(l => personalStatement.liabilities.push({ ...l, balance: l.balance * userShare, shares: [{userId: activeUser.id, percentage: userShare * 100}] }));
        }
        
        const uniqueTransactions = Array.from(new Map(personalStatement.transactions.map((t: Transaction) => [t.id, t])).values());
        personalStatement.transactions = uniqueTransactions;
        
        return personalStatement;
    }, [activeUser, teams]);

    const historicalNetWorth = useMemo((): HistoricalDataPoint[] => {
        if (!activeUser) return [];
        const allTransactions = [...effectiveFinancialStatement.transactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (allTransactions.length === 0) return [];

        const dataPoints: HistoricalDataPoint[] = [];
        let runningNetWorth = 0; 
        allTransactions.forEach(tx => {
            if(tx.type === 'INCOME') runningNetWorth += tx.amount;
            else runningNetWorth -= tx.amount;
            dataPoints.push({date: tx.date, value: runningNetWorth});
        });
        
        return dataPoints;
    }, [effectiveFinancialStatement.transactions, activeUser]);

    const updateUserState = (updatedUser: User) => setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    const updateMultipleUsersState = (updatedUsers: User[]) => {
        const updatedUsersMap = new Map(updatedUsers.map(u => [u.id, u]));
        setUsers(currentUsers => currentUsers.map(u => updatedUsersMap.get(u.id) || u));
    };
    const updateTeamState = (updatedTeam: Team) => setTeams(currentTeams => currentTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    const updateMultipleTeamsState = (updatedTeams: Team[]) => {
        const updatedTeamsMap = new Map(updatedTeams.map(t => [t.id, t]));
        setTeams(currentTeams => currentTeams.map(t => updatedTeamsMap.get(t.id) || t));
    };

    const handleSaveTransaction = async (transaction: Omit<Transaction, 'id'> | Transaction) => {
        if (!activeUser) return;
        
        if ('id' in transaction) { // Editing existing transaction
            const { updatedUsers, updatedTeams } = await dbService.updateTransaction(transaction, users, teams);
            updateMultipleUsersState(updatedUsers);
            updateMultipleTeamsState(updatedTeams);
        } else { // Adding new transaction
            if(transaction.teamId) {
                const updatedTeam = await dbService.addTeamTransaction(transaction);
                updateTeamState(updatedTeam);
            } else {
                const updatedUsers = await dbService.addTransaction(activeUser.id, transaction, users);
                updateMultipleUsersState(updatedUsers);
            }
        }
    };
    
    const handleDeleteTransaction = async (transactionId: string) => {
        if (!window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) return;
        const { updatedUsers, updatedTeams } = await dbService.deleteTransaction(transactionId, users, teams);
        updateMultipleUsersState(updatedUsers);
        updateMultipleTeamsState(updatedTeams);
    };

    const handleTransfer = async (fromAccountId: string, toAccountId: string, amount: number) => {
        if (!activeUserId) return;
        try {
             const updatedUser = await dbService.performTransfer(activeUserId, fromAccountId, toAccountId, amount);
            updateUserState(updatedUser);
        } catch (error) {
            alert((error as Error).message);
        }
    };
    
    const handleDrawCosmicCard = async () => {
        if (!activeUser) return;
        setIsGeneratingCosmicEvent(true);
        setCosmicEventModalOpen(true);
        setCurrentCosmicEvent(null);
        
        const event = await getCosmicEvent(activeUser.financialStatement, activeUser.accounts);
        setCurrentCosmicEvent(event);
        setIsGeneratingCosmicEvent(false);
    };

    const handleCosmicEventResolution = async (outcome: EventOutcome) => {
        if (!activeUser) return;
        try {
            const updatedUser = await dbService.applyEventOutcome(activeUser, outcome);
            updateUserState(updatedUser);
        } catch (error) {
            alert((error as Error).message);
        }
    };

    const handleAddAssetLiability = async (data: Partial<Asset | Liability>, teamId?: string) => {
        if(!activeUser || !assetLiabilityToAdd) return;
        try {
            if(teamId) {
                const updatedTeam = assetLiabilityToAdd === 'asset'
                    ? await dbService.addTeamAsset(teamId, data as Partial<Asset>)
                    : await dbService.addTeamLiability(teamId, data as Partial<Liability>);
                updateTeamState(updatedTeam);
            } else {
                 const updatedUser = assetLiabilityToAdd === 'asset'
                    ? await dbService.addAsset(activeUser.id, data as Partial<Asset>)
                    : await dbService.addLiability(activeUser.id, data as Partial<Liability>);
                updateUserState(updatedUser);
            }
        } catch(e) {
            alert((e as Error).message);
        }
    };

    const handleUpdateAssetLiability = async (data: Partial<Asset | Liability>) => {
        if (!activeUser || !assetLiabilityToEdit) return;
        try {
            if (assetLiabilityToEdit.teamId) {
                const isAsset = 'value' in assetLiabilityToEdit;
                const updatedTeam = isAsset
                    ? await dbService.updateTeamAsset(assetLiabilityToEdit.teamId, assetLiabilityToEdit.id, data)
                    : await dbService.updateTeamLiability(assetLiabilityToEdit.teamId, assetLiabilityToEdit.id, data);
                updateTeamState(updatedTeam);
            } else {
                const isAsset = 'value' in assetLiabilityToEdit;
                const updatedUser = isAsset
                    ? await dbService.updateAsset(activeUser.id, assetLiabilityToEdit.id, data)
                    : await dbService.updateLiability(activeUser.id, assetLiabilityToEdit.id, data);
                updateUserState(updatedUser);
            }
        } catch (e) {
            alert((e as Error).message);
        }
    };

    const handleSaveStock = async (stockData: Partial<Asset>, teamId?: string) => {
        if (!activeUser) return;
        try {
            if(teamId) {
                const updatedTeam = await dbService.addTeamAsset(teamId, {...stockData, type: AssetType.STOCK});
                updateTeamState(updatedTeam);
            } else {
                let updatedUser;
                if (stockToEdit) { 
                    updatedUser = await dbService.updateAsset(activeUser.id, stockToEdit.id, stockData);
                } else { 
                    updatedUser = await dbService.addAsset(activeUser.id, {...stockData, type: AssetType.STOCK} as any);
                }
                updateUserState(updatedUser);
            }
        } catch(e) {
            alert((e as Error).message);
        }
    };
    
    const handleDeleteStock = async (stockId: string) => {
        if (!activeUser || !window.confirm("Are you sure you want to sell this stock? This action cannot be undone.")) return;
        try {
            const updatedUser = await dbService.deleteAsset(activeUser.id, stockId);
            updateUserState(updatedUser);
        } catch (e) {
            alert((e as Error).message);
        }
    };

    const handleLogDividend = async (amount: number, accountId: string) => {
        if (!activeUser || !stockForDividend) return;
        try {
            const updatedUser = await dbService.logDividend(activeUser, stockForDividend.id, amount, accountId);
            updateUserState(updatedUser);
        } catch (e) {
            alert((e as Error).message);
        }
    };

    const handleAddAccount = async (accountData: Omit<Account, 'id' | 'balance' | 'ownerIds'> & {balance: number}) => {
        if (!activeUser) return;
        try {
            const updatedUser = await dbService.addAccount(activeUser.id, accountData);
            updateUserState(updatedUser);
        } catch (e) {
            alert((e as Error).message);
        }
        setAddAccountModalOpen(false);
        setAddTransactionModalOpen(true); 
    };

    const handleAddCategory = (newCategory: string) => {
        console.log("New category added:", newCategory);
        setAddCategoryModalOpen(false);
        setAddTransactionModalOpen(true);
    };
    
    const handleCreateTeam = async(name: string, memberIds: string[]) => {
        if(!activeUser) return;
        const newTeam = await dbService.createTeam(name, [...memberIds, activeUser.id]);
        setTeams(current => [...current, newTeam]);
    };

    const handleSaveBudget = async (budget: Budget) => {
        if (!activeUser) return;
        const updatedUser = await dbService.saveBudget(activeUser.id, budget);
        updateUserState(updatedUser);
    };

    const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'currentAmount'>) => {
        if (!activeUser) return;
        const updatedUser = await dbService.addGoal(activeUser.id, goalData);
        updateUserState(updatedUser);
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (!activeUser || !window.confirm("Are you sure you want to delete this goal?")) return;
        const updatedUser = await dbService.deleteGoal(activeUser.id, goalId);
        updateUserState(updatedUser);
    };

    const handleContributeToGoal = async (goal: Goal, amount: number, fromAccountId: string) => {
        if (!activeUser) return;

        const contributionTransaction: Omit<Transaction, 'id'> = {
            description: `Contribution to goal: ${goal.name}`,
            amount: amount,
            type: TransactionType.EXPENSE,
            category: 'Goals',
            date: new Date().toISOString().split('T')[0],
            paymentShares: [{ userId: activeUser.id, accountId: fromAccountId, amount: amount }],
            expenseShares: [{ userId: activeUser.id, amount: amount }],
        };
        await handleSaveTransaction(contributionTransaction);

        const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amount };
        const updatedUser = await dbService.updateGoal(activeUser.id, updatedGoal);
        updateUserState(updatedUser);
    };

    const handleTeamClick = (teamId: string) => { setSelectedTeamId(teamId); setActiveView('team-detail'); };
    const handleBackToTeams = () => { setSelectedTeamId(null); setActiveView('teams'); };
    const handleCategoryClick = (category: string) => { setSelectedCategory(category); setCategoryModalOpen(true); };
    const handleTransactionClick = (transaction: Transaction) => { setSelectedTransaction(transaction); setTransactionDetailModalOpen(true); };
    
    const handleStatCardClick = (stat: 'netWorth' | 'cashflow' | 'passiveIncome') => {
        if (stat === 'netWorth') setNetWorthBreakdownModalOpen(true);
        if (stat === 'cashflow') setActiveView('statement');
        if (stat === 'passiveIncome') { setSelectedCategory('Passive Income'); setCategoryModalOpen(true); }
    };
    
    const handleOpenAccountTransactionsModal = (account: Account) => { setAccountForTransactionList(account); setAccountTransactionsModalOpen(true); };
    const openLargeChartModal = (stock: Asset) => setStockForLargeChart(stock);
    const closeLargeChartModal = () => setStockForLargeChart(null);
    const handleOpenLogDividendModal = (stock: Asset) => { setStockForDividend(stock); setLogDividendModalOpen(true); };
    
    const handleOpenAddTransactionModal = (teamId?: string) => { setTransactionToEdit(null); setModalDefaultTeamId(teamId); setAddTransactionModalOpen(true); };
    const handleOpenEditTransactionModal = (transaction: Transaction) => { setTransactionToEdit(transaction); setAddTransactionModalOpen(true); };
    
    const handleOpenAddAssetLiabilityModal = (type: 'asset' | 'liability', teamId?: string) => { setAssetLiabilityToEdit(null); setModalDefaultTeamId(teamId); setAssetLiabilityToAdd(type); setAddAssetLiabilityModalOpen(true); };
    const handleOpenEditAssetLiabilityModal = (item: Asset | Liability) => { setAssetLiabilityToEdit(item); setAssetLiabilityToAdd('value' in item ? 'asset' : 'liability'); setAddAssetLiabilityModalOpen(true); };
    const handleOpenAddStockModal = (teamId?: string) => { setStockToEdit(null); setModalDefaultTeamId(teamId); setAddStockModalOpen(true); };
    const handleOpenEditStockModal = (stock: Asset) => { setStockToEdit(stock); setAddStockModalOpen(true); };
    const handleOpenContributeToGoalModal = (goal: Goal) => { setGoalToContribute(goal); setContributeToGoalModalOpen(true); };

    const fabActions = {
        onAddTransaction: () => { setIsFabOpen(false); handleOpenAddTransactionModal(selectedTeamId || undefined); },
        onAddAccount: () => { setIsFabOpen(false); setAddAccountModalOpen(true); },
        onCreateTeam: () => { setIsFabOpen(false); setCreateTeamModalOpen(true); },
        onAddStock: () => { setIsFabOpen(false); handleOpenAddStockModal(selectedTeamId || undefined); },
        onTransfer: () => { setIsFabOpen(false); setTransferModalOpen(true); }
    };

    const renderView = () => {
        if (isLoading) return <div className="flex items-center justify-center h-full"><p className="text-lg animate-pulse-fast">Connecting to the Cosmos...</p></div>;
        if (error) return <div className="p-8 bg-cosmic-surface border border-cosmic-danger rounded-lg text-center"><p className="font-bold text-cosmic-danger">Connection Error</p><p>{error}</p></div>;
        if (!activeUser) return <div className="flex items-center justify-center h-full"><p>No Players Found</p></div>;

        switch (activeView) {
            case 'dashboard': return <Dashboard user={activeUser} effectiveStatement={effectiveFinancialStatement} historicalNetWorth={historicalNetWorth} onAddTransactionClick={() => handleOpenAddTransactionModal()} onTransferClick={() => setTransferModalOpen(true)} onDrawCosmicCard={handleDrawCosmicCard} onCategoryClick={handleCategoryClick} onTransactionClick={handleTransactionClick} onStatCardClick={handleStatCardClick}/>;
            case 'statement': return <FinancialStatementComponent statement={effectiveFinancialStatement} user={activeUser} teamMates={users.filter(u => u.id !== activeUser.id)} onEditTransaction={handleOpenEditTransactionModal} onDeleteTransaction={handleDeleteTransaction}/>;
            case 'accounts': return <AccountsView accounts={activeUser.accounts} onAddAccount={() => setAddAccountModalOpen(true)} onOpenAccountTransactions={handleOpenAccountTransactionsModal}/>;
            case 'coach': return <AICoach user={activeUser} />;
            case 'portfolio': return <Portfolio user={activeUser} onAddStock={() => handleOpenAddStockModal()} onAddAsset={() => handleOpenAddAssetLiabilityModal('asset')} onAddLiability={() => handleOpenAddAssetLiabilityModal('liability')} onEditStock={handleOpenEditStockModal} onDeleteStock={handleDeleteStock} onLogDividend={handleOpenLogDividendModal} onOpenLargeChart={openLargeChartModal} teams={teams} onEditAsset={handleOpenEditAssetLiabilityModal} onEditLiability={handleOpenEditAssetLiabilityModal} />;
            case 'teams': return <Teams teams={teams} onCreateTeam={() => setCreateTeamModalOpen(true)} onTeamClick={handleTeamClick}/>;
            case 'team-detail': return selectedTeam ? <TeamDashboard team={selectedTeam} allUsers={users} onBack={handleBackToTeams} onAddTransaction={() => handleOpenAddTransactionModal(selectedTeam.id)} onAddAsset={() => handleOpenAddAssetLiabilityModal('asset', selectedTeam.id)} onAddLiability={() => handleOpenAddAssetLiabilityModal('liability', selectedTeam.id)} onAddStock={() => handleOpenAddStockModal(selectedTeam.id)} onEditAsset={handleOpenEditAssetLiabilityModal} onEditLiability={handleOpenEditAssetLiabilityModal} onEditTransaction={handleOpenEditTransactionModal} onDeleteTransaction={handleDeleteTransaction} /> : null;
            case 'balances': return <Balances currentUser={activeUser} allUsers={users} teams={teams} onSettleUp={() => setTransferModalOpen(true)} />;
            case 'budget': return <BudgetView user={activeUser} onSaveBudget={handleSaveBudget} onOpenBudgetModal={() => setAddBudgetModalOpen(true)} />;
            case 'goals': return <GoalsView user={activeUser} onAddGoal={() => setAddGoalModalOpen(true)} onDeleteGoal={handleDeleteGoal} onContribute={handleOpenContributeToGoalModal} />;
            default: return <Dashboard user={activeUser} effectiveStatement={effectiveFinancialStatement} historicalNetWorth={historicalNetWorth} onAddTransactionClick={() => handleOpenAddTransactionModal()} onTransferClick={() => setTransferModalOpen(true)} onDrawCosmicCard={handleDrawCosmicCard} onCategoryClick={handleCategoryClick} onTransactionClick={handleTransactionClick} onStatCardClick={handleStatCardClick}/>;
        }
    };
    
    return (
        <div className="flex h-screen bg-cosmic-bg text-cosmic-text-primary font-sans">
            <nav className="w-64 bg-cosmic-surface border-r border-cosmic-border p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <StarIcon className="w-8 h-8 text-yellow-400" />
                    <h1 className="text-xl font-bold text-cosmic-text-primary">Cosmic<span className="text-cosmic-primary">Cashflow</span></h1>
                </div>
                <div className="space-y-2">
                    <NavItem icon={<DashboardIcon className="w-6 h-6" />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setSelectedTeamId(null);}} />
                    <NavItem icon={<StatementIcon className="w-6 h-6" />} label="Balances" isActive={activeView === 'balances'} onClick={() => { setActiveView('balances'); setSelectedTeamId(null);}} />
                    <NavItem icon={<StatementIcon className="w-6 h-6" />} label="Statement" isActive={activeView === 'statement'} onClick={() => { setActiveView('statement'); setSelectedTeamId(null);}} />
                    <NavItem icon={<CreditCardIcon className="w-6 h-6" />} label="Accounts" isActive={activeView === 'accounts'} onClick={() => { setActiveView('accounts'); setSelectedTeamId(null);}} />
                    <NavItem icon={<PortfolioIcon className="w-6 h-6" />} label="Portfolio" isActive={activeView === 'portfolio'} onClick={() => { setActiveView('portfolio'); setSelectedTeamId(null);}} />
                    <NavItem icon={<BudgetIcon className="w-6 h-6" />} label="Budget" isActive={activeView === 'budget'} onClick={() => { setActiveView('budget'); setSelectedTeamId(null);}} />
                    <NavItem icon={<GoalIcon className="w-6 h-6" />} label="Goals" isActive={activeView === 'goals'} onClick={() => { setActiveView('goals'); setSelectedTeamId(null);}} />
                    <NavItem icon={<TeamsIcon className="w-6 h-6" />} label="Teams" isActive={activeView === 'teams' || activeView === 'team-detail'} onClick={() => { setActiveView('teams'); setSelectedTeamId(null);}} />
                     {activeView === 'team-detail' && selectedTeam && (
                        <div className="pl-4 mt-1 border-l-2 border-cosmic-primary ml-5">
                            <NavItem icon={<div className="w-6 h-6" />} label={selectedTeam.name} isActive={true} onClick={() => {}} isSub/>
                        </div>
                     )}
                    <NavItem icon={<CoachIcon className="w-6 h-6" />} label="AI Coach" isActive={activeView === 'coach'} onClick={() => { setActiveView('coach'); setSelectedTeamId(null);}} />
                </div>
                {activeUser && <div className="mt-auto bg-cosmic-bg p-4 rounded-lg border border-cosmic-border"><div className="flex items-center gap-3"><img src={activeUser.avatar} alt={activeUser.name} className="w-12 h-12 rounded-full border-2 border-cosmic-primary" /><div><p className="font-bold text-cosmic-text-primary">{activeUser.name}</p><p className="text-sm text-cosmic-text-secondary">Level 5</p></div></div></div>}
            </nav>

            <main className="flex-1 flex flex-col p-8 overflow-y-auto relative">
                <div className="mb-6 bg-cosmic-surface p-2 rounded-lg border border-cosmic-border self-start flex items-center gap-2">
                     <label className="text-sm font-semibold text-cosmic-text-secondary mr-2">Active Player:</label>
                    {users.map(user => <button key={user.id} onClick={() => setActiveUserId(user.id)} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${activeUserId === user.id ? 'bg-cosmic-primary text-white' : 'bg-cosmic-bg text-cosmic-text-primary hover:bg-cosmic-border'}`}>{user.name}</button>)}
                </div>
                <div className="flex-grow">{renderView()}</div>
                <FloatingActionButton {...fabActions} isOpen={isFabOpen} onToggle={() => setIsFabOpen(prev => !prev)} />
            </main>
            
            {activeUser && <AddTransactionModal isOpen={isAddTransactionModalOpen} onClose={() => setAddTransactionModalOpen(false)} onSave={handleSaveTransaction} transactionToEdit={transactionToEdit} currentUser={activeUser} allUsers={users} teams={teams} onAddAccountClick={() => { setAddTransactionModalOpen(false); setAddAccountModalOpen(true); }} onAddCategoryClick={() => { setAddTransactionModalOpen(false); setAddCategoryModalOpen(true); }} defaultTeamId={modalDefaultTeamId} />}
            {activeUser && <TransferModal isOpen={isTransferModalOpen} onClose={() => setTransferModalOpen(false)} onTransfer={handleTransfer} currentUser={activeUser}/>}
            <CosmicEventModal isOpen={isCosmicEventModalOpen} isGenerating={isGeneratingCosmicEvent} event={currentCosmicEvent} onClose={() => setCosmicEventModalOpen(false)} onResolve={handleCosmicEventResolution}/>
            <AddStockModal isOpen={isAddStockModalOpen} onClose={() => setAddStockModalOpen(false)} onSave={handleSaveStock} stockToEdit={stockToEdit} accounts={activeUser?.accounts || []} teams={teams} defaultTeamId={modalDefaultTeamId} />
            {activeUser && stockForDividend && <LogDividendModal isOpen={isLogDividendModalOpen} onClose={() => { setLogDividendModalOpen(false); setStockForDividend(null); }} onLogDividend={handleLogDividend} stock={stockForDividend} accounts={activeUser.accounts}/>}
            {stockForLargeChart && <LargeChartModal stock={stockForLargeChart} onClose={closeLargeChartModal}/>}
            <AddAccountModal isOpen={isAddAccountModalOpen} onClose={() => setAddAccountModalOpen(false)} onAddAccount={handleAddAccount}/>
            {activeUser && <AddAssetLiabilityModal isOpen={isAddAssetLiabilityModalOpen} type={assetLiabilityToAdd} itemToEdit={assetLiabilityToEdit} onClose={() => { setAddAssetLiabilityModalOpen(false); setAssetLiabilityToEdit(null); }} onSave={assetLiabilityToEdit ? handleUpdateAssetLiability : handleAddAssetLiability} teams={teams} defaultTeamId={modalDefaultTeamId} />}
            {selectedTransaction && <TransactionDetailModal isOpen={isTransactionDetailModalOpen} onClose={() => { setTransactionDetailModalOpen(false); setSelectedTransaction(null); }} transaction={selectedTransaction} users={users}/>}
            {selectedCategory && <CategoryTransactionListModal isOpen={isCategoryModalOpen} onClose={() => { setCategoryModalOpen(false); setSelectedCategory(null); }} category={selectedCategory} transactions={effectiveFinancialStatement.transactions}/>}
            {activeUser && <CreateTeamModal isOpen={isCreateTeamModalOpen} onClose={() => setCreateTeamModalOpen(false)} onCreateTeam={handleCreateTeam} allUsers={users} currentUser={activeUser}/>}
            {activeUser && <NetWorthBreakdownModal isOpen={isNetWorthBreakdownModalOpen} onClose={() => setNetWorthBreakdownModalOpen(false)} user={activeUser} teams={teams} />}
            <AddCategoryModal isOpen={isAddCategoryModalOpen} onClose={() => { setAddCategoryModalOpen(false); setAddTransactionModalOpen(true); }} onAddCategory={handleAddCategory} />
            {activeUser && accountForTransactionList && <AccountTransactionsModal isOpen={isAccountTransactionsModalOpen} onClose={() => setAccountTransactionsModalOpen(false)} account={accountForTransactionList} allTransactions={effectiveFinancialStatement.transactions} onEditTransaction={handleOpenEditTransactionModal} onDeleteTransaction={handleDeleteTransaction} />}
            {activeUser && <AddBudgetModal isOpen={isAddBudgetModalOpen} onClose={() => setAddBudgetModalOpen(false)} onSave={handleSaveBudget} user={activeUser} />}
            {activeUser && <AddGoalModal isOpen={isAddGoalModalOpen} onClose={() => setAddGoalModalOpen(false)} onSave={handleSaveGoal} />}
            {activeUser && goalToContribute && <ContributeToGoalModal isOpen={isContributeToGoalModalOpen} onClose={() => setContributeToGoalModalOpen(false)} onContribute={handleContributeToGoal} goal={goalToContribute} user={activeUser} />}
        </div>
    );
};

export default App;
