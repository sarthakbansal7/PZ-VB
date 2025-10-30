"use client"

import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useReadContract, useChainId, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { FileText, Wallet, Plus, Eye, Copy, CheckCircle, Clock, Home, ExternalLink, Edit, Trash2, RefreshCw, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from "react-hot-toast"
import Link from 'next/link'
import { PaymentConfigProvider, usePaymentConfig } from '@/context/paymentConfigContext'
import ConfigurePayModal from '@/components/payroll/ConfigurePayModal'
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

function InvoicesPageContent() {
  // State for UI management
  const [isMounted, setIsMounted] = useState(false)
  
  // State for Create Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateInvoiceForm>({
    name: '',
    details: '',
    amount: ''
  })
  // Individual state variables for form fields (like streaming page)
  const [invoiceName, setInvoiceName] = useState<string>('')
  const [invoiceDetails, setInvoiceDetails] = useState<string>('')
  const [invoiceAmount, setInvoiceAmount] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  
  // State for Invoice History
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Payment configuration context
  const { 
    config: paymentConfig, 
    updateConfig, 
    showConfigModal, 
    setShowConfigModal 
  } = usePaymentConfig();
  
  // Wallet connection
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Contract hooks
  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract()
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })
  
  // Get contract address
  const contractAddress = getInvoicesAddress(chainId)
  // Wagmi public client (viem-backed) for readContract and lower-level access
  const publicClient = usePublicClient()
  
  // Debug network information
  useEffect(() => {
    console.log('=== INVOICES NETWORK DEBUG ===')
    console.log('Chain ID:', chainId)
    console.log('Invoices Contract Address:', contractAddress)
    console.log('Is Flow Mainnet (747):', chainId === 747)
    console.log('Is Flow Testnet (545):', chainId === 545)
  }, [chainId, contractAddress])
  
  // Check if contract is available on current network
  const isContractAvailable = !!contractAddress
  const networkName = chainId === 747 ? 'Flow EVM Mainnet' : chainId === 545 ? 'Flow EVM Testnet' : 'Unknown Network'
  
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
      // Reset individual form fields
      setInvoiceName('')
      setInvoiceDetails('')
      setInvoiceAmount('')
      setShowCreateModal(false)
      setIsCreating(false)
      // Refresh invoices after confirmation
      setTimeout(() => {
        refetchInvoiceIds()
        setRefreshKey(prev => prev + 1)
      }, 1000)
    }
  }, [isConfirmed, refetchInvoiceIds])

  // Handle write contract errors (user rejection, insufficient funds, etc.)
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError)
      setIsCreating(false)
      
      // Handle specific error types
      if (writeError.message.includes('User rejected')) {
        toast.error('Transaction cancelled by user')
      } else if (writeError.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction')
      } else {
        toast.error('Transaction failed: ' + writeError.message)
      }
    }
  }, [writeError])

  // Handle transaction receipt errors
  useEffect(() => {
    if (receiptError) {
      console.error('Transaction receipt error:', receiptError)
      setIsCreating(false)
      toast.error('Transaction failed to complete')
    }
  }, [receiptError])

  // Reset creating state when transaction is no longer pending and not confirmed
  useEffect(() => {
    if (!isPending && !isConfirming && !isConfirmed && isCreating && !hash) {
      // Transaction was cancelled or failed before getting a hash
      setIsCreating(false)
    }
  }, [isPending, isConfirming, isConfirmed, isCreating, hash])

  // Fetch individual invoice details
  const fetchInvoiceDetails = async (invoiceId: bigint) => {
    if (!contractAddress) return null
    try {
      // First try using the viem-backed public client (recommended)
      if (publicClient && typeof (publicClient as any).readContract === 'function') {
        // First try the public mapping getter 'invoices' (auto-generated getter)
        try {
          const result: any = await (publicClient as any).readContract({
            address: contractAddress as `0x${string}`,
            abi: InvoicesAbi.abi,
            functionName: 'invoices',
            args: [invoiceId],
          })

          // If successful, it's usually an array-like tuple with the struct fields
          return {
            id: result[0] as bigint,
            name: result[1] as string,
            details: result[2] as string,
            amount: result[3] as bigint,
            creator: result[4] as string,
            isPaid: result[5] as boolean,
            paidBy: result[6] as string,
            paidAt: result[7] as bigint,
          }
        } catch (e) {
          console.debug('publicClient.readContract(invoices) failed, trying getInvoice', e)
        }

        // Fallback: try getInvoice (some ABIs return a tuple wrapped as a single output)
        try {
          const result2: any = await (publicClient as any).readContract({
            address: contractAddress as `0x${string}`,
            abi: InvoicesAbi.abi,
            functionName: 'getInvoice',
            args: [invoiceId],
          })

          // viem may return a struct as a single array or object; normalize
          const r = Array.isArray(result2) && result2.length > 1 ? result2 : result2[0] ?? result2
          return {
            id: r[0] as bigint,
            name: r[1] as string,
            details: r[2] as string,
            amount: r[3] as bigint,
            creator: r[4] as string,
            isPaid: r[5] as boolean,
            paidBy: r[6] as string,
            paidAt: r[7] as bigint,
          }
        } catch (e) {
          console.debug('publicClient.readContract(getInvoice) failed, will use ethers fallback', e)
        }
      }

      throw new Error('publicClient not available')
    } catch (viemError) {
      console.warn('viem readContract failed, attempting ethers fallback decode', viemError)

      try {
        // Dynamically import ethers to avoid top-level bundling issues
        const ethers = await import('ethers')

        // Build an ethers provider from the publicClient transport URL if available
        const transportUrl = (publicClient as any)?.transport?.url
        const provider = transportUrl ? new ethers.JsonRpcProvider(transportUrl) : new ethers.JsonRpcProvider()

        const iface = new ethers.Interface(InvoicesAbi.abi as any)
        const calldata = iface.encodeFunctionData('getInvoice', [invoiceId])

        const raw = await provider.call({ to: contractAddress as `0x${string}`, data: calldata })
        console.debug('ethers fallback raw call data:', raw)

        let decoded: any
        try {
          decoded = iface.decodeFunctionResult('getInvoice', raw)
        } catch (dErr) {
          console.debug('ethers decode getInvoice failed, trying alternative signature', dErr)
          // Try decoding as if the function returned a single tuple (some ABIs encode like this)
          try {
            const altIface = new ethers.Interface([
              'function getInvoice(uint256) view returns (tuple(uint256 id,string name,string details,uint256 amount,address creator,bool isPaid,address paidBy,uint256 paidAt))'
            ])
            decoded = altIface.decodeFunctionResult('getInvoice', raw)
            // If decoded is a single-element array wrapping the tuple, unwrap
            if (Array.isArray(decoded) && decoded.length === 1) decoded = decoded[0]
          } catch (altErr) {
            console.error('ethers alternative decode also failed', altErr)
            throw altErr
          }
        }

        return {
          id: decoded[0] as bigint,
          name: decoded[1] as string,
          details: decoded[2] as string,
          amount: decoded[3] as bigint,
          creator: decoded[4] as string,
          isPaid: decoded[5] as boolean,
          paidBy: decoded[6] as string,
          paidAt: decoded[7] as bigint,
        }
      } catch (ethersError) {
        console.error(`Both viem and ethers fallback failed for invoice ${invoiceId.toString()}:`, ethersError)
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
       // toast.success(`Loaded ${validInvoices.length} invoice(s)`)
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
    if (!invoiceName.trim()) {
      toast.error('Please enter an invoice name')
      return
    }
    
    if (!invoiceAmount || parseFloat(invoiceAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!contractAddress) {
      toast.error('Contract not available on this network')
      return
    }

    setIsCreating(true)
    
    try {
      // Convert amount to wei (FLOW uses same decimals as ETH)
      const amountInWei = parseEther(invoiceAmount)
      
      // Call the contract
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: InvoicesAbi.abi,
        functionName: 'createInvoice',
        args: [invoiceName, invoiceDetails, amountInWei],
        chainId: chainId,
      })
      
      // Note: Loading state is handled by the button's disabled state and text
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      toast.error('Failed to create invoice')
      setIsCreating(false)
    }
  }

  // Copy payment link to clipboard
  const copyPaymentLink = (invoiceId: bigint) => {
    // Add network suffix: 'm' for mainnet (747), 't' for testnet (545)
    const networkSuffix = chainId === 747 ? 'm' : chainId === 545 ? 't' : 't' // default to testnet
    const paymentUrl = `${window.location.origin}/pages/pay/${invoiceId.toString()}${networkSuffix}`
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

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Address copied to clipboard!')
    }).catch(err => {
      console.error('Failed to copy address: ', err)
      toast.error('Failed to copy address')
    })
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
              setInvoiceName('')
              setInvoiceDetails('')
              setInvoiceAmount('')
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
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400/60 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          
          {/* Invoice Details */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              Details
            </label>
            <textarea
              placeholder="Describe the services or products..."
              value={invoiceDetails}
              onChange={(e) => setInvoiceDetails(e.target.value)}
              rows={3}
             className="w-full px-3 py-2 border border-gray-400/60 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              Amount (FLOW) *
            </label>
            <input
              type="number"
              placeholder="0.00"
              step="0.001"
              min="0"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400/60 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setShowCreateModal(false)
              setCreateForm({ name: '', details: '', amount: '' })
              setInvoiceName('')
              setInvoiceDetails('')
              setInvoiceAmount('')
            }}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateInvoice}
            disabled={!isConnected || isCreating || isPending || isConfirming || !invoiceName.trim() || !invoiceAmount}
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
          <div className="grid grid-cols-8 gap-6 px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-transparent backdrop-blur-sm">
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Invoice ID</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Name</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Details</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Amount (FLOW)</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Status</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Payee</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Payment Date</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</div>
          </div>
          
          {/* Table Rows */}
          <div className="max-h-96 overflow-y-auto">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="grid grid-cols-8 gap-6 px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="text-sm font-mono text-gray-800 dark:text-gray-200">#22018{invoice.id}</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{invoice.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{invoice.details}</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatEther(invoice.amount)} FLOW</div>
                <div>
                  <span className={`text-xs font-medium ${getStatusColor(invoice.isPaid)}`}>
                    {invoice.isPaid ? (
                      <div className="flex items-center"><CheckCircle className="h-3 w-3 mr-1" />Paid</div>
                    ) : (
                      <div className="flex items-center"><Clock className="h-3 w-3 mr-1" />Pending</div>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {invoice.isPaid ? (
                    <>
                      <span className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                        {formatAddress(invoice.paidBy)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(invoice.paidBy);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded"
                        title="Copy full address"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-800 dark:text-gray-200 font-mono">Pending</span>
                  )}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {invoice.isPaid && invoice.paidAt && invoice.paidAt > BigInt(0) ? (
                    formatDate(invoice.paidAt)
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  {!invoice.isPaid && (
                    <button onClick={() => copyPaymentLink(invoice.id)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded" title="Copy payment link">
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  <Link href={`/pages/pay/${invoice.id.toString()}${chainId === 747 ? 'm' : chainId === 545 ? 't' : 't'}`}>
                    <button className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded" title="View invoice">
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
    <div className="w-full dark:text-white text-black">
      {isConnected ? (
        <div className="flex flex-col items-center px-2 sm:px-4 py-4 min-h-full">
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
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale:0.98 }}
                  onClick={() => setShowConfigModal(true)}
                  className="relative py-2 px-3 lg:py-2.5 lg:px-4 rounded-lg backdrop-blur-md bg-gray-200/30 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-300/40 dark:hover:bg-gradient-to-r dark:hover:from-gray-600/30 dark:hover:to-gray-700/30 hover:border-gray-400/60 dark:hover:border-white/30 flex items-center justify-center gap-2"
                  title="Configure Payments"
                >
                  <Settings className="h-4 w-4 lg:h-5 lg:w-5 text-black dark:text-white" />
                  <span className="hidden lg:inline font-medium text-sm whitespace-nowrap text-black dark:text-white">Configure</span>
                </motion.button>
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
                      The invoices contract is not deployed on {networkName}. Please switch to Flow EVM Mainnet or Flow EVM Testnet to use this feature.
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
                    Please switch to Flow EVM Mainnet or Flow EVM Testnet to use the invoices feature.
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
              <div className="connect-button-light">
                <ConnectButton />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Configure Payment Modal */}
      {showConfigModal && (
        <ConfigurePayModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onExchangeRateUpdate={(rate: number, tokenSymbol: string) => {
            updateConfig({
              exchangeRate: rate,
              selectedTokenSymbol: tokenSymbol,
            });
            // Configuration updated silently
          }}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && <CreateInvoiceModal />}
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <PaymentConfigProvider>
      <InvoicesPageContent />
    </PaymentConfigProvider>
  )
}
