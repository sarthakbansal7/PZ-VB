"use client"

import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { Wallet, Gift, Coins, Plus, Minus, RefreshCw, Home, ExternalLink, Upload, Download, Edit, Trash2, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from "react-hot-toast"
import Link from 'next/link'
import { PaymentConfigProvider, usePaymentConfig } from '@/context/paymentConfigContext'
import ConfigurePayModal from '@/components/payroll/ConfigurePayModal'
import { getAirdropAddress, NATIVE_TOKEN_ADDRESS } from '@/lib/contract-addresses'
import airdropAbi from '@/lib/AirdropAbi.json'

// Types for airdrop data
interface AirdropRecipient {
  address: string;
  amount: string;
}

interface CustomToken {
  symbol: string;
  address: string;
}

interface ClaimableAirdrop {
  token: string;
  tokenSymbol: string;
  amount: string;
  rawAmount: bigint;
}

interface CreatedAirdrop {
  airdropId: string;
  token: string;
  tokenSymbol: string;
  totalAmount: string;
  recipientCount: number;
  createdAt: string;
  status: string;
  transactionHash?: string;
}

function AirdropPage() {
  // State for tab management
  const [activeTab, setActiveTab] = useState('create')
  const [isMounted, setIsMounted] = useState(false)
  
  // State for Create Airdrop tab
  const [selectedToken, setSelectedToken] = useState<string>('U2U')
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([])
  const [showCustomTokenModal, setShowCustomTokenModal] = useState(false)
  const [recipients, setRecipients] = useState<AirdropRecipient[]>([]) // Start with empty array
  const [totalAmount, setTotalAmount] = useState<string>('0')
  const [isCreating, setIsCreating] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  
  // State for Claim Airdrop tab
  const [claimableAirdrops, setClaimableAirdrops] = useState<ClaimableAirdrop[]>([])
  const [isCheckingClaims, setIsCheckingClaims] = useState(false)
  
  // State for Created Airdrops (History)
  const [createdAirdrops, setCreatedAirdrops] = useState<CreatedAirdrop[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
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
  const { writeContractAsync } = useWriteContract()
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>()
  
  // Get airdrop contract address for current network
  const airdropContractAddress = getAirdropAddress(chainId)
  
  // Debug network information
  useEffect(() => {
    console.log('=== AIRDROP NETWORK DEBUG ===')
    console.log('Chain ID:', chainId)
    console.log('Airdrop Contract Address:', airdropContractAddress)
    console.log('Is Mainnet (39):', chainId === 39)
    console.log('Is Testnet (2484):', chainId === 2484)
  }, [chainId, airdropContractAddress])

  // Check if contract is available on current network
  const isContractAvailable = !!airdropContractAddress
  const networkName = chainId === 39 ? 'U2U Mainnet' : chainId === 2484 ? 'U2U Testnet' : 'Unknown Network'

  // Read native token claimable amount
  const { data: nativeClaimableAmount, refetch: refetchNative } = useReadContract({
    address: airdropContractAddress as `0x${string}`,
    abi: airdropAbi.abi,
    functionName: 'getClaimableETH',
    args: address ? [address] : undefined,
    chainId: chainId,
    query: {
      enabled: !!address && !!airdropContractAddress,
    }
  })

  // Helper functions
  const getTokenAddress = (tokenSymbol: string): string => {
    if (tokenSymbol === 'U2U') {
      return NATIVE_TOKEN_ADDRESS
    }
    const customToken = customTokens.find(token => token.symbol === tokenSymbol)
    return customToken?.address || NATIVE_TOKEN_ADDRESS
  }

  const getTokenSymbol = (tokenAddress: string): string => {
    if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
      return 'U2U'
    }
    const customToken = customTokens.find(token => token.address.toLowerCase() === tokenAddress.toLowerCase())
    return customToken?.symbol || 'Unknown'
  }

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
    if (isConnected && address) {
      fetchAirdropHistory()
      fetchClaimableAirdrops()
    }
  }, [isConnected, address])

  // Update claimable airdrops when native amount changes
  useEffect(() => {
    if (nativeClaimableAmount !== undefined) {
      const newClaimableAirdrops: ClaimableAirdrop[] = []
      
      if (nativeClaimableAmount && BigInt(nativeClaimableAmount as any) > BigInt(0)) {
        newClaimableAirdrops.push({
          token: NATIVE_TOKEN_ADDRESS,
          tokenSymbol: 'U2U',
          amount: formatUnits(nativeClaimableAmount as bigint, 18),
          rawAmount: nativeClaimableAmount as bigint,
        })
      }
      
      setClaimableAirdrops(newClaimableAirdrops)
    }
  }, [nativeClaimableAmount])

  // Calculate total amount when recipients change
  useEffect(() => {
    const total = recipients.reduce((sum, recipient) => {
      const amount = parseFloat(recipient.amount) || 0;
      return sum + amount;
    }, 0);
    setTotalAmount(total.toFixed(6));
  }, [recipients]);

  // Mock function to fetch airdrop history
  const fetchAirdropHistory = async () => {
    setIsLoadingHistory(true)
    
    setTimeout(() => {
      const mockHistory: CreatedAirdrop[] = [
        {
          airdropId: 'AIR001',
          token: '0x0000000000000000000000000000000000000000',
          tokenSymbol: 'ETH',
          totalAmount: '2.5',
          recipientCount: 5,
          createdAt: new Date().toISOString(),
          status: 'completed',
          transactionHash: '0x1234567890abcdef1234567890abcdef12345678'
        },
        {
          airdropId: 'AIR002',
          token: '0xA0b86a33E6441a0e3Ce4C3C9eBDfEb5c45Dd6aF9',
          tokenSymbol: 'USDC',
          totalAmount: '1000.0',
          recipientCount: 10,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending'
        }
      ]
      setCreatedAirdrops(mockHistory)
      setIsLoadingHistory(false)
    }, 1000)
  }

  // Fetch claimable airdrops from smart contract
  const fetchClaimableAirdrops = async () => {
    if (!isConnected || !address || !airdropContractAddress) {
      setClaimableAirdrops([])
      return
    }

    setIsCheckingClaims(true)
    
    try {
      const claimableAirdrops: ClaimableAirdrop[] = []

      // Refetch native amount
      const { data: nativeAmount } = await refetchNative()

      if (nativeAmount && BigInt(nativeAmount as any) > BigInt(0)) {
        claimableAirdrops.push({
          token: NATIVE_TOKEN_ADDRESS,
          tokenSymbol: 'U2U',
          amount: formatUnits(nativeAmount as bigint, 18),
          rawAmount: nativeAmount as bigint,
        })
      }

      // For custom tokens, we'll need to make separate calls
      // This is a simplified version - in a real app you might want to batch these calls
      for (const customToken of customTokens) {
        try {
          // Note: This is a simplified approach. In production, you'd want to use a multicall
          // or create separate useReadContract hooks for each token
          console.log(`Checking claimable amount for ${customToken.symbol} at ${customToken.address}`)
        } catch (error) {
          console.error(`Error fetching claimable amount for ${customToken.symbol}:`, error)
        }
      }

      setClaimableAirdrops(claimableAirdrops)
      
    } catch (error) {
      console.error('Error fetching claimable airdrops:', error)
      toast.error('Failed to fetch claimable airdrops')
    } finally {
      setIsCheckingClaims(false)
    }
  }

  // Add new recipient
  const addRecipient = () => {
    setRecipients([...recipients, { address: '', amount: '' }])
  }

  // Remove recipient
  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index))
    }
  }

  // Update recipient data
  const updateRecipient = (index: number, field: 'address' | 'amount', value: string) => {
    const updatedRecipients = [...recipients]
    updatedRecipients[index][field] = value
    setRecipients(updatedRecipients)
  }

  // Handle airdrop creation
  const handleCreateAirdrop = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!airdropContractAddress) {
      toast.error('Airdrop contract not available on this network')
      return
    }

    // Validate inputs
    const validRecipients = recipients.filter(r => r.address && r.amount && parseFloat(r.amount) > 0)
    if (validRecipients.length === 0) {
      toast.error('Please add at least one recipient with valid address and amount')
      return
    }

    try {
      setIsCreating(true)
      
      // Prepare contract parameters
      const tokenAddress = getTokenAddress(selectedToken)
      const recipientAddresses = validRecipients.map(r => r.address as `0x${string}`)
      const amounts = validRecipients.map(r => parseUnits(r.amount, 18)) // Assuming 18 decimals
      
      // Calculate total amount for native token
      const totalNativeAmount = tokenAddress === NATIVE_TOKEN_ADDRESS 
        ? amounts.reduce((sum, amount) => sum + amount, BigInt(0))
        : BigInt(0)

      console.log('Sending airdrop transaction:', {
        tokenAddress,
        recipientAddresses,
        amounts: amounts.map(a => a.toString()),
        totalNativeAmount: totalNativeAmount.toString()
      })

      // Call smart contract
      const txHash = await writeContractAsync({
        address: airdropContractAddress as `0x${string}`,
        abi: airdropAbi.abi,
        functionName: 'sendAirdrop',
        args: [tokenAddress, recipientAddresses, amounts],
        value: totalNativeAmount,
        chainId: chainId,
      })

      setPendingTxHash(txHash)
      toast.success(`Airdrop transaction sent! Hash: ${txHash}`)
      
      // Reset form
      setRecipients([])
      setTotalAmount('0')
      
      // Refresh history after a delay
      setTimeout(() => {
        fetchAirdropHistory()
      }, 5000)

    } catch (error: any) {
      console.error('Airdrop creation error:', error)
      toast.error(error.message || 'Failed to create airdrop')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle airdrop claim
  const handleClaimAirdrop = async (airdrop: ClaimableAirdrop) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!airdropContractAddress) {
      toast.error('Airdrop contract not available on this network')
      return
    }

    try {
      console.log('Claiming airdrop:', airdrop)

      const txHash = await writeContractAsync({
        address: airdropContractAddress as `0x${string}`,
        abi: airdropAbi.abi,
        functionName: 'claimAirdrop',
        args: [airdrop.token],
        chainId: chainId,
      })

      toast.success(`Claim transaction sent! Hash: ${txHash}`)
      
      // Remove claimed airdrop from list immediately for better UX
      setClaimableAirdrops(prev => prev.filter(a => a.token !== airdrop.token))
      
      // Refresh claimable airdrops after a delay
      setTimeout(() => {
        fetchClaimableAirdrops()
      }, 5000)

    } catch (error: any) {
      console.error('Claim error:', error)
      toast.error(error.message || 'Failed to claim airdrop')
    }
  }

  // Handle bulk upload from modal
  const handleBulkUploadSuccess = (uploadedRecipients: AirdropRecipient[]) => {
    setRecipients(prev => [...prev, ...uploadedRecipients])
    setShowBulkUploadModal(false)
    toast.success(`Added ${uploadedRecipients.length} recipients from CSV`)
  }

  // Format date nicely
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-50 dark:bg-green-900/20'
      case 'available': return 'text-green-500 bg-green-50 dark:bg-green-900/20'
      case 'pending': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'processing': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'failed': return 'text-red-500 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  // Handle adding custom token
  const handleAddCustomToken = (symbol: string, address: string) => {
    // Check if token already exists
    const exists = customTokens.some(token => 
      token.symbol.toLowerCase() === symbol.toLowerCase() || 
      token.address.toLowerCase() === address.toLowerCase()
    )
    
    if (exists) {
      toast.error('Token already exists')
      return
    }

    const newToken = { symbol: symbol.toUpperCase(), address }
    setCustomTokens(prev => [...prev, newToken])
    setSelectedToken(newToken.symbol)
    setShowCustomTokenModal(false)
    toast.success(`${symbol.toUpperCase()} token added successfully`)
  }

  // Handle token selection change
  const handleTokenSelection = (value: string) => {
    if (value === 'add_token') {
      setShowCustomTokenModal(true)
    } else {
      setSelectedToken(value)
    }
  }

  // Render a placeholder during server rendering and initial hydration
  if (!isMounted) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="animate-pulse rounded-full h-16 w-16 bg-gray-200 dark:bg-gray-800"></div>
      </div>
    )
  }

  // Create Airdrop Content
  const CreateAirdropContent = () => (
    <div className="space-y-4">

      {/* Recipients Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700">
              Recipients
            </label>
            {recipients.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                {recipients.filter(r => r.address && r.amount).length} valid
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="flex items-center px-3 py-1.5 text-sm bg-white hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-900 text-black dark:text-white transition-colors duration-200 border border-gray-300 dark:border-gray-600"
            >
              <Upload className="h-4 w-4 mr-1" />
              Bulk Upload
            </button>
            <button
              onClick={() => setShowAddRecipientModal(true)}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Recipient
            </button>
          </div>
        </div>
        
        {recipients.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No recipients added yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use the buttons above to add recipients manually or via bulk upload
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-6 px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Recipient Address</div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Token</div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</div>
            </div>
            
            {/* Table Rows */}
            <div className="max-h-48 overflow-y-auto">
              {recipients.map((recipient, index) => (
                <div key={index} className="grid grid-cols-4 gap-6 px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">
                    {recipient.address || 'No address'}
                  </div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {recipient.amount || '0'}
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {selectedToken}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingIndex(index)
                        setShowAddRecipientModal(true)
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded"
                      title="Edit recipient"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeRecipient(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded"
                      title="Delete recipient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Button */}
      <div className={`flex ${recipients.length === 0 ? 'justify-center' : 'justify-end'}`}>
        <button
          onClick={() => {
            // Validate before showing confirmation
            const validRecipients = recipients.filter(r => r.address && r.amount)
            if (!isConnected) {
              toast.error('Please connect your wallet')
              return
            }
            if (validRecipients.length === 0) {
              toast.error('Please add at least one recipient with valid address and amount')
              return
            }
            setShowConfirmationModal(true)
          }}
          disabled={!isConnected || isCreating}
          className="px-6 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors duration-200 flex items-center text-sm"
        >
          {isCreating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Creating Airdrop...
            </>
          ) : (
            <>
              <Gift className="h-4 w-4 mr-2" />
              {isConnected ? 'Create Airdrop' : 'Connect Wallet to Create Airdrop'}
            </>
          )}
        </button>
      </div>
    </div>
  )

  // Claim Airdrop Content
  const ClaimAirdropContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-white">Available Airdrops</h3>
        <button
          onClick={fetchClaimableAirdrops}
          disabled={!isConnected || isCheckingClaims}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingClaims ? 'animate-spin' : ''}`} />
          {isCheckingClaims ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {!isConnected ? (
        <div className="text-center py-12">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 w-fit mx-auto mb-4">
            <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          <p className="text-lg dark:text-gray-300 text-gray-600">
            Please connect your wallet to check for claimable airdrops
          </p>
        </div>
      ) : claimableAirdrops.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-4">
            <Coins className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg dark:text-gray-300 text-gray-600">
            No claimable airdrops found
          </p>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-2">
            Click "Refresh" to check for new airdrops
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-6 px-6 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Token Symbol</div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Token</div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Status</div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</div>
        </div>
      )}

      {claimableAirdrops.map((airdrop) => (
        <div key={`${airdrop.token}-${airdrop.tokenSymbol}`} className="grid grid-cols-5 gap-6 px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{airdrop.tokenSymbol}</div>
          <div className="text-lg font-medium">{airdrop.tokenSymbol}</div>
          <div className="text-lg font-medium">{airdrop.amount} {airdrop.tokenSymbol}</div>
          <div>
            <span className="text-xs text-gray-500">Available</span>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => handleClaimAirdrop(airdrop)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
            >
              <Coins className="h-4 w-4 mr-2" />
              Claim
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="w-full dark:text-white text-black">
      {isConnected ? (
        <div className="flex flex-col items-center px-2 sm:px-4 py-4 min-h-full">
          {/* Header Section */}
          <div className="w-full max-w-6xl mb-6">
            
            
            {/* Header with Title and Token Selector */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-black dark:text-white">Token Airdrops</h1>
              
              {/* Token Selector in Header */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <select
                    value={selectedToken}
                    onChange={(e) => handleTokenSelection(e.target.value)}
                    className="px-4 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent dark:text-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="U2U" className="bg-transparent text-black dark:text-white">U2U (Native)</option>
                    {customTokens.map((token) => (
                      <option key={token.symbol} value={token.symbol} className="bg-white dark:bg-gray-800 text-black dark:text-white">
                        {token.symbol}
                      </option>
                    ))}
                    <option value="add_token" className="bg-white dark:bg-gray-800 text-black dark:text-white">+ Add Token</option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfigModal(true)}
                  className="relative py-2 px-3 lg:py-2.5 lg:px-4 rounded-lg backdrop-blur-md bg-gray-200/30 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-300/40 dark:hover:bg-gradient-to-r dark:hover:from-gray-600/30 dark:hover:to-gray-700/30 hover:border-gray-400/60 dark:hover:border-white/30 flex items-center justify-center gap-2"
                  title="Configure Payments"
                >
                  <Settings className="h-4 w-4 lg:h-5 lg:w-5 text-black dark:text-white" />
                  <span className="hidden lg:inline font-medium text-sm whitespace-nowrap text-black dark:text-white">Configure</span>
                </motion.button>
              </div>
            </div>
            
            {/* Tabs Row */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                }`}
              >
                Create Airdrop
              </button>
              <button
                onClick={() => setActiveTab('claim')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'claim'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                }`}
              >
                Claim Airdrops
              </button>
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
                      Airdrop Contract Not Available
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      The airdrop contract is not deployed on {networkName}. Please switch to U2U Mainnet or U2U Testnet to use this feature.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="w-full max-w-6xl flex-1 overflow-hidden">
            <div className="bg-transparent rounded-xl overflow-hidden">
              {isContractAvailable ? (
                <>
                  {activeTab === 'create' && <CreateAirdropContent />}
                  {activeTab === 'claim' && <ClaimAirdropContent />}
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-4">
                    <Gift className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Airdrop Feature Unavailable
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please switch to U2U Mainnet or U2U Testnet to use the airdrop feature.
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
                Connect your wallet to access airdrop features and manage your token distributions.
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

      {/* Add Recipient Modal */}
      {showAddRecipientModal && (
        <AddRecipientModal
          isOpen={showAddRecipientModal}
          onClose={() => {
            setShowAddRecipientModal(false)
            setEditingIndex(null)
          }}
          onAddRecipient={(recipient) => {
            if (editingIndex !== null) {
              // Edit existing recipient
              const updatedRecipients = [...recipients]
              updatedRecipients[editingIndex] = recipient
              setRecipients(updatedRecipients)
              toast.success('Recipient updated successfully!')
            } else {
              // Add new recipient
              setRecipients(prev => [...prev, recipient])
              toast.success('Recipient added successfully!')
            }
            setShowAddRecipientModal(false)
            setEditingIndex(null)
          }}
          editingRecipient={editingIndex !== null ? recipients[editingIndex] : null}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={() => {
            setShowConfirmationModal(false)
            handleCreateAirdrop()
          }}
          recipients={recipients}
          selectedToken={selectedToken}
          totalAmount={totalAmount}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <BulkUploadModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          onUploadSuccess={handleBulkUploadSuccess}
          existingRecipients={recipients}
        />
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

      {/* Custom Token Modal */}
      {showCustomTokenModal && (
        <CustomTokenModal
          isOpen={showCustomTokenModal}
          onClose={() => setShowCustomTokenModal(false)}
          onAddToken={handleAddCustomToken}
        />
      )}
    </div>
  )
}

// Bulk Upload Modal Component
interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (recipients: AirdropRecipient[]) => void;
  existingRecipients: AirdropRecipient[];
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onUploadSuccess, existingRecipients }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const csvContent = `Address,Amount
0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8,100
0x123F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C9,250
0x456F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7D0,500`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'airdrop_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully!');
  };

  const handleFileUpload = (file: File) => {
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      const csvRecipients: AirdropRecipient[] = [];
      const duplicates: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [address, amount] = line.split(',');
        if (address && amount) {
          const newRec = {
            address: address.trim(),
            amount: amount.trim()
          };
          
          const isDuplicate = existingRecipients.some(r => r.address.toLowerCase() === newRec.address.toLowerCase()) ||
                             csvRecipients.some(r => r.address.toLowerCase() === newRec.address.toLowerCase());
          
          if (!isDuplicate) {
            csvRecipients.push(newRec);
          } else {
            duplicates.push(newRec.address);
          }
        }
      }
      
      setIsProcessing(false);
      
      if (csvRecipients.length > 0) {
        onUploadSuccess(csvRecipients);
        if (duplicates.length > 0) {
          toast.error(`Skipped ${duplicates.length} duplicate entries`);
        }
      } else {
        toast.error('No valid recipients found in CSV');
      }
    };
    
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(file);
    } else {
      toast.error('Please upload a CSV file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium dark:text-white">Bulk Upload Recipients</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`border-2 rounded-lg p-6 text-center transition-colors relative ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium dark:text-white">
                {isProcessing ? 'Processing...' : 'Drop CSV file here or click to browse'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CSV format: Address, Amount
              </p>
            </div>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
          </div>
          
          {/* Template Download */}
          <div className="flex justify-center">
            <button
              onClick={downloadTemplate}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm transition-colors duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </button>
          </div>
          
          {/* Guide */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium dark:text-white mb-2">CSV Format Guide:</h4>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p>• First row should be headers: Address,Amount</p>
              <p>• Each address should start with 0x</p>
              <p>• Amounts should be positive numbers</p>
              <p>• Duplicate addresses will be skipped</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Recipient Modal Component
interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecipient: (recipient: AirdropRecipient) => void;
  editingRecipient?: AirdropRecipient | null;
}

const AddRecipientModal: React.FC<AddRecipientModalProps> = ({ isOpen, onClose, onAddRecipient, editingRecipient }) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(true);

  // Pre-populate fields when editing
  useEffect(() => {
    if (editingRecipient) {
      setAddress(editingRecipient.address);
      setAmount(editingRecipient.amount);
      setIsValidAddress(true);
    } else {
      setAddress('');
      setAmount('');
      setIsValidAddress(true);
    }
  }, [editingRecipient]);

  if (!isOpen) return null;

  const validateAddress = (addr: string) => {
    return addr.startsWith('0x') && addr.length === 42;
  };

  const handleAddRecipient = () => {
    if (!address || !amount) {
      toast.error('Please fill in both address and amount');
      return;
    }

    if (!validateAddress(address)) {
      setIsValidAddress(false);
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    onAddRecipient({ address, amount });
    
    // Reset form
    setAddress('');
    setAmount('');
    setIsValidAddress(true);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setIsValidAddress(validateAddress(value) || value === '');
  };

  return (
    <div className="fixed inset-0 bg-black/15 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium dark:text-white">
            {editingRecipient ? 'Edit Recipient' : 'Add Recipient'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Address Input */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              className={`w-full px-3 py-2 border ${
                !isValidAddress ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } dark:bg-gray-800 dark:text-white bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded font-mono text-sm`}
            />
            {!isValidAddress && (
              <p className="text-red-500 text-xs mt-1">Please enter a valid Ethereum address (0x...)</p>
            )}
          </div>
          
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              placeholder="0.00"
              step="0.000001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded text-sm"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAddRecipient}
            disabled={!address || !amount || !isValidAddress}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors duration-200 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            {editingRecipient ? 'Update Recipient' : 'Add Recipient'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipients: AirdropRecipient[];
  selectedToken: string;
  totalAmount: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  recipients, 
  selectedToken, 
  totalAmount 
}) => {
  if (!isOpen) return null;

  const validRecipients = recipients.filter(r => r.address && r.amount);

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold dark:text-white">Confirm Airdrop Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Minus className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-6 flex-1 overflow-y-auto">
          {/* Summary Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-lg font-medium dark:text-white mb-3">Airdrop Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Token:</span>
                <p className="font-semibold text-lg dark:text-white">{selectedToken}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                <p className="font-semibold text-lg dark:text-white">{totalAmount} {selectedToken}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Recipients:</span>
                <p className="font-semibold text-lg dark:text-white">{validRecipients.length}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Network:</span>
                <p className="font-semibold text-lg dark:text-white">U2U</p>
              </div>
            </div>
          </div>

          {/* Recipients List */}
          <div>
            <h4 className="text-lg font-medium dark:text-white mb-3">Recipients Details</h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Address</div>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</div>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Token</div>
              </div>
              
              {/* Recipients */}
              <div className="max-h-60 overflow-y-auto">
                {validRecipients.map((recipient, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate" title={recipient.address}>
                      {recipient.address}
                    </div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {recipient.amount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedToken}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <ExternalLink className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Important Notice</h5>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Please review all details carefully. This transaction cannot be reversed once confirmed. 
                  Make sure all recipient addresses are correct and you have sufficient {selectedToken} balance.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200 flex items-center"
          >
            <Gift className="h-4 w-4 mr-2" />
            Confirm Airdrop
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Token Modal Component
interface CustomTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToken: (symbol: string, address: string) => void;
}

const CustomTokenModal: React.FC<CustomTokenModalProps> = ({ isOpen, onClose, onAddToken }) => {
  const [symbol, setSymbol] = useState('')
  const [address, setAddress] = useState('')
  const [isValid, setIsValid] = useState(false)

  // Validate form
  useEffect(() => {
    const isSymbolValid = symbol.trim().length > 0 && symbol.trim().length <= 10
    const isAddressValid = address.trim().match(/^0x[a-fA-F0-9]{40}$/)
    setIsValid(isSymbolValid && !!isAddressValid)
  }, [symbol, address])

  const handleSubmit = () => {
    if (isValid) {
      onAddToken(symbol.trim(), address.trim())
      setSymbol('')
      setAddress('')
    }
  }

  const handleClose = () => {
    setSymbol('')
    setAddress('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Add Custom Token</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., USDC"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contract Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`px-4 py-2 text-sm rounded transition-colors duration-200 ${
              isValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Add Token
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AirdropPageWithProvider() {
  return (
    <PaymentConfigProvider>
      <AirdropPage />
    </PaymentConfigProvider>
  )
}