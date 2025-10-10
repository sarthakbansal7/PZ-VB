"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Edit, Trash2, Search, Download, DollarSign, RefreshCcw, CheckSquare, Square,
    ChevronLeft, ChevronRight, SortAsc, SortDesc, X, ArrowUpDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Employee } from '@/lib/interfaces';
import EmployeeDetailsModal from "./EmployeeDetailsModal";

const sortableColumns: { key: keyof Employee; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'email', label: 'Email' },
    { key: 'salary', label: 'Salary (USD)' },
    { key: 'wallet', label: 'Wallet' },
];

const ITEMS_PER_PAGE = 10;

interface EmployeeTable2Props {
    employees: Employee[];
    selectedEmployees: string[];
    toggleEmployeeSelection: (id: string) => void;
    usdToToken: (usdAmount: string) => string;
    selectedTokenSymbol: string;
    isLoading: boolean;
    deleteEmployeeById: (id: string) => void;
    onEditEmployee?: (employee: Employee) => void;
    exchangeRate: number;
    handleTransaction: () => Promise<void>;
    isLoadingDerived: boolean;
    needsApproval: boolean;
    isApproving: boolean;
    isSending: boolean;
    isWritePending: boolean;
    isTxLoading: boolean;
    selectedToken: any;
    refreshEmployees?: () => Promise<void> | void;
}

const EmployeeTable2: React.FC<EmployeeTable2Props> = ({
    employees = [],
    selectedEmployees,
    toggleEmployeeSelection,
    usdToToken,
    selectedTokenSymbol,
    isLoading,
    deleteEmployeeById,
    onEditEmployee,
    exchangeRate,
    handleTransaction,
    isLoadingDerived,
    needsApproval,
    isApproving,
    isSending,
    isWritePending,
    isTxLoading,
    selectedToken,
    refreshEmployees
}) => {
    // Search and sort states
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<keyof Employee>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedDetailsEmployee, setSelectedDetailsEmployee] = useState<Employee | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Dynamically create the token salary column definition
    const tokenSalaryColumnKey = `salary_${selectedTokenSymbol}`;
    const tokenSalaryColumn = { key: tokenSalaryColumnKey, label: `Salary (${selectedTokenSymbol})` };

    // Update allPossibleColumns to include the dynamic token salary column
    const allPossibleColumns: { key: keyof Employee | 'actions' | string; label: string }[] = [
        ...sortableColumns,
        tokenSalaryColumn, // Add the token salary column here
        { key: 'actions', label: 'Actions' }
    ];

    const isAllSelected = useMemo(() => {
        return employees.length > 0 && selectedEmployees.length === employees.length;
    }, [employees.length, selectedEmployees.length]);

    const isIndeterminate = useMemo(() => {
        return selectedEmployees.length > 0 && selectedEmployees.length < employees.length;
    }, [selectedEmployees.length, employees.length]);

    const toggleSelectAll = () => {
        if (isAllSelected) {
            employees.forEach(emp => {
                if (selectedEmployees.includes(emp.wallet)) {
                    toggleEmployeeSelection(emp.wallet);
                }
            });
        } else {
            employees.forEach(emp => {
                if (!selectedEmployees.includes(emp.wallet)) {
                    toggleEmployeeSelection(emp.wallet);
                }
            });
        }
    };

    // Filtered and sorted employees
    const filteredAndSortedEmployees = useMemo(() => {
        let filtered = employees.filter(employee => {
            const searchLower = searchTerm.toLowerCase();
            return (
                employee.name.toLowerCase().includes(searchLower) ||
                employee.wallet.toLowerCase().includes(searchLower) ||
                (employee.designation?.toLowerCase().includes(searchLower)) ||
                (employee.email?.toLowerCase().includes(searchLower)) ||
                (employee.salary?.toString().includes(searchLower))
            );
        });

        return filtered.sort((a, b) => {
            let aValue: any = a[sortBy];
            let bValue: any = b[sortBy];

            // Handle undefined or null values
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';

            // Convert to string for comparison if needed
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [employees, searchTerm, sortBy, sortOrder]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedEmployees.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentEmployees = filteredAndSortedEmployees.slice(startIndex, endIndex);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleSort = (column: keyof Employee) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (column: keyof Employee) => {
        if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />;
        return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Designation', 'Email', 'Salary (USD)', 'Wallet Address'];
        const csvData = [
            headers.join(','),
            ...employees.map(emp => [
                `"${emp.name}"`,
                `"${emp.designation || ''}"`,
                `"${emp.email || ''}"`,
                `"${emp.salary || ''}"`,
                `"${emp.wallet}"`
            ].join(','))
        ].join('\\n');

        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'employee_payroll_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearSearch = () => {
        setSearchTerm('');
        searchInputRef.current?.focus();
    };

    const renderCellContent = (employee: Employee, columnKey: string) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex items-center space-x-3">
                        <div 
                            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all"
                            onClick={() => setSelectedDetailsEmployee(employee)}
                            title="View employee details"
                        >
                            {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{employee.name}</span>
                    </div>
                );
            case 'designation':
                return (
                    <span className="text-gray-600 dark:text-gray-300">
                        {employee.designation || '-'}
                    </span>
                );
            case 'email':
                return (
                    <span className="text-gray-600 dark:text-gray-300">
                        {employee.email || '-'}
                    </span>
                );
            case 'salary':
                return (
                    <span className="font-medium text-green-600 dark:text-green-400">
                        ${employee.salary || '0'}
                    </span>
                );
            case 'wallet':
                return (
                    <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                        {employee.wallet.slice(0, 6)}...{employee.wallet.slice(-4)}
                    </span>
                );
            case tokenSalaryColumnKey:
                return (
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                        {usdToToken(employee.salary || '0')} {selectedTokenSymbol}
                    </span>
                );
            case 'actions':
                return (
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditEmployee?.(employee);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Edit employee"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteEmployeeById(employee.wallet);
                            }}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete employee"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full h-full bg-transparent dark:text-white text-black shadow-sm rounded-lg overflow-hidden `}>
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 bg-transparent">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full lg:w-auto lg:flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 rounded-md border border-gray-400 dark:border-gray-600 bg-white dark:bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>

                    <div className="hidden lg:flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <select
                                id="sort-select-desktop"
                                value={sortBy ?? ''}
                                onChange={(e) => handleSort(e.target.value as keyof Employee)}
                                className="px-3 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-white dark:bg-transparent text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                aria-label="Sort by column"
                            >
                                <option value="" disabled>Sort by...</option>
                                {sortableColumns.map(col => (
                                    <option key={col.key} value={col.key}>{col.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-white dark:bg-transparent text-black dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title="Export to CSV"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-transparent overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed bg-transparent">
                        <thead className="bg-transparent">
                            <tr>
                                <th className="w-12 px-6 py-3 text-left">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        {isAllSelected ? (
                                            <CheckSquare className="h-5 w-5" />
                                        ) : isIndeterminate ? (
                                            <div className="h-5 w-5 bg-blue-600 rounded-sm flex items-center justify-center">
                                                <div className="h-2 w-2 bg-white rounded-sm"></div>
                                            </div>
                                        ) : (
                                            <Square className="h-5 w-5" />
                                        )}
                                    </button>
                                </th>
                                {allPossibleColumns.map(col => (
                                    <th 
                                        key={col.key} 
                                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-transparent ${
                                            col.key === 'name' ? 'w-1/4' : 
                                            col.key === 'designation' ? 'w-1/6' :
                                            col.key === 'email' ? 'w-1/4' :
                                            col.key === 'salary' || col.key.startsWith('salary_') ? 'w-1/6' :
                                            col.key === 'wallet' ? 'w-1/6' :
                                            col.key === 'actions' ? 'w-20' : 'w-auto'
                                        }`}
                                    >
                                        {sortableColumns.some(sortCol => sortCol.key === col.key) ? (
                                            <button
                                                onClick={() => handleSort(col.key as keyof Employee)}
                                                className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                            >
                                                <span>{col.label}</span>
                                                {getSortIcon(col.key as keyof Employee)}
                                            </button>
                                        ) : (
                                            <span>{col.label}</span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                            {currentEmployees.length === 0 ? (
                                <tr>
                                    <td 
                                        colSpan={allPossibleColumns.length + 1} 
                                        className="px-6 py-12 text-center"
                                    >
                                        <div className="text-gray-500 dark:text-gray-400">
                                            {searchTerm ? 'No employees found matching your search.' : 'No employees added yet.'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentEmployees.map((employee, index) => (
                                    <motion.tr
                                        key={employee.wallet}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                                            selectedEmployees.includes(employee.wallet)
                                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                                : ''
                                        }`}
                                        onClick={() => toggleEmployeeSelection(employee.wallet)}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => toggleEmployeeSelection(employee.wallet)}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                {selectedEmployees.includes(employee.wallet) ? (
                                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <Square className="h-5 w-5" />
                                                )}
                                            </button>
                                        </td>
                                        {allPossibleColumns.map(col => (
                                            <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                                {renderCellContent(employee, col.key)}
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedEmployees.length)} of {filteredAndSortedEmployees.length} employees
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Pay Selected Button - Bottom Right */}
            {selectedEmployees.length > 0 && (
                <div className="flex justify-end mt-4">
                    <motion.div
                        className="w-auto"
                        whileHover={{ scale: selectedEmployees.length > 0 && !isLoadingDerived ? 1.02 : 1.0 }}
                        whileTap={{ scale: selectedEmployees.length > 0 && !isLoadingDerived ? 0.98 : 1.0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button
                            onClick={handleTransaction}
                            disabled={isLoadingDerived || selectedEmployees.length === 0 || isLoading}
                            className={`px-6 py-3 rounded-xl font-medium text-base transition-all flex items-center justify-center gap-3
                                ${isLoadingDerived || selectedEmployees.length === 0 || isLoading
                                    ? 'bg-gray-300 dark:bg-gray-900/50 text-gray-500 dark:text-gray-300 cursor-not-allowed border border-gray-400 dark:border-gray-600'
                                    : 'bg-gradient-to-r from-[#4890e9] to-[#3b82f6] text-white hover:from-[#3b82f6] hover:to-[#2563eb] shadow-lg shadow-[#3b82f6]/20 hover:shadow-[#3b82f6]/30'
                                }`}
                        >
                            <DollarSign className="w-5 h-5" />
                            <span>
                                {isApproving
                                    ? `Approving ${selectedTokenSymbol || selectedToken?.symbol}...`
                                    : isSending || isWritePending || isTxLoading
                                        ? 'Processing...'
                                        : selectedEmployees.length === 0
                                            ? 'Select Employees'
                                            : needsApproval && selectedToken?.address !== 'NATIVE_ADDRESS'
                                                ? `Approve & Send`
                                                : `Pay Selected (${selectedEmployees.length})`}
                            </span>
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Employee Details Modal */}
            {selectedDetailsEmployee && (
                <EmployeeDetailsModal
                    employee={selectedDetailsEmployee}
                    isOpen={!!selectedDetailsEmployee}
                    onClose={() => setSelectedDetailsEmployee(null)}
                />
            )}
        </div>
    );
};

export default EmployeeTable2;