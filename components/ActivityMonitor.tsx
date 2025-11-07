import React from 'react';
import { useAppContext } from '../AppContext';
import { CheckCircleIcon, XCircleIcon, RefreshIcon, XIcon } from './icons';
import type { AppTask } from '../types';

const TaskItem: React.FC<{ task: AppTask }> = ({ task }) => {
    const { actions } = useAppContext();

    const renderStatusIcon = () => {
        switch (task.status) {
            case 'processing':
                return <div className="w-5 h-5 border-2 border-cosmic-primary border-t-transparent rounded-full animate-spin"></div>;
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-cosmic-success" />;
            case 'failed':
                return <XCircleIcon className="w-5 h-5 text-cosmic-danger" />;
        }
    };

    return (
        <div className="bg-cosmic-bg p-3 rounded-lg">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {renderStatusIcon()}
                    <div>
                        <p className="text-sm font-semibold text-cosmic-text-primary">{task.name}</p>
                        {task.status === 'failed' && <p className="text-xs text-cosmic-danger mt-1">{task.error}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {task.status === 'failed' && task.onRetry && (
                        <button onClick={task.onRetry} title="Retry" className="text-cosmic-text-secondary hover:text-cosmic-primary">
                            <RefreshIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => actions.dismissTask(task.id)} title="Dismiss" className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ActivityMonitor: React.FC = () => {
    const { activeTasks } = useAppContext();

    if (activeTasks.length === 0) return null;

    return (
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
            <div className="bg-cosmic-surface p-3 rounded-lg border border-cosmic-border shadow-2xl space-y-2 animate-fade-in max-h-96 overflow-y-auto">
                <h3 className="text-xs font-bold uppercase text-cosmic-text-secondary px-2">Activity</h3>
                {activeTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
};