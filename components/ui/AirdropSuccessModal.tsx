"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Copy, ExternalLink, Gift, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AirdropSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  transactionHash: string
  totalAmount: string
  recipientCount: number
  tokenSymbol: string
  explorerUrl?: string
}

const AirdropSuccessModal: React.FC<AirdropSuccessModalProps> = ({
  isOpen,
  onClose,
  transactionHash,
  totalAmount,
  recipientCount,
  tokenSymbol,
  explorerUrl
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-black rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Airdrop Sent Successfully!
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Animation */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4"
              >
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your airdrop has been successfully distributed to all recipients on the Flow blockchain.
              </p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Airdrop Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {totalAmount} {tokenSymbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recipients</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {recipientCount} addresses
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
                  Transaction Hash
                </p>
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded border p-2">
                  <code className="text-sm font-mono text-gray-600 dark:text-gray-300">
                    {formatHash(transactionHash)}
                  </code>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => copyToClipboard(transactionHash, 'Transaction hash')}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Copy transaction hash"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {explorerUrl && (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="View on block explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Transaction
                </a>
              )}
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AirdropSuccessModal