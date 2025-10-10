import React from 'react';
import { CheckCircle, X, ExternalLink } from 'lucide-react';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash: string;
  transactionType: 'payroll' | 'bulk';
  totalAmount: string;
  recipientCount: number;
  tokenSymbol: string;
  explorerUrl: string;
  selectedRecipients?: Array<{ name: string; amount: string }>;
}

const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({
  isOpen,
  onClose,
  transactionHash,
  transactionType,
  totalAmount,
  recipientCount,
  tokenSymbol,
  explorerUrl,
  selectedRecipients = []
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    return transactionType === 'payroll' 
      ? 'Payroll Payment Successful!' 
      : 'Bulk Disbursement Successful!';
  };

  const getDescription = () => {
    return transactionType === 'payroll'
      ? 'Your payroll payments have been successfully processed and sent to the blockchain.'
      : 'Your bulk disbursement has been successfully processed and sent to the blockchain.';
  };

  const formatTransactionHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full mx-auto border border-gray-200/50 dark:border-gray-700/50 animate-fade-in">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Success icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Title and description */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {getTitle()}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {getDescription()}
              </p>
            </div>

            {/* Transaction details */}
            <div className="space-y-4 mb-8">
              {/* Transaction hash */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transaction Hash
                  </p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {formatTransactionHash(transactionHash)}
                  </p>
                </div>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  <span className="text-sm font-medium">View</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Payment summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Amount
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {totalAmount} {tokenSymbol}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipients
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {recipientCount}
                  </p>
                </div>
              </div>

              {/* Recipient list (if provided and not too many) */}
              {selectedRecipients.length > 0 && selectedRecipients.length <= 5 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Payment Recipients
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedRecipients.map((recipient, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {recipient.name}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {recipient.amount} {tokenSymbol}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 text-center flex items-center justify-center space-x-2"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSuccessModal;