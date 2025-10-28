import React from 'react';
import type { User, Goal } from '../types';
import { PlusIcon, XIcon, StarIcon } from './icons';

interface GoalsViewProps {
    user: User;
    onAddGoal: () => void;
    onDeleteGoal: (goalId: string) => void;
    onContribute: (goal: Goal) => void;
}

const ProgressBar: React.FC<{ value: number; max: number; }> = ({ value, max }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full bg-cosmic-bg rounded-full h-4 border border-cosmic-border relative overflow-hidden">
            <div
                className="bg-gradient-to-r from-cosmic-secondary to-cosmic-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {percentage.toFixed(0)}%
            </div>
        </div>
    );
};

const GoalCard: React.FC<{ goal: Goal, onDelete: () => void, onContribute: () => void }> = ({ goal, onDelete, onContribute }) => {
    return (
        <div className="bg-cosmic-surface p-4 rounded-xl border border-cosmic-border flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-cosmic-text-primary">{goal.name}</h3>
                    {goal.targetDate && <p className="text-xs text-cosmic-text-secondary">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>}
                </div>
                <button onClick={onDelete} className="text-cosmic-text-secondary hover:text-cosmic-danger p-1">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
            <div>
                 <div className="flex justify-between items-end text-sm mb-1">
                    <span className="text-cosmic-primary font-bold">${goal.currentAmount.toLocaleString()}</span>
                    <span className="text-cosmic-text-secondary">of ${goal.targetAmount.toLocaleString()}</span>
                </div>
                <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
            </div>
            <button onClick={onContribute} className="w-full mt-2 bg-cosmic-primary/20 text-cosmic-primary font-bold py-2 px-4 text-sm rounded-lg border border-cosmic-primary/50 hover:bg-cosmic-primary/40 transition-colors">
                Contribute
            </button>
        </div>
    );
};

export const GoalsView: React.FC<GoalsViewProps> = ({ user, onAddGoal, onDeleteGoal, onContribute }) => {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">Financial Goals</h1>
                    <p className="text-cosmic-text-secondary">Track your progress towards your biggest dreams.</p>
                </div>
                <button onClick={onAddGoal} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Add New Goal
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.goals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} onDelete={() => onDeleteGoal(goal.id)} onContribute={() => onContribute(goal)} />
                ))}

                {user.goals.length === 0 && (
                    <div className="col-span-full bg-cosmic-surface p-8 rounded-lg border border-dashed border-cosmic-border text-center">
                        <StarIcon className="w-12 h-12 mx-auto text-cosmic-text-secondary mb-4" />
                        <h3 className="text-xl font-semibold text-cosmic-text-primary">No Goals Yet</h3>
                        <p className="text-cosmic-text-secondary mt-2">Set your first financial goal to start your journey!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
