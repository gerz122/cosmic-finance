import React, { useState } from 'react';
import type { User } from './types';
import { StarIcon } from './components/icons';

interface OnboardingProps {
    user: User;
    onComplete: () => void;
}

const OnboardingStep: React.FC<{ title: string; description: string; isCompleted: boolean; }> = ({ title, description, isCompleted }) => (
    <div className="flex items-start gap-4">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isCompleted ? 'bg-cosmic-success' : 'border-2 border-cosmic-border'}`}>
            {isCompleted && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
        <div>
            <h3 className={`font-bold ${isCompleted ? 'text-cosmic-text-secondary line-through' : 'text-cosmic-text-primary'}`}>{title}</h3>
            <p className="text-sm text-cosmic-text-secondary">{description}</p>
        </div>
    </div>
);


const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
    // This is a simplified check. A real implementation would listen for these events.
    const [stepsCompleted, setStepsCompleted] = useState({
        accountAdded: user.accounts.length > 0,
        transactionAdded: user.financialStatement.transactions.length > 0,
        teamJoined: user.teamIds.length > 0,
    });
    
    const allDone = Object.values(stepsCompleted).every(Boolean);

    return (
        <div className="min-h-screen bg-cosmic-bg flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-cosmic-surface p-8 rounded-2xl border border-cosmic-border shadow-2xl">
                 <div className="text-center mb-8">
                    <StarIcon className="w-12 h-12 text-yellow-400 mx-auto" />
                    <h1 className="text-3xl font-bold text-cosmic-text-primary mt-4">Welcome, {user.name}!</h1>
                    <p className="text-cosmic-text-secondary mt-1">Let's get you set up for the tournament.</p>
                </div>
                
                <div className="space-y-6">
                    <OnboardingStep 
                        title="Add Your First Account"
                        description="Connect a cash, bank, or credit account to start tracking."
                        isCompleted={stepsCompleted.accountAdded}
                    />
                     <OnboardingStep 
                        title="Log Your First Transaction"
                        description="Record an income or expense to see your cash flow in action."
                        isCompleted={stepsCompleted.transactionAdded}
                    />
                     <OnboardingStep 
                        title="Create or Join a Team"
                        description="Financial battles are better with allies. Start a new project!"
                        isCompleted={stepsCompleted.teamJoined}
                    />
                </div>
                
                <div className="mt-8">
                    <button 
                        onClick={onComplete}
                        className="w-full bg-cosmic-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-400 transition-colors disabled:bg-cosmic-border"
                    >
                        {allDone ? "Let's Go!" : "I'll do this later, take me to the app"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;