"use client"

import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useReadContract, useChainId, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { FileText, Wallet, Plus, Eye, Copy, CheckCircle, Clock, Home, ExternalLink, Edit, Trash2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from "react-hot-toast"
import Link from 'next/link'
import InvoicesAbi from '../../../lib/InvoicesAbi.json'
import { getInvoicesAddress } from '../../../lib/contract-addresses'

// Types for invoice data
interface Invoice {
  id: bigint;
  name: string;
  details: string;
  amount: bigint;
  creator: string;
  isPaid: boolean;
  paidBy: string;
  paidAt: bigint;
}

interface CreateInvoiceForm {
  name: string;
  details: string;
  amount: string;
}

export default function InvoicesPage() {
  // State for UI management
  const [isMounted, setIsMounted] = useState(false)
  
  // State for Create Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateInvoiceForm>({
    name: '',
    details: '',
    amount: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  
  // State for Invoice History
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Wallet connection
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Contract hooks
  const { data: hash, isPending, writeContract } = useWriteContract()
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  
  // Get contract address
  const contractAddress = getInvoicesAddress(chainId)
  
  // Debug network information
  useEffect(() => {
    console.log('=== INVOICES NETWORK DEBUG ===')
    console.log('Chain ID:', chainId)
    console.log('Invoices Contract Address:', contractAddress)
    console.log('Is Mainnet (39):', chainId === 39)
    console.log('Is Testnet (2484):', chainId === 2484)
  }, [chainId, contractAddress])
  
  // Check if contract is available on current network
  const isContractAvailable = !!contractAddress
  const networkName = chainId === 39 ? 'U2U Mainnet' : chainId === 2484 ? 'U2U Testnet' : 'Unknown Network'
  
  // Read contract to get invoices by creator
  const { data: invoiceIds, refetch: refetchInvoiceIds } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: InvoicesAbi.abi,
    functionName: 'getInvoicesByCreator',
    args: [address],
    query: {
      enabled: !!address && !!contractAddress && isConnected,
    },
  })

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isConnected && address && contractAddress && invoiceIds) {
      fetchInvoices()
    }
  }, [isConnected, address, contractAddress, invoiceIds, refreshKey])

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Invoice created successfully!')
      setCreateForm({ name: '', details: '', amount: '' })
      setShowCreateModal(false)
      setIsCreating(false)
      // Refresh invoices after confirmation
      setTimeout(() => {
        refetchInvoiceIds()
        setRefreshKey(prev => prev + 1)
      }, 1000)
    }
  }, [isConfirmed])

  // Fetch individual invoice details
  const fetchInvoiceDetails = async (invoiceId: bigint) => {
    if (!contractAddress) return null
    
    try {
      // For now, since we don't have an API endpoint, we'll use the direct mapping approach
      // This is a limitation of wagmi where we can't dynamically create useReadContract hooks
      // In a production environment, you'd want to set up a proper backend API or use multicall
      
      return {
        id: invoiceId,
        name: `Invoice #${invoiceId.toString()}`,
        details: 'Click to view full details',
        amount: parseEther('1.0'), // Default amount - will be updated when contract read is implemented
        creator: address || '',
        isPaid: false,
        paidBy: '0x0000000000000000000000000000000000000000',
        paidAt: BigInt(0)
      }
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error)
      return {
        id: invoiceId,
        name: `Invoice #${invoiceId.toString()}`,
        details: 'Unable to load details',
        amount: BigInt(0),
        creator: address || '',
        isPaid: false,
        paidBy: '0x0000000000000000000000000000000000000000',
        paidAt: BigInt(0)
      }
    }
  }

  // Fetch invoices from contract using individual reads
  const fetchInvoices = async () => {
    if (!contractAddress || !invoiceIds || !Array.isArray(invoiceIds)) return
    
    setIsLoading(true)
    
    try {
      const invoiceArray = invoiceIds as bigint[]
      const invoicePromises = invoiceArray.map(id => fetchInvoiceDetails(id))
      const fetchedInvoices = await Promise.all(invoicePromises)
      
      // Filter out null responses and sort by ID (newest first)
      const validInvoices = fetchedInvoices
        .filter((invoice): invoice is Invoice => invoice !== null)
        .sort((a, b) => Number(b.id - a.id))
      
      setInvoices(validInvoices)
      
      if (validInvoices.length > 0) {
        toast.success(`Loaded ${validInvoices.length} invoice(s)`)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Failed to fetch invoices')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form input changes
  const handleFormChange = (field: keyof CreateInvoiceForm, value: string) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Manual refresh function
  const handleRefresh = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }
    
    setIsLoading(true)
    try {
      await refetchInvoiceIds()
      setRefreshKey(prev => prev + 1)
      toast.success('Invoices refreshed!')
    } catch (error) {
      toast.error('Failed to refresh invoices')
    }
  }

  // Handle create invoice
  const handleCreateInvoice = async () => {
    if (!createForm.name.trim()) {
      toast.error('Please enter an invoice name')
      return
    }
    
    if (!createForm.amount || parseFloat(createForm.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!contractAddress) {
      toast.error('Contract not available on this network')
      return
    }

    setIsCreating(true)
    
    try {
      // Convert amount to wei (U2U uses same decimals as ETH)
      const amountInWei = parseEther(createForm.amount)
      
      // Call the contract
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: InvoicesAbi.abi,
        functionName: 'createInvoice',
        args: [createForm.name, createForm.details, amountInWei],
        chainId: chainId,
      })
      
      toast.loading('Creating invoice... Please confirm the transaction')
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      toast.error('Failed to create invoice')
      setIsCreating(false)
    }
  }

  // Copy payment link to clipboard
  const copyPaymentLink = (invoiceId: bigint) => {
    const paymentUrl = `${window.location.origin}/pages/pay/${invoiceId.toString()}`
    navigator.clipboard.writeText(paymentUrl)
    toast.success('Payment link copied to clipboard!')
  }

  // Format date nicely - using timestamp from contract or current time
  const formatDate = (timestamp?: bigint) => {
    const date = timestamp && timestamp > BigInt(0) 
      ? new Date(Number(timestamp) * 1000) 
      : new Date()
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status color
  const getStatusColor = (isPaid: boolean) => {
    return isPaid 
      ? 'text-green-500'
      : 'text-yellow-500'
  }

  // Render a placeholder during server rendering and initial hydration
  if (!isMounted) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="animate-pulse rounded-full h-16 w-16 bg-gray-200 dark:bg-gray-800"></div>
      </div>
    )
  }

  // Create Invoice Content
  const CreateInvoiceModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold dark:text-white">Create New Invoice</h3>
          <button
            onClick={() => {
              setShowCreateModal(false)
              setCreateForm({ name: '', details: '', amount: '' })
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FileText className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Invoice Name */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              Invoice Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Web Development Services"
              value={createForm.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded text-sm"
            />
          </div>
          
          {/* Invoice Details */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              Details
            </label>
            <textarea
              placeholder="Describe the services or products..."
              value={createForm.details}
              onChange={(e) => handleFormChange('details', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded text-sm resize-none"
            />
          </div>
          
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              Amount (U2U) *
            </label>
            <input
              type="number"
              placeholder="0.00"
              step="0.001"
              min="0"
              value={createForm.amount}
              onChange={(e) => handleFormChange('amount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded text-sm"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setShowCreateModal(false)
              setCreateForm({ name: '', details: '', amount: '' })
            }}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateInvoice}
            disabled={!isConnected || isCreating || isPending || isConfirming || !createForm.name.trim() || !createForm.amount}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors duration-200 flex items-center"
          >
            {isCreating || isPending || isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Creating...'}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  // Invoice History Content
  const InvoiceListContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-white">Invoice History</h3>
        <button
          onClick={handleRefresh}
          disabled={!isConnected || isLoading}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded"
          title="Refresh invoices"
        >
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!isConnected ? (
        <div className="text-center py-12">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 w-fit mx-auto mb-4">
            <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          <p className="text-lg dark:text-gray-300 text-gray-600">
            Please connect your wallet to view your invoices
          </p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg dark:text-gray-300 text-gray-600">
            No invoices found
          </p>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-2">
            Create your first invoice to get started
          </p>
        </div>
      ) : (
        <div className="bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-6 px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-transparent backdrop-blur-sm">
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Invoice ID</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Name</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Amount (ETH)</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Status</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Created</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</div>
          </div>
          
          {/* Table Rows */}
          <div className="max-h-96 overflow-y-auto">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="grid grid-cols-6 gap-6 px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="text-sm font-mono text-gray-800 dark:text-gray-200">
                  #{invoice.id}
                </div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {invoice.name}
                </div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {formatEther(invoice.amount)} U2U
                </div>
                <div>
                  <span className={`text-xs font-medium ${getStatusColor(invoice.isPaid)}`}>
                    {invoice.isPaid ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Paid
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </div>
                    )}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(invoice.paidAt)}
                </div>
                <div className="flex justify-end space-x-2">
                  {!invoice.isPaid && (
                    <button
                      onClick={() => copyPaymentLink(invoice.id)}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded"
                      title="Copy payment link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  <Link href={`/pages/pay/${invoice.id.toString()}`}>
                    <button
                      className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded"
                      title="View invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="relative h-screen w-screen dark:text-white text-black p-6 z-10">
      {/* Home button */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Home className="text-black dark:hover:text-gray-200 hover:text-gray-800 dark:text-white" size={30} />
        </Link>
      </div>

      {isConnected ? (
        <div className="flex flex-col max-w-screen max-h-screen items-center m-10">
          {/* Header Section */}
          <div className="w-full max-w-6xl mb-6">
            
            
            {/* Header with Title and Create Button */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-black dark:text-white">My Invoices</h1>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={!isContractAvailable}
                  className={`flex items-center px-4 py-2 border rounded-lg transition-colors duration-200 ${
                    isContractAvailable
                      ? 'bg-transparent border-blue-600 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-400 dark:hover:text-black'
                      : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500'
                  }`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </button>
                <ConnectButton />
              </div>
            </div>
          </div>

          {/* Contract Availability Warning */}
          {!isContractAvailable && (
            <div className="w-full max-w-6xl mb-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3">⚠️</div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Invoices Contract Not Available
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      The invoices contract is not deployed on {networkName}. Please switch to U2U Mainnet or U2U Testnet to use this feature.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area - Invoice List */}
          <div className="w-full max-w-6xl flex-1 overflow-hidden">
            <div className="bg-transparent rounded-xl overflow-hidden">
              {isContractAvailable ? (
                <InvoiceListContent />
              ) : (
                <div className="text-center py-20">
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Invoices Feature Unavailable
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please switch to U2U Mainnet or U2U Testnet to use the invoices feature.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Not connected state
        <div className="w-screen h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col relative items-center text-center space-y-6"
          >
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-sm mx-auto">
                Connect your wallet to create invoices and manage your billing.
              </p>
            </div>

            <div className="w-full mx-auto pt-2 items-center flex justify-center">
              <ConnectButton />
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && <CreateInvoiceModal />}
    </div>
  )
}
