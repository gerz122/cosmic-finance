import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { UploadIcon } from './icons';

export const DataManagementView: React.FC = () => {
    const { activeUser, teams, actions } = useAppContext();
    const [isImporting, setIsImporting] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleExport = () => {
        if (!activeUser) return;

        const dataToExport = {
            user: activeUser,
            teams: teams.filter(t => t.memberIds.includes(activeUser.id)),
            exportDate: new Date().toISOString(),
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `cosmic_cashflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsImporting(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!data.user || !data.teams) {
                    throw new Error("Invalid backup file format.");
                }

                await actions.importData(data);
                // The task will show success in the activity monitor
            } catch (err) {
                alert(`Import failed: ${(err as Error).message}`);
                console.error(err);
            } finally {
                setIsImporting(false);
                setFileName('');
            }
        };
        reader.readAsText(file);
    };


    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-cosmic-text-primary">Data Management</h1>
                <p className="text-cosmic-text-secondary">Export your data for backup or import to restore your state.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Export Card */}
                <div className="bg-cosmic-surface p-6 rounded-lg border border-cosmic-border">
                    <h2 className="text-xl font-bold text-cosmic-text-primary">Export Data</h2>
                    <p className="text-cosmic-text-secondary mt-2 mb-4">
                        Download a complete backup of all your personal and team data. Keep this file in a safe place.
                    </p>
                    <button
                        onClick={handleExport}
                        className="w-full bg-cosmic-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-400 transition-colors"
                    >
                        Export All Data as JSON
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-cosmic-surface p-6 rounded-lg border border-cosmic-border">
                    <h2 className="text-xl font-bold text-cosmic-text-primary">Import Data</h2>
                    <p className="text-cosmic-text-secondary mt-2 mb-4">
                        Restore your game state from a previously exported JSON file. This will merge the data and may overwrite existing entries.
                    </p>
                    <label
                        htmlFor="import-file"
                        className={`w-full flex items-center justify-center gap-2 bg-cosmic-bg border-2 border-dashed border-cosmic-border py-3 px-4 rounded-lg transition-colors ${isImporting ? 'cursor-wait' : 'cursor-pointer hover:border-cosmic-primary'}`}
                    >
                        {isImporting ? (
                             <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Importing...</span>
                             </>
                        ) : (
                            <>
                                <UploadIcon className="w-5 h-5" />
                                <span>{fileName || 'Select Backup File'}</span>
                            </>
                        )}
                       
                    </label>
                    <input id="import-file" type="file" className="hidden" accept=".json" onChange={handleFileChange} disabled={isImporting} />
                </div>
            </div>
        </div>
    );
};