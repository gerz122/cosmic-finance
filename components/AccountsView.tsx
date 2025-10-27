import React from 'react';
import type { Account } from '../types';
import { AccountType } from '../types';
import { PlusIcon, CreditCardIcon } from './icons';

interface AccountsViewProps {
    accounts: Account[];
    onAddAccount: () => void;
    onOpenAccountTransactions: (account: Account) => void;
}

const AccountCard: React.FC<{account: Account, onClick: () => void}> = ({ account, onClick }) => {
    const isNegative = account.balance < 0 && account.type !== AccountType.LOAN && account.type !== AccountType.CREDIT_CARD;
    const isLiability = account.type === AccountType.LOAN || account.type === AccountType.CREDIT_CARD;
    const balanceColor = isNegative || isLiability ? 'text-cosmic-danger' : 'text-cosmic-success';

    return (
        <button onClick={onClick} className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border flex justify-between items-center w-full text-left hover:border-cosmic-primary transition-colors transform hover:-translate-y-1">
            <div>
                <p className="font-bold text-cosmic-text-primary">{account.name}</p>
                <p className="text-sm text-cosmic-text-secondary">{account.type}</p>
            </div>
            <p className={`text-2xl font-semibold ${balanceColor}`}>
                {isLiability && account.balance > 0 ? `-$${account.balance.toFixed(2)}` : `$${account.balance.toFixed(2)}`}
            </p>
        </button>
    );
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts = [], onAddAccount, onOpenAccountTransactions }) => {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">Accounts</h1>
                    <p className="text-cosmic-text-secondary">Manage your cash, bank, and credit accounts.</p>
                </div>
                 <button onClick={onAddAccount} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Add Account
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.length > 0 ? (
                    accounts.map(acc => <AccountCard key={acc.id} account={acc} onClick={() => onOpenAccountTransactions(acc)} />)
                ) : (
                    <div className="col-span-full bg-cosmic-surface p-8 rounded-lg border border-dashed border-cosmic-border text-center">
                        <CreditCardIcon className="w-12 h-12 mx-auto text-cosmic-text-secondary mb-4" />
                        <h3 className="text-xl font-semibold text-cosmic-text-primary">No Accounts Yet</h3>
                        <p className="text-cosmic-text-secondary mt-2">Get started by adding your first cash, bank, or credit account.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
