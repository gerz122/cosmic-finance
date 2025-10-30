import React, { useState } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import Auth from './Auth';
import Onboarding from './Onboarding';
import type { View } from './types';
import { DashboardIcon, StatementIcon, PortfolioIcon, TeamsIcon, CoachIcon, StarIcon, CreditCardIcon, BudgetIcon, GoalIcon, HistoryIcon, TrophyIcon, UploadIcon, LogOutIcon, XIcon } from './components/icons';
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
import { EditAccountModal } from './components/EditAccountModal';
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
import { ReceiptModal } from './components/ReceiptModal';
import { HistoricalPerformance } from './components/HistoricalPerformance';
import { TransactionSplitDetailModal } from './components/TransactionSplitDetailModal';
import { Achievements } from './components/Achievements';
import { StatementImporter } from './components/StatementImporter';
import FreedomModal from './FreedomModal';
import TeamReportModal from './TeamReportModal';


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

const Notification: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-cosmic-success' : 'bg-cosmic-danger';

    return (
        <div 
            className={`fixed top-5 right-5 z-[100] max-w-sm p-4 rounded-lg border border-cosmic-border shadow-lg transition-all duration-300 animate-slide-in-up ${bgColor}`}
            role="alert"
        >
            <div className="flex items-center justify-between gap-4">
                <p className="text-white font-semibold text-sm">{message}</p>
                <button onClick={onClose} className="text-white opacity-70 hover:opacity-100 flex-shrink-0">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const context = useAppContext();
    if (!context) return null; // Should be handled by AppProvider
    
    const {
        activeView, setActiveView, users, teams, activeUser, selectedTeam,
        isLoading, error, handleLogout,
        effectiveFinancialStatement, historicalData, allUserAccounts,
        notification,
        
        // Modals State
        modalStates,
        modalData,
        
        // Actions
        actions
    } = context;
    
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const handleViewChange = (view: View) => {
        actions.setSelectedTeamId(null);
        setActiveView(view);
        setIsMobileNavOpen(false);
    }
    
    if (isLoading) return <div className="flex items-center justify-center h-screen bg-cosmic-bg text-lg animate-pulse-fast">Connecting to the Cosmos...</div>;
    if (error) return <div className="p-8 bg-cosmic-surface border border-cosmic-danger rounded-lg text-center m-8"><p className="font-bold text-cosmic-danger">Connection Error</p><p>{error}</p></div>;
    if (!activeUser) return <Auth />;
    
    // Onboarding check
    if (!activeUser.onboardingCompleted) {
        return <Onboarding user={activeUser} onComplete={actions.handleCompleteOnboarding} />;
    }

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard user={activeUser} teams={teams} effectiveStatement={effectiveFinancialStatement} historicalData={historicalData} onAddTransactionClick={() => actions.handleOpenAddTransactionModal()} onTransferClick={() => actions.setModalOpen('isTransferModalOpen', true)} onDrawCosmicCard={actions.handleDrawCosmicCard} onCategoryClick={actions.handleCategoryClick} onTransactionClick={actions.handleTransactionClick} onStatCardClick={actions.handleStatCardClick} onShowFreedomModal={() => actions.setModalOpen('isFreedomModalOpen', true)} />;
            case 'statement': return <FinancialStatementComponent statement={effectiveFinancialStatement} user={activeUser} allUsers={users} teams={teams} onEditTransaction={actions.handleOpenEditTransactionModal} onDeleteTransaction={actions.handleDeleteTransaction} onViewReceipt={actions.handleViewReceipt} onViewSplitDetails={actions.handleViewSplitDetails}/>;
            case 'importer': return <StatementImporter user={activeUser} onImport={actions.handleImportTransactions}/>;
            case 'accounts': return <AccountsView accounts={activeUser.accounts} onAddAccount={() => actions.setModalOpen('isAddAccountModalOpen', true)} onOpenAccountTransactions={actions.handleOpenAccountTransactionsModal} onEditAccount={actions.handleOpenEditAccountModal} />;
            case 'coach': return <AICoach user={activeUser} />;
            case 'portfolio': return <Portfolio user={activeUser} onAddStock={() => actions.handleOpenAddStockModal()} onAddAsset={() => actions.handleOpenAddAssetLiabilityModal('asset')} onAddLiability={() => actions.handleOpenAddAssetLiabilityModal('liability')} onEditStock={actions.handleOpenEditStockModal} onDeleteStock={actions.handleDeleteStock} onLogDividend={actions.handleOpenLogDividendModal} onOpenLargeChart={actions.openLargeChartModal} teams={teams} onEditAsset={actions.handleOpenEditAssetLiabilityModal} onEditLiability={actions.handleOpenEditAssetLiabilityModal} />;
            case 'teams': return <Teams teams={teams} onCreateTeam={() => actions.setModalOpen('isCreateTeamModalOpen', true)} onTeamClick={actions.handleTeamClick}/>;
            case 'team-detail': return selectedTeam ? <TeamDashboard team={selectedTeam} allUsers={users} onBack={actions.handleBackToTeams} onAddTransaction={() => actions.handleOpenAddTransactionModal(selectedTeam.id)} onAddAsset={() => actions.handleOpenAddAssetLiabilityModal('asset', selectedTeam.id)} onAddLiability={() => actions.handleOpenAddAssetLiabilityModal('liability', selectedTeam.id)} onAddStock={() => actions.handleOpenAddStockModal(selectedTeam.id)} onEditAsset={actions.handleOpenEditAssetLiabilityModal} onEditLiability={actions.handleOpenEditAssetLiabilityModal} onEditTransaction={actions.handleOpenEditTransactionModal} onDeleteTransaction={actions.handleDeleteTransaction} onViewReceipt={actions.handleViewReceipt} onViewSplitDetails={actions.handleViewSplitDetails} onOpenReportModal={() => actions.setModalOpen('isTeamReportModalOpen', true)}/> : null;
            case 'balances': return <Balances currentUser={activeUser} allUsers={users} teams={teams} onSettleUp={() => actions.setModalOpen('isTransferModalOpen', true)} />;
            case 'budget': return <BudgetView user={activeUser} onSaveBudget={actions.handleSaveBudget} onOpenBudgetModal={() => actions.setModalOpen('isAddBudgetModalOpen', true)} />;
            case 'goals': return <GoalsView user={activeUser} onAddGoal={() => actions.setModalOpen('isAddGoalModalOpen', true)} onDeleteGoal={actions.handleDeleteGoal} onContribute={actions.handleOpenContributeToGoalModal} />;
            case 'history': return <HistoricalPerformance data={historicalData} />;
            case 'achievements': return <Achievements user={activeUser} />;
            default: return <Dashboard user={activeUser} teams={teams} effectiveStatement={effectiveFinancialStatement} historicalData={historicalData} onAddTransactionClick={() => actions.handleOpenAddTransactionModal()} onTransferClick={() => actions.setModalOpen('isTransferModalOpen', true)} onDrawCosmicCard={actions.handleDrawCosmicCard} onCategoryClick={actions.handleCategoryClick} onTransactionClick={actions.handleTransactionClick} onStatCardClick={actions.handleStatCardClick} onShowFreedomModal={() => actions.setModalOpen('isFreedomModalOpen', true)} />;
        }
    };

    const navContent = (
      <>
        <div className="flex items-center gap-3 mb-8 px-2">
            <StarIcon className="w-8 h-8 text-yellow-400" />
            <h1 className="text-xl font-bold text-cosmic-text-primary">Cosmic<span className="text-cosmic-primary">Cashflow</span></h1>
        </div>
        <div className="space-y-2">
            <NavItem icon={<DashboardIcon className="w-6 h-6" />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => handleViewChange('dashboard')} />
            <NavItem icon={<HistoryIcon className="w-6 h-6" />} label="History" isActive={activeView === 'history'} onClick={() => handleViewChange('history')} />
            <NavItem icon={<StatementIcon className="w-6 h-6" />} label="Balances" isActive={activeView === 'balances'} onClick={() => handleViewChange('balances')} />
            <NavItem icon={<StatementIcon className="w-6 h-6" />} label="Statement" isActive={activeView === 'statement'} onClick={() => handleViewChange('statement')} />
            <NavItem icon={<UploadIcon className="w-6 h-6" />} label="Import" isActive={activeView === 'importer'} onClick={() => handleViewChange('importer')} />
            <NavItem icon={<CreditCardIcon className="w-6 h-6" />} label="Accounts" isActive={activeView === 'accounts'} onClick={() => handleViewChange('accounts')} />
            <NavItem icon={<PortfolioIcon className="w-6 h-6" />} label="Portfolio" isActive={activeView === 'portfolio'} onClick={() => handleViewChange('portfolio')} />
            <NavItem icon={<BudgetIcon className="w-6 h-6" />} label="Budget" isActive={activeView === 'budget'} onClick={() => handleViewChange('budget')} />
            <NavItem icon={<GoalIcon className="w-6 h-6" />} label="Goals" isActive={activeView === 'goals'} onClick={() => handleViewChange('goals')} />
            <NavItem icon={<TrophyIcon className="w-6 h-6" />} label="Achievements" isActive={activeView === 'achievements'} onClick={() => handleViewChange('achievements')} />
            <NavItem icon={<TeamsIcon className="w-6 h-6" />} label="Teams" isActive={activeView === 'teams' || activeView === 'team-detail'} onClick={() => handleViewChange('teams')} />
             {activeView === 'team-detail' && selectedTeam && (
                <div className="pl-4 mt-1 border-l-2 border-cosmic-primary ml-5">
                    <NavItem icon={<div className="w-6 h-6" />} label={selectedTeam.name} isActive={true} onClick={() => {}} isSub/>
                </div>
             )}
            <NavItem icon={<CoachIcon className="w-6 h-6" />} label="AI Coach" isActive={activeView === 'coach'} onClick={() => handleViewChange('coach')} />
        </div>
        <div className="mt-auto bg-cosmic-bg p-4 rounded-lg border border-cosmic-border flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img src={activeUser.avatar} alt={activeUser.name} className="w-10 h-10 rounded-full border-2 border-cosmic-primary" />
                <div>
                    <p className="font-bold text-cosmic-text-primary">{activeUser.name}</p>
                    <p className="text-sm text-cosmic-text-secondary">Level 5</p>
                </div>
            </div>
            <button onClick={handleLogout} title="Log Out" className="text-cosmic-text-secondary hover:text-cosmic-primary">
                <LogOutIcon className="w-6 h-6" />
            </button>
        </div>
      </>
    );

    return (
        <div className="md:flex h-screen bg-cosmic-bg text-cosmic-text-primary font-sans">
             {notification && (
                <Notification 
                    message={notification.message} 
                    type={notification.type} 
                    onClose={() => actions.setNotification(null)} 
                />
            )}
            {isMobileNavOpen && (
                <div className="fixed inset-0 bg-cosmic-bg bg-opacity-90 z-50 md:hidden" onClick={() => setIsMobileNavOpen(false)}>
                    <nav className="w-64 bg-cosmic-surface border-r border-cosmic-border p-4 flex flex-col h-full">
                        {navContent}
                    </nav>
                </div>
            )}
            <nav className="hidden md:flex w-64 bg-cosmic-surface border-r border-cosmic-border p-4 flex-col flex-shrink-0">
                {navContent}
            </nav>

            <main className="flex-1 flex flex-col overflow-y-auto relative">
                <header className="md:hidden sticky top-0 bg-cosmic-surface/80 backdrop-blur-sm z-40 p-2 flex justify-between items-center border-b border-cosmic-border">
                    <button onClick={() => setIsMobileNavOpen(true)} className="p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div className="flex items-center gap-2">
                         <img src={activeUser.avatar} className="w-8 h-8 rounded-full border-2 border-cosmic-primary" alt={activeUser.name}/>
                    </div>
                </header>

                <div className="p-4 md:p-8">
                    <div className="flex-grow">{renderView()}</div>
                </div>

                <FloatingActionButton 
                    isOpen={modalStates.isFabOpen} 
                    onToggle={() => actions.setModalOpen('isFabOpen', !modalStates.isFabOpen)} 
                    onAddTransaction={() => { actions.setModalOpen('isAddTransactionModalOpen', true); actions.setModalOpen('isFabOpen', false); }}
                    onAddAccount={() => { actions.setModalOpen('isAddAccountModalOpen', true); actions.setModalOpen('isFabOpen', false); }}
                    onCreateTeam={() => { actions.setModalOpen('isCreateTeamModalOpen', true); actions.setModalOpen('isFabOpen', false); }}
                    onAddStock={() => { actions.setModalOpen('isAddStockModalOpen', true); actions.setModalOpen('isFabOpen', false); }}
                    onTransfer={() => { actions.setModalOpen('isTransferModalOpen', true); actions.setModalOpen('isFabOpen', false); }}
                />
            </main>
            
            <AddTransactionModal isOpen={modalStates.isAddTransactionModalOpen} onClose={() => actions.setModalOpen('isAddTransactionModalOpen', false)} onSave={actions.handleSaveTransaction} transactionToEdit={modalData.transactionToEdit} currentUser={activeUser} allUsers={users} teams={teams} onAddAccountClick={() => { actions.setModalOpen('isAddTransactionModalOpen', false); actions.setModalOpen('isAddAccountModalOpen', true); }} onAddCategoryClick={() => { actions.setModalOpen('isAddTransactionModalOpen', false); actions.setModalOpen('isAddCategoryModalOpen', true); }} defaultTeamId={modalData.modalDefaultTeamId} />
            <TransferModal isOpen={modalStates.isTransferModalOpen} onClose={() => actions.setModalOpen('isTransferModalOpen', false)} onTransfer={actions.handleTransfer} currentUser={activeUser}/>
            <CosmicEventModal isOpen={modalStates.isCosmicEventModalOpen} isGenerating={modalData.isGeneratingCosmicEvent} event={modalData.currentCosmicEvent} onClose={() => actions.setModalOpen('isCosmicEventModalOpen', false)} onResolve={actions.handleCosmicEventResolution}/>
            <AddStockModal isOpen={modalStates.isAddStockModalOpen} onClose={() => actions.setModalOpen('isAddStockModalOpen', false)} onSave={actions.handleSaveStock} stockToEdit={modalData.stockToEdit} accounts={activeUser?.accounts || []} teams={teams} defaultTeamId={modalData.modalDefaultTeamId} />
            {modalData.stockForDividend && <LogDividendModal isOpen={modalStates.isLogDividendModalOpen} onClose={() => { actions.setModalOpen('isLogDividendModalOpen', false); actions.setModalDataField('stockForDividend', null); }} onLogDividend={actions.handleLogDividend} stock={modalData.stockForDividend} accounts={activeUser.accounts}/>}
            {modalData.stockForLargeChart && <LargeChartModal stock={modalData.stockForLargeChart} onClose={actions.closeLargeChartModal}/>}
            <AddAccountModal isOpen={modalStates.isAddAccountModalOpen} onClose={() => actions.setModalOpen('isAddAccountModalOpen', false)} onAddAccount={actions.handleAddAccount}/>
            <EditAccountModal isOpen={modalStates.isEditAccountModalOpen} onClose={() => actions.setModalOpen('isEditAccountModalOpen', false)} onSave={actions.handleUpdateAccount} accountToEdit={modalData.accountToEdit} allUsers={users} />
            <AddAssetLiabilityModal isOpen={modalStates.isAddAssetLiabilityModalOpen} type={modalData.assetLiabilityToAdd} itemToEdit={modalData.assetLiabilityToEdit} onClose={() => { actions.setModalOpen('isAddAssetLiabilityModalOpen', false); actions.setModalDataField('assetLiabilityToEdit', null); }} onSave={modalData.assetLiabilityToEdit ? actions.handleUpdateAssetLiability : actions.handleAddAssetLiability} teams={teams} defaultTeamId={modalData.modalDefaultTeamId} />
            {modalData.selectedTransaction && <TransactionDetailModal isOpen={modalStates.isTransactionDetailModalOpen} onClose={() => { actions.setModalOpen('isTransactionDetailModalOpen', false); actions.setModalDataField('selectedTransaction', null); }} transaction={modalData.selectedTransaction} users={users}/>}
            {modalData.selectedCategory && <CategoryTransactionListModal isOpen={modalStates.isCategoryModalOpen} onClose={() => { actions.setModalOpen('isCategoryModalOpen', false); actions.setModalDataField('selectedCategory', null); }} category={modalData.selectedCategory} transactions={effectiveFinancialStatement.transactions}/>}
            <CreateTeamModal isOpen={modalStates.isCreateTeamModalOpen} onClose={() => actions.setModalOpen('isCreateTeamModalOpen', false)} onCreateTeam={actions.handleCreateTeam} currentUser={activeUser}/>
            <NetWorthBreakdownModal isOpen={modalStates.isNetWorthBreakdownModalOpen} onClose={() => actions.setModalOpen('isNetWorthBreakdownModalOpen', false)} user={activeUser} teams={teams} />
            <AddCategoryModal isOpen={modalStates.isAddCategoryModalOpen} onClose={() => { actions.setModalOpen('isAddCategoryModalOpen', false); actions.setModalOpen('isAddTransactionModalOpen', true); }} onAddCategory={actions.handleAddCategory} />
            {modalData.accountForTransactionList && <AccountTransactionsModal isOpen={modalStates.isAccountTransactionsModalOpen} onClose={() => actions.setModalOpen('isAccountTransactionsModalOpen', false)} account={modalData.accountForTransactionList} allTransactions={effectiveFinancialStatement.transactions} onEditTransaction={actions.handleOpenEditTransactionModal} onDeleteTransaction={actions.handleDeleteTransaction} />}
            <AddBudgetModal isOpen={modalStates.isAddBudgetModalOpen} onClose={() => actions.setModalOpen('isAddBudgetModalOpen', false)} onSave={actions.handleSaveBudget} user={activeUser} />
            <AddGoalModal isOpen={modalStates.isAddGoalModalOpen} onClose={() => actions.setModalOpen('isAddGoalModalOpen', false)} onSave={actions.handleSaveGoal} />
            {modalData.goalToContribute && <ContributeToGoalModal isOpen={modalStates.isContributeToGoalModalOpen} onClose={() => actions.setModalOpen('isContributeToGoalModalOpen', false)} onContribute={actions.handleContributeToGoal} goal={modalData.goalToContribute} user={activeUser} />}
            <ReceiptModal isOpen={modalStates.isReceiptModalOpen} onClose={() => actions.setModalOpen('isReceiptModalOpen', false)} imageUrl={modalData.receiptUrlToView} />
            {modalData.selectedTransaction && <TransactionSplitDetailModal isOpen={modalStates.isSplitDetailModalOpen} onClose={() => { actions.setModalOpen('isSplitDetailModalOpen', false); actions.setModalDataField('selectedTransaction', null); }} transaction={modalData.selectedTransaction} allUsers={users} allAccounts={allUserAccounts} />}
            <FreedomModal isOpen={modalStates.isFreedomModalOpen} onClose={() => actions.setModalOpen('isFreedomModalOpen', false)} />
            <TeamReportModal isOpen={modalStates.isTeamReportModalOpen} onClose={() => actions.setModalOpen('isTeamReportModalOpen', false)} team={selectedTeam} />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    )
}

export default App;