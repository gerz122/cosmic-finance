import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { CheckCircleIcon, XCircleIcon, RefreshIcon, XIcon, StarIcon, ClipboardListIcon } from './icons';
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
        <div className="flex items-start gap-3 p-3 bg-cosmic-bg rounded-lg">
            <div className="mt-1 flex-shrink-0">
                {renderStatusIcon()}
            </div>
            <div className="flex-grow">
                <p className={`font-semibold text-sm ${task.status === 'failed' ? 'text-cosmic-danger' : 'text-cosmic-text-primary'}`}>{task.name}</p>
                <p className="text-xs text-cosmic-text-secondary">{new Date(task.createdAt).toLocaleTimeString()}</p>
                {task.error && (
                     <pre className="mt-2 text-xs text-cosmic-text-secondary bg-cosmic-surface border border-cosmic-border p-2 rounded-md whitespace-pre-wrap font-mono max-h-24 overflow-y-auto">
                        {task.error}
                    </pre>
                )}
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
                 {task.status === 'failed' && task.onRetry && (
                    <button onClick={task.onRetry} title="Retry Task" className="text-cosmic-primary hover:text-blue-400">
                        <RefreshIcon className="w-4 h-4" />
                    </button>
                 )}
                 <button onClick={() => actions.dismissTask(task.id)} title="Dismiss" className="text-cosmic-text-secondary hover:text-white">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


export const ActivityMonitor: React.FC = () => {
    const { activeTasks } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);

    const hasActiveOrFailedTasks = activeTasks.some(t => t.status === 'processing' || t.status === 'failed');

    return (
        <div className="fixed top-4 right-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-cosmic-surface rounded-full shadow-lg flex items-center justify-center border border-cosmic-border hover:border-cosmic-primary transition-colors"
                aria-label="Toggle Activity Monitor"
            >
                <ClipboardListIcon className="w-6 h-6 text-cosmic-text-secondary" />
                {hasActiveOrFailedTasks && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cosmic-danger opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-cosmic-danger justify-center items-center text-xs text-white">
                            {activeTasks.filter(t => t.status === 'failed').length || activeTasks.filter(t => t.status === 'processing').length}
                        </span>
                    </span>
                )}
            </button>
            
            {isOpen && (
                <div 
                    className="absolute top-14 right-0 w-80 bg-cosmic-surface border border-cosmic-border rounded-lg shadow-2xl animate-fade-in flex flex-col max-h-[calc(100vh-100px)]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-3 border-b border-cosmic-border">
                        <h3 className="font-bold text-cosmic-text-primary">Activity Log</h3>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-2">
                         {activeTasks.length === 0 ? (
                            <p className="text-center text-sm text-cosmic-text-secondary p-4">No recent activity.</p>
                         ) : (
                            [...activeTasks].sort((a,b) => b.createdAt - a.createdAt).map(task => <TaskItem key={task.id} task={task} />)
                         )}
                    </div>
                </div>
            )}
        </div>
    );
};
