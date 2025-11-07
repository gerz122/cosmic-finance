import React from 'react';
import { useAppContext } from '../AppContext';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';

export const HistoryView: React.FC = () => {
    const { activityLog } = useAppContext();

    const getIconForType = (type: 'success' | 'error' | 'info') => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-cosmic-success" />;
            case 'error':
                return <XCircleIcon className="w-5 h-5 text-cosmic-danger" />;
            case 'info':
            default:
                return <SparklesIcon className="w-5 h-5 text-cosmic-primary" />;
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-cosmic-text-primary">History & Activity Log</h1>
                <p className="text-cosmic-text-secondary">A complete audit trail of all actions and events in your game.</p>
            </div>

            <div className="bg-cosmic-surface p-4 rounded-xl border border-cosmic-border">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {activityLog.length === 0 && (
                        <p className="text-center text-cosmic-text-secondary py-8">No activity recorded yet.</p>
                    )}
                    {activityLog.map(entry => (
                        <div key={entry.id} className="flex items-start gap-4 p-3 bg-cosmic-bg rounded-lg">
                            <div className="mt-1 flex-shrink-0">
                                {getIconForType(entry.type)}
                            </div>
                            <div className="flex-grow">
                                <p className={`font-semibold ${entry.type === 'error' ? 'text-cosmic-danger' : 'text-cosmic-text-primary'}`}>{entry.message}</p>
                                <p className="text-xs text-cosmic-text-secondary">{new Date(entry.timestamp).toLocaleString()}</p>
                                {entry.details && (
                                    <pre className="mt-2 text-xs text-cosmic-text-secondary bg-cosmic-surface border border-cosmic-border p-2 rounded-md whitespace-pre-wrap font-mono">
                                        {entry.details}
                                    </pre>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
