import React, { useState, useEffect } from 'react';
import HierarchyDropdown from './HierarchyDropdown';
import { FaHistory, FaClock, FaDownload } from 'react-icons/fa';

export default function Output({ prompt, dbs, geminiMessage, dbFilePath, token }) {
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const fetchLogs = async () => {
        if (!token) return;
        
        setIsLoadingLogs(true);
        try {
            const response = await fetch(`${apiUrl}/fetch-logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });
            const data = await response.json();
            
            if (response.ok) {
                console.log("Fetched logs:", data.logs);
                setLogs(data.logs || []);
            } else {
                console.error("Error fetching logs:", data.error);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    // Auto-fetch logs when token changes
    useEffect(() => {
        if (token) {
            fetchLogs();
        }
    }, [token]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className="flex flex-col px-7 py-6 space-y-4">
            {dbs && dbs.length > 0 ? (
                <>
                    {/* Current Schema Content */}
                    <div>
                        <p className="text-justify text-sm mb-2">
                            {geminiMessage}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <HierarchyDropdown dbs={dbs} />
                            <a href={`${apiUrl}/download_db?path=${encodeURIComponent(dbFilePath)}`}
                                download
                                target="_blank"
                                rel="noopener noreferrer">
                                <button className="cursor-pointer transition-all duration-75 transform hover:scale-103 border border-indigo-300 py-2 px-5 text-sm rounded-full flex items-center gap-2">
                                    <FaDownload className="text-xs" />
                                    Export .db
                                </button>
                            </a>
                            <button 
                                onClick={() => {
                                    setShowLogs(!showLogs);
                                    if (!showLogs) fetchLogs();
                                }}
                                className="cursor-pointer transition-all duration-75 transform hover:scale-103 border border-green-300 py-2 px-5 text-sm rounded-full flex items-center gap-2"
                            >
                                <FaHistory className="text-xs" />
                                {showLogs ? 'Hide History' : 'View History'}
                                {logs.length > 0 && <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">{logs.length}</span>}
                            </button>
                        </div>
                    </div>

                    {/* Logs Section */}
                    {showLogs && (
                        <div className="border-t pt-4 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FaHistory className="text-indigo-500" />
                                    Schema History
                                </h3>
                                <button
                                    onClick={fetchLogs}
                                    disabled={isLoadingLogs}
                                    className="text-sm text-indigo-500 hover:text-indigo-800 disabled:opacity-50"
                                >
                                    {isLoadingLogs ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>
                            
                            {isLoadingLogs ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">Loading history...</p>
                                </div>
                            ) : logs.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {logs.map((log, index) => (
                                        <div key={log.id || index} className="border rounded-lg p-4 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-medium text-sm">
                                                    {truncateText(log.prompt, 80)}
                                                </h4>
                                                <div className="flex items-center text-xs gap-1">
                                                    <FaClock className="text-xs" />
                                                    {formatDate(log.created_at)}
                                                </div>
                                            </div>
                                            
                                            {log.gemini_message && (
                                                <p className="text-xs mb-2">
                                                    {truncateText(log.gemini_message, 150)}
                                                </p>
                                            )}
                                            
                                            {log.schema && log.schema.length > 0 && (
                                                <div className="text-xs">
                                                    <span className="font-medium">Tables:</span> {
                                                        log.schema[0]?.tables?.join(', ') || 'No tables'
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <FaHistory className="mx-auto text-3xl mb-2 opacity-50" />
                                    <p>No schema history found for this session.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold mb-2">Welcome to AskSQL</h1>
                    <p className="text-gray-600">Generate database schemas with AI assistance</p>
                </div>
            )}
        </div>
    );
}