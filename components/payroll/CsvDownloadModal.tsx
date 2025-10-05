"use client";

import React from 'react';
import { X, Download, ArrowRight } from 'lucide-react';
import { Employee } from '@/lib/interfaces';

interface CsvDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onContinue: () => void;
  selectedEmployees: Employee[];
  selectedToken: any;
  totalAmount: string;
}

export const CsvDownloadModal: React.FC<CsvDownloadModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  onContinue,
  selectedEmployees,
  selectedToken,
  totalAmount
}) => {
  if (!isOpen) return null;

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(4);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Download Payment Record
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Would you like to download a CSV file for your records before processing the payment?
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Employees:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedEmployees.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Token:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedToken?.symbol || 'U2U'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatAmount(totalAmount)} {selectedToken?.symbol || 'U2U'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Download CSV button */}
          <button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV & Continue
          </button>

          {/* Continue without download button */}
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Continue to Pay
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          CSV file will contain employee details, amounts, and payment information
        </p>
      </div>
    </div>
  );
};