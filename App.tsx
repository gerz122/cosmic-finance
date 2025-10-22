import React, { useState, useEffect, useMemo } from 'react';
import type { View, User, Team, Transaction } from './types';
import { db } from './db'; // Import our new mock DB
import { DashboardIcon, StatementIcon, PortfolioIcon, TeamsIcon, CoachIcon, StarIcon } from './components/icons';
import { Dashboard } from './components/Dashboard';
import { FinancialStatement as FinancialStatementComponent } from './components/FinancialStatement';
import { AICoach } from './components/AICoach';
import { Portfolio } from './components/Portfolio';
import { Teams } from './components/Teams';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransferModal } from './components/TransferModal';

// Mock Team Data (can be expanded later)
const mockTeam: Team = {
    id: 'team1',
    name: 'Cosmic Crusaders',
    members: [], // will be populated from users state
    financialStatement: { transactions: [], assets: [], liabilities: [] },
    goals: [
        { description: 'Reach Team Passive Income of $5,000', current: 0, target: 5000 },
        { description: 'Achieve Team Net Worth of $500,000', current: 0, target: 500000 },
    ],
};


const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive ? 'bg-cosmic-primary text-white shadow-lg' : 'text-cosmic-text-secondary hover:bg-cosmic-surface hover:text-cosmic-text-primary'
        }`}
    >
        {icon}
        <span className="ml-4 font-semibold">{label}</span>
    </button>
);

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [users, setUsers] = useState<User[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [team, setTeam] = useState<Team>(mockTeam);
    const [isAddTransactionModalOpen, setAddTransactionModalOpen] = useState(false);
    const [isTransferModalOpen, setTransferModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const fetchedUsers = await db.getUsers();
            setUsers(fetchedUsers);
            if (fetchedUsers.length > 0) {
                setActiveUserId(fetchedUsers[0].id);
            }
            setIsLoading(false);
        };
        loadData();
    }, []);

    const activeUser = useMemo(() => users.find(u => u.id === activeUserId), [users, activeUserId]);
    
     // Update team data when users change
    useEffect(() => {
        if(users.length > 0) {
            const allTransactions = users.flatMap(u => u.financialStatement.transactions);
            const allAssets = users.flatMap(u => u.financialStatement.assets);
            const allLiabilities = users.flatMap(u => u.financialStatement.liabilities);
            const totalPassiveIncome = allTransactions.filter(t => t.isPassive).reduce((sum, t) => sum + t.amount, 0);
            const totalNetWorth = allAssets.reduce((sum, a) => sum + a.value, 0) - allLiabilities.reduce((sum, l) => sum + l.balance, 0);

            setTeam(currentTeam => ({
                ...currentTeam,
                members: users,
                financialStatement: {
                    transactions: allTransactions,
                    assets: allAssets,
                    liabilities: allLiabilities
                },
                goals: [
                    { ...currentTeam.goals[0], current: totalPassiveIncome },
                    { ...currentTeam.goals[1], current: totalNetWorth },
                ]
            }));
        }
    }, [users]);

    const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        if (!activeUserId) return;
        const updatedUser = await db.addTransaction(activeUserId, transaction);
        setUsers(currentUsers => currentUsers.map(u => u.id === activeUserId ? updatedUser : u));
    };

    const handleTransfer = async (toUserId: string, amount: number) => {
        if (!activeUserId) return;
        try {
            const { fromUser, toUser } = await db.performTransfer(activeUserId, toUserId, amount);
            setUsers(currentUsers => currentUsers.map(u => {
                if (u.id === fromUser.id) return fromUser;
                if (u.id === toUser.id) return toUser;
                return u;
            }));
        } catch (error) {
            alert((error as Error).message);
        }
    };


    const renderView = () => {
        if (isLoading || !activeUser) {
            return <div className="flex items-center justify-center h-full"><p>Loading Cosmic Data...</p></div>;
        }
        switch (activeView) {
            case 'dashboard':
                return <Dashboard user={activeUser} onAddTransactionClick={() => setAddTransactionModalOpen(true)} onTransferClick={() => setTransferModalOpen(true)} />;
            case 'statement':
                return <FinancialStatementComponent statement={activeUser.financialStatement} />;
            case 'coach':
                 return <AICoach statement={activeUser.financialStatement} />;
            case 'portfolio':
                return <Portfolio statement={activeUser.financialStatement} />;
            case 'teams':
                return <Teams team={team} />;
            default:
                return <Dashboard user={activeUser} onAddTransactionClick={() => setAddTransactionModalOpen(true)} onTransferClick={() => setTransferModalOpen(true)} />;
        }
    };
    
    return (
        <div className="flex h-screen bg-cosmic-bg text-cosmic-text-primary font-sans">
            {/* Sidebar */}
            <nav className="w-64 bg-cosmic-surface border-r border-cosmic-border p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <StarIcon className="w-8 h-8 text-yellow-400" />
                    <h1 className="text-xl font-bold text-cosmic-text-primary">Cosmic<span className="text-cosmic-primary">Cashflow</span></h1>
                </div>

                <div className="space-y-2">
                    <NavItem icon={<DashboardIcon className="w-6 h-6" />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                    <NavItem icon={<StatementIcon className="w-6 h-6" />} label="Statement" isActive={activeView === 'statement'} onClick={() => setActiveView('statement')} />
                    <NavItem icon={<PortfolioIcon className="w-6 h-6" />} label="Portfolio" isActive={activeView === 'portfolio'} onClick={() => setActiveView('portfolio')} />
                    <NavItem icon={<TeamsIcon className="w-6 h-6" />} label="Teams" isActive={activeView === 'teams'} onClick={() => setActiveView('teams')} />
                    <NavItem icon={<CoachIcon className="w-6 h-6" />} label="AI Coach" isActive={activeView === 'coach'} onClick={() => setActiveView('coach')} />
                </div>
                
                {activeUser && (
                    <div className="mt-auto bg-cosmic-bg p-4 rounded-lg border border-cosmic-border">
                        <div className="flex items-center gap-3">
                            <img src={activeUser.avatar} alt={activeUser.name} className="w-12 h-12 rounded-full border-2 border-cosmic-primary" />
                            <div>
                                <p className="font-bold text-cosmic-text-primary">{activeUser.name}</p>
                                <p className="text-sm text-cosmic-text-secondary">Level 5</p>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-8 overflow-y-auto">
                 {/* User Switcher */}
                <div className="mb-6 bg-cosmic-surface p-2 rounded-lg border border-cosmic-border self-start flex items-center gap-2">
                     <label className="text-sm font-semibold text-cosmic-text-secondary mr-2">Active Player:</label>
                    {users.map(user => (
                        <button 
                            key={user.id} 
                            onClick={() => setActiveUserId(user.id)}
                            className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${activeUserId === user.id ? 'bg-cosmic-primary text-white' : 'bg-cosmic-bg text-cosmic-text-primary hover:bg-cosmic-border'}`}
                        >
                            {user.name}
                        </button>
                    ))}
                </div>
                <div className="flex-grow">
                    {renderView()}
                </div>
            </main>
            
            <AddTransactionModal 
                isOpen={isAddTransactionModalOpen} 
                onClose={() => setAddTransactionModalOpen(false)} 
                onAddTransaction={handleAddTransaction} 
            />
             {activeUser && (
                <TransferModal
                    isOpen={isTransferModalOpen}
                    onClose={() => setTransferModalOpen(false)}
                    onTransfer={handleTransfer}
                    currentUser={activeUser}
                    otherUsers={users.filter(u => u.id !== activeUserId)}
                />
            )}
        </div>
    );
};

export default App;
