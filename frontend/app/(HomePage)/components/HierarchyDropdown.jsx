"use client";

import React, { useState } from 'react';
import { FaDatabase, FaTable, FaChevronDown, FaChevronRight, FaColumns } from 'react-icons/fa';

export default function HierarchyDropdown({ dbs, onSchemaSelect = null }) {
    const [open, setOpen] = useState(false);
    const [dbsOpen, setDbsOpen] = useState(false);
    const [openDbIndex, setOpenDbIndex] = useState(null);
    const [openTableIndex, setOpenTableIndex] = useState({}); // { dbIdx: tableIdx }

    const handleSchemaClick = (db, table = null, column = null) => {
        if (onSchemaSelect) {
            onSchemaSelect({ db, table, column });
        }
    };

    const getTableCount = (db) => {
        return db.tables ? db.tables.length : 0;
    };

    const getColumnCount = (db, tableName) => {
        return db.columns && db.columns[tableName] ? db.columns[tableName].length : 0;
    };

    return (
        <div className="relative inline-block text-left mt-2">
            <button
                type="button"
                className="cursor-pointer inline-flex w-full justify-center rounded-md border  px-4 py-2 text-sm font-bold shadow-sm transition-all duration-200 "
                onClick={() => { 
                    setDbsOpen((prev) => !prev); 
                    setOpen((prev) => !prev); 
                }}
            >
                <FaDatabase className="mr-2 h-4 w-4 text-indigo-400" />
                Database Structure
                {dbs && dbs.length > 0 && (
                    <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs rounded-full px-2 py-1">
                        {dbs.reduce((total, db) => total + getTableCount(db), 0)} tables
                    </span>
                )}
                <FaChevronDown className={`ml-3 h-4 w-4 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            
            <div
                className={`absolute left-0 mt-2 w-96 origin-top-left rounded-md  shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 transition-all duration-200
                ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
                style={{ transformOrigin: 'top left' }}
            >
                <div className={`py-2 transition-all duration-200 pr-3 border  rounded ${open ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
                    {/* DBs list */}
                    {dbsOpen && (
                        <div className="pl-2">
                            {dbs && dbs.length > 0 ? dbs.map((db, idx) => (
                                <div key={db.name || idx}>
                                    <div
                                        className={`py-2 flex items-center cursor-pointer font-semibold rounded px-2 transition-colors duration-150 `}
                                        onClick={() => {
                                            setOpenDbIndex(openDbIndex === idx ? null : idx);
                                            handleSchemaClick(db);
                                        }}
                                    >
                                        {openDbIndex === idx ? (
                                            <FaChevronDown className="mr-2 text-gray-500" />
                                        ) : (
                                            <FaChevronRight className="mr-2 text-gray-500" />
                                        )}
                                        <FaDatabase className="mr-2 text-indigo-400" />
                                        <span>{db.name || `Database ${idx + 1}`}</span>
                                        <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                            {getTableCount(db)} tables
                                        </span>
                                    </div>
                                    
                                    {/* Tables under DB */}
                                    <div
                                        className={`transition-all duration-200 pl-6 overflow-hidden ${
                                            openDbIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        {openDbIndex === idx && db.tables && db.tables.map((table, tIdx) => (
                                            <div key={table}>
                                                <div
                                                    className="py-1.5 text-sm cursor-pointer flex items-center rounded px-2 transition-colors duration-150 "
                                                    onClick={() => {
                                                        setOpenTableIndex(prev => ({ 
                                                            ...prev, 
                                                            [idx]: prev[idx] === tIdx ? null : tIdx 
                                                        }));
                                                        handleSchemaClick(db, table);
                                                    }}
                                                >
                                                    <FaTable className="mr-2 text-green-600" />
                                                    <span>{table}</span>
                                                    <span className="ml-auto flex items-center gap-2">
                                                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                                            {getColumnCount(db, table)} cols
                                                        </span>
                                                        {openTableIndex[idx] === tIdx ? 
                                                            <FaChevronDown className="text-xs" /> : 
                                                            <FaChevronRight className="text-xs" />
                                                        }
                                                    </span>
                                                </div>
                                                
                                                {/* Columns under Table as a table UI */}
                                                <div
                                                    className={`transition-all duration-200 pl-6 overflow-hidden ${
                                                        openTableIndex[idx] === tIdx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                    }`}
                                                >
                                                    {openTableIndex[idx] === tIdx && db.columns && Array.isArray(db.columns[table]) && (
                                                        <div className="mt-2 mb-3 border border-gray-200 rounded-lg overflow-hidden">
                                                            <table className="min-w-full text-xs">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">
                                                                            <FaColumns className="inline mr-1" />
                                                                            Column Name
                                                                        </th>
                                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">
                                                                            Data Type
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="">
                                                                    {db.columns[table].map((column, colIdx) => (
                                                                        <tr 
                                                                            key={column.name || colIdx} 
                                                                            className="border-b   cursor-pointer"
                                                                            onClick={() => handleSchemaClick(db, table, column)}
                                                                        >
                                                                            <td className="px-3 py-2 font-medium">
                                                                                {column.name}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-gray-600">
                                                                                <span className="bg-blue-100  text-xs px-2 py-1 rounded-full">
                                                                                    {column.dtype}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    <FaDatabase className="mx-auto text-3xl mb-2 opacity-50" />
                                    <p className="text-sm">No database structure available</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}