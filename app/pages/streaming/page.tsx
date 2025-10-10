"use client"

import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseUnits, formatUnits, parseEther } from 'viem'
import { Wallet, Play, Pause, Clock, Plus, RefreshCw, Home, Upload, Download, Edit, Trash2, Calendar, Timer, DollarSign, Activity, Target, ArrowRight, Eye, Settings, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from "react-hot-toast"
import Link from 'next/link'
import { getStreamAddress, NATIVE_TOKEN_ADDRESS } from '@/lib/contract-addresses'
import { PaymentConfigProvider, usePaymentConfig } from '@/context/paymentConfigContext'
import ConfigurePayModal from '@/components/payroll/ConfigurePayModal'

// Stream Contract ABI (essential functions only)
const STREAM_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "address[]", "name": "recipients", "type": "address[]" },
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "durations", "type": "uint256[]" }
    ],
    "name": "createBulkStreams",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "streamId", "type": "uint256" }],
    "name": "claimStream",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256[]", "name": "streamIds", "type": "uint256[]" }],
    "name": "claimMultipleStreams",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "streamId", "type": "uint256" }],
    "name": "getStream",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "sender", "type": "address" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "address", "name": "token", "type": "address" },
          { "internalType": "uint256", "name": "totalAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "claimedAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "startTime", "type": "uint256" },
          { "internalType": "uint256", "name": "endTime", "type": "uint256" },
          { "internalType": "bool", "name": "active", "type": "bool" }
        ],
        "internalType": "struct BulkStream.Stream",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }],
    "name": "getRecipientStreams",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "streamId", "type": "uint256" }],
    "name": "getClaimableAmount",
    "outputs": [{ "internalType": "uint256", "name": "claimable", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "getTotalClaimable",
    "outputs": [{ "internalType": "uint256", "name": "total", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Types for streaming data
interface StreamRecipient {
  address: string;
  amount: string;
  duration: string; // in hours
  startTime?: string;
}

interface CustomToken {
  symbol: string;
  address: string;
}

interface ClaimableStream {
  streamId: bigint;
  sender: string;
  recipient: string;
  token: string;
  tokenSymbol: string;
  totalAmount: bigint;
  claimedAmount: bigint;
  claimableAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  active: boolean;
  progress: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  flowRatePerHour?: number;
}

interface CreatedStream {
  streamId: string;
  token: string;
  tokenSymbol: string;
  totalAmount: string;
  recipientCount: number;
  createdAt: string;
  duration: string;
  status: string;
  transactionHash?: string;
}

function StreamingPage() {
  // State for tab management
  const [activeTab, setActiveTab] = useState('create')
  const [isMounted, setIsMounted] = useState(false)
  
  // State for Create Stream tab
  const [selectedToken, setSelectedToken] = useState<string>('U2U')
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([])
  const [showCustomTokenModal, setShowCustomTokenModal] = useState(false)
  const [recipients, setRecipients] = useState<StreamRecipient[]>([])
  const [totalAmount, setTotalAmount] = useState<string>('0')
  const [isCreating, setIsCreating] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  
  // Add Recipient Modal State
  const [newRecipientAddress, setNewRecipientAddress] = useState<string>('')
  const [newRecipientAmount, setNewRecipientAmount] = useState<string>('')
  
  // Bulk Upload State
  const [bulkUploadData, setBulkUploadData] = useState<string>('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  
  // Stream Configuration State
  const [streamName, setStreamName] = useState<string>('')
  const [streamDescription, setStreamDescription] = useState<string>('')
  const [defaultDuration, setDefaultDuration] = useState<string>('24') // hours
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours' | 'days' | 'months'>('hours')
  const [startImmediately, setStartImmediately] = useState<boolean>(true)
  const [scheduledStartDate, setScheduledStartDate] = useState<string>('')
  const [streamType, setStreamType] = useState<'linear' | 'cliff' | 'custom'>('linear')
  const [cliffPeriod, setCliffPeriod] = useState<string>('0') // hours
  const [allowCancellation, setAllowCancellation] = useState<boolean>(true)
  const [enablePartialClaims, setEnablePartialClaims] = useState<boolean>(true)
  
  // Payment configuration context
  const { 
    config: paymentConfig, 
    updateConfig, 
    showConfigModal, 
    setShowConfigModal 
  } = usePaymentConfig();
  
  // State for Claim Stream tab
  const [claimableStreams, setClaimableStreams] = useState<ClaimableStream[]>([])
  const [isCheckingClaims, setIsCheckingClaims] = useState(false)
  const [selectedStreamIds, setSelectedStreamIds] = useState<string[]>([])
  
  // State for Created Streams (History)
  const [createdStreams, setCreatedStreams] = useState<CreatedStream[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  // Wallet connection
  const { address, isConnected, chain } = useAccount()
  const chainId = useChainId()
  
  // Contract address for current network
  const streamContractAddress = getStreamAddress(chainId)
  
  // Debug network information
  useEffect(() => {
    console.log('=== STREAMING NETWORK DEBUG ===')
    console.log('Chain ID:', chainId)
    console.log('Stream Contract Address:', streamContractAddress)
    console.log('Is Mainnet (39):', chainId === 39)
    console.log('Is Testnet (2484):', chainId === 2484)
  }, [chainId, streamContractAddress])
  
  // Check if contract is available on current network
  const isContractAvailable = !!streamContractAddress
  const networkName = chainId === 39 ? 'U2U Mainnet' : chainId === 2484 ? 'U2U Testnet' : 'Unknown Network'
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // Contract read hooks for recipient streams
  const { data: recipientStreamIds, refetch: refetchRecipientStreams } = useReadContract({
    address: streamContractAddress as `0x${string}`,
    abi: STREAM_CONTRACT_ABI,
    functionName: 'getRecipientStreams',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!streamContractAddress,
    },
  })

  // Helper function to convert duration to hours
  const convertDurationToHours = (duration: string, unit: 'minutes' | 'hours' | 'days' | 'months'): number => {
    const value = parseFloat(duration) || 0
    switch (unit) {
      case 'minutes': return value / 60
      case 'hours': return value
      case 'days': return value * 24
      case 'months': return value * 24 * 30 // Approximate 30 days per month
      default: return value
    }
  }

  // Helper function to get duration display text
  const getDurationDisplayText = (unit: 'minutes' | 'hours' | 'days' | 'months'): string => {
    switch (unit) {
      case 'minutes': return 'Minutes'
      case 'hours': return 'Hours'
      case 'days': return 'Days'
      case 'months': return 'Months'
      default: return 'Hours'
    }
  }

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
    if (isConnected && address) {
      fetchStreamHistory()
      fetchClaimableStreams()
    }
  }, [isConnected, address])
  
  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success(`Stream created successfully! Transaction confirmed.`)
      
      // Reset form
      setRecipients([])
      setStreamName('')
      setStreamDescription('')
      setTotalAmount('0')
      setIsCreating(false)
      
      // Refresh data
      setTimeout(() => {
        fetchStreamHistory()
        fetchClaimableStreams()
      }, 2000)
    }
    
    if (error) {
      console.error('Transaction error:', error)
      toast.error(error.message || 'Transaction failed')
      setIsCreating(false)
    }
  }, [isConfirmed, error])

  // Calculate total amount when recipients change
  useEffect(() => {
    const total = recipients.reduce((sum, recipient) => {
      const amount = parseFloat(recipient.amount) || 0;
      return sum + amount;
    }, 0);
    setTotalAmount(total.toFixed(6));
  }, [recipients]);

  // Update all recipients' duration when default duration changes
  useEffect(() => {
    if (recipients.length > 0) {
      setRecipients(prevRecipients => 
        prevRecipients.map(recipient => ({
          ...recipient,
          duration: defaultDuration
        }))
      );
    }
  }, [defaultDuration]);

  // Mock function to fetch stream history
  const fetchStreamHistory = async () => {
    setIsLoadingHistory(true)
    
    setTimeout(() => {
      const mockHistory: CreatedStream[] = [
        {
          streamId: 'STR001',
          token: '0x0000000000000000000000000000000000000000',
          tokenSymbol: 'U2U',
          totalAmount: '5.0',
          recipientCount: 3,
          duration: '24',
          createdAt: new Date().toISOString(),
          status: 'active',
          transactionHash: '0x1234567890abcdef1234567890abcdef12345678'
        },
        {
          streamId: 'STR002',
          token: '0xA0b86a33E6441a0e3Ce4C3C9eBDfEb5c45Dd6aF9',
          tokenSymbol: 'USDC',
          totalAmount: '2000.0',
          recipientCount: 8,
          duration: '168',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed'
        }
      ]
      setCreatedStreams(mockHistory)
      setIsLoadingHistory(false)
    }, 1000)
  }

  // Direct contract reading function with proper U2U network setup
  const readContractData = async (functionName: 'getStream' | 'getRecipientStreams' | 'getClaimableAmount' | 'getTotalClaimable', args: any[] = []) => {
    if (!streamContractAddress) return null
    
    try {
      // Import viem for direct contract reading
      const { createPublicClient, http, defineChain } = await import('viem')
      
      // Determine which chain configuration to use based on current chainId
      let chainConfig
      let rpcUrl
      
      if (chainId === 39) {
        // U2U Mainnet
        chainConfig = {
          id: 39,
          name: 'U2U Mainnet',
          network: 'u2u-mainnet',
          nativeCurrency: {
            decimals: 18,
            name: 'U2U',
            symbol: 'U2U',
          },
          rpcUrls: {
            default: { http: ['https://rpc-mainnet.uniultra.xyz'] },
            public: { http: ['https://rpc-mainnet.uniultra.xyz'] },
          },
        }
        rpcUrl = 'https://rpc-mainnet.uniultra.xyz'
      } else {
        // U2U Testnet (default)
        chainConfig = {
          id: 2484,
          name: 'U2U Testnet',
          network: 'u2u-testnet',
          nativeCurrency: {
            decimals: 18,
            name: 'U2U',
            symbol: 'U2U',
          },
          rpcUrls: {
            default: { http: ['https://rpc-nebulas-testnet.uniultra.xyz'] },
            public: { http: ['https://rpc-nebulas-testnet.uniultra.xyz'] },
          },
        }
        rpcUrl = 'https://rpc-nebulas-testnet.uniultra.xyz'
      }
      
      // Define the chain
      const u2uChain = defineChain(chainConfig)
      
      // Create public client for the appropriate U2U network
      const publicClient = createPublicClient({
        chain: u2uChain,
        transport: http(),
      })
      
      console.log(`Reading contract function: ${functionName} with args:`, args)
      console.log(`Using network: ${chainConfig.name} (Chain ID: ${chainConfig.id})`)
      
      const result = await publicClient.readContract({
        address: streamContractAddress as `0x${string}`,
        abi: STREAM_CONTRACT_ABI,
        functionName: functionName as any,
        args: args as any,
      })
      
      console.log(`Contract function ${functionName} result:`, result)
      return result
    } catch (error) {
      console.error(`Error reading contract function ${functionName}:`, error)
      return null
    }
  }

  // Updated helper function to get real stream data from contract
  const getRealStreamData = async (streamId: bigint): Promise<ClaimableStream | null> => {
    if (!streamContractAddress || !address) {
      return null
    }

    try {
      // Get stream details from contract
      const streamData = await readContractData('getStream', [streamId])
      
      if (!streamData) {
        console.error(`No stream data found for stream ID: ${streamId}`)
        return null
      }
      
      // Get claimable amount
      const claimableAmount = await readContractData('getClaimableAmount', [streamId])
      
      const {
        sender,
        recipient,
        token,
        totalAmount,
        claimedAmount,
        startTime,
        endTime,
        active
      } = streamData as any
      
      // Only show streams for the connected user
      if (recipient.toLowerCase() !== address.toLowerCase()) {
        return null
      }
      
      // Use actual start and end times from contract
      const endTimeBigInt = BigInt(endTime)
      const startTimeBigInt = BigInt(startTime)
      
      // Calculate progress: (claimedAmount + claimableAmount) / totalAmount * 100
      const totalAmountBigInt = BigInt(totalAmount)
      const claimedAmountBigInt = BigInt(claimedAmount)
      const claimableAmountBigInt = BigInt(claimableAmount || 0)
      const receivedAmount = claimedAmountBigInt + claimableAmountBigInt
      const progress = totalAmountBigInt > 0 ? Number((receivedAmount * BigInt(100)) / totalAmountBigInt) : 0
      
      // Calculate flow rate: totalAmount / totalHours
      const durationInSeconds = Number(endTimeBigInt - startTimeBigInt)
      const durationInHours = durationInSeconds / 3600 // Convert seconds to hours
      const totalAmountInEther = Number(formatUnits(totalAmountBigInt, 18))
      const flowRatePerHour = durationInHours > 0 ? totalAmountInEther / durationInHours : 0
      
      // Determine status based on current time
      const currentTime = BigInt(Math.floor(Date.now() / 1000))
      
      // Determine token symbol
      const tokenSymbol = token === NATIVE_TOKEN_ADDRESS ? 'U2U' : 
        customTokens.find(t => t.address.toLowerCase() === token.toLowerCase())?.symbol || 'UNKNOWN'
      
      // Determine status
      let status: 'active' | 'paused' | 'completed' | 'cancelled' = 'active'
      if (!active) status = 'cancelled'
      else if (currentTime >= BigInt(endTime)) status = 'completed'
      
      return {
        streamId,
        sender,
        recipient,
        token,
        tokenSymbol,
        totalAmount: totalAmountBigInt,
        claimedAmount: claimedAmountBigInt,
        claimableAmount: claimableAmountBigInt,
        startTime: startTimeBigInt,
        endTime: endTimeBigInt,
        active,
        progress: Math.min(Math.max(Math.round(progress), 0), 100),
        status,
        flowRatePerHour // Add flow rate for easy access
      }
    } catch (error) {
      console.error('Error getting real stream data:', error)
      return null
    }
  }

  // Fetch claimable streams from contract with real data
  const fetchClaimableStreams = async () => {
    if (!isConnected || !address || !streamContractAddress) {
      setClaimableStreams([])
      return
    }

    setIsCheckingClaims(true)
    
    try {
      console.log('Fetching real stream data for address:', address)
      
      // Get recipient stream IDs from contract
      const streamIds = await readContractData('getRecipientStreams', [address]) as bigint[] | null
      
      if (!streamIds || streamIds.length === 0) {
        console.log('No streams found for this address')
        setClaimableStreams([])
        setIsCheckingClaims(false)
        return
      }

      console.log('Found stream IDs:', streamIds)
      
      // Fetch details for each stream
      const streams: ClaimableStream[] = []
      
      for (const streamId of streamIds) {
        try {
          const streamData = await getRealStreamData(streamId)
          
          if (streamData) {
            streams.push(streamData)
            console.log(`Loaded stream ${streamId.toString()}:`, streamData)
          }
        } catch (streamError) {
          console.error(`Error fetching stream ${streamId.toString()}:`, streamError)
        }
      }
      
      console.log('Total streams loaded:', streams.length)
      setClaimableStreams(streams)
    } catch (error) {
      console.error('Error fetching claimable streams:', error)
      toast.error('Failed to fetch streams from contract')
      setClaimableStreams([])
    } finally {
      setIsCheckingClaims(false)
    }
  }

  // Helper function to get stream data from contract
  const getStreamData = async (streamId: bigint): Promise<ClaimableStream | null> => {
    if (!streamContractAddress || !address) {
      return null
    }

    try {
      // Create a temporary read contract call
      const response = await fetch('/api/contract-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: streamContractAddress,
          abi: STREAM_CONTRACT_ABI,
          functionName: 'getStream',
          args: [streamId],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stream data')
      }

      const streamData = await response.json()
      
      // Also get claimable amount
      const claimableResponse = await fetch('/api/contract-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: streamContractAddress,
          abi: STREAM_CONTRACT_ABI,
          functionName: 'getClaimableAmount',
          args: [streamId],
        }),
      })

      const claimableData = claimableResponse.ok ? await claimableResponse.json() : BigInt(0)

      if (streamData && streamData.active) {
        const {
          sender,
          recipient,
          token,
          totalAmount,
          claimedAmount,
          startTime,
          endTime,
          active
        } = streamData
        
        // Calculate progress: (claimedAmount + claimableAmount) / totalAmount * 100
        const totalAmountBigInt = BigInt(totalAmount)
        const claimedAmountBigInt = BigInt(claimedAmount)
        const claimableAmountBigInt = BigInt(claimableData || 0)
        const receivedAmount = claimedAmountBigInt + claimableAmountBigInt
        const progress = totalAmountBigInt > 0 ? Number((receivedAmount * BigInt(100)) / totalAmountBigInt) : 0
        
        // Determine status based on current time
        const currentTime = BigInt(Math.floor(Date.now() / 1000))
        
        // Calculate flow rate: totalAmount / totalHours
        const durationInSeconds = Number(BigInt(endTime) - BigInt(startTime))
        const durationInHours = durationInSeconds / 3600 // Convert seconds to hours
        const totalAmountInEther = Number(formatUnits(totalAmountBigInt, 18))
        const flowRatePerHour = durationInHours > 0 ? totalAmountInEther / durationInHours : 0
        
        // Determine token symbol
        const tokenSymbol = token === NATIVE_TOKEN_ADDRESS ? 'U2U' : 
          customTokens.find(t => t.address.toLowerCase() === token.toLowerCase())?.symbol || 'UNKNOWN'
        
        // Determine status
        let status: 'active' | 'paused' | 'completed' | 'cancelled' = 'active'
        if (!active) status = 'cancelled'
        else if (currentTime >= BigInt(endTime)) status = 'completed'
        
        return {
          streamId,
          sender,
          recipient,
          token,
          tokenSymbol,
          totalAmount: BigInt(totalAmount),
          claimedAmount: BigInt(claimedAmount),
          claimableAmount: BigInt(claimableData || 0),
          startTime: BigInt(startTime),
          endTime: BigInt(endTime),
          active,
          progress: Math.min(Math.max(Math.round(progress), 0), 100),
          status,
          flowRatePerHour // Add flow rate for easy access
        }
      }
      
      return null
    } catch (error) {
      console.error('Error getting stream data:', error)
      
      // If API call fails, try direct contract read (this won't work in current setup but shows the pattern)
      // In a real implementation, you'd need to set up proper contract reading
      console.warn('Falling back to mock data - implement proper contract reading')
      
      // Return null to indicate we couldn't fetch real data
      return null
    }
  }

  // Handle adding custom token
  const handleAddCustomToken = (symbol: string, address: string) => {
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

  // Handle stream creation
  const handleCreateStream = async () => {
    await createBulkStreams()
  }

  // Handle stream claim
  const handleClaimStream = async (stream: ClaimableStream) => {
    if (!isConnected || !address || !streamContractAddress) {
      toast.error('Please connect your wallet')
      return
    }

    if (stream.claimableAmount === BigInt(0)) {
      toast.error('No claimable amount available')
      return
    }

    try {
      console.log('Claiming stream:', stream.streamId.toString())
      
      writeContract({
        address: streamContractAddress as `0x${string}`,
        abi: STREAM_CONTRACT_ABI,
        functionName: 'claimStream',
        args: [stream.streamId],
        chainId: chainId
      })
      
      toast.success(`Claiming ${formatUnits(stream.claimableAmount, 18)} ${stream.tokenSymbol}...`)
      
      // Refresh streams after a delay
      setTimeout(() => {
        fetchClaimableStreams()
      }, 3000)

    } catch (error: any) {
      console.error('Claim error:', error)
      toast.error(error.message || 'Failed to claim stream')
    }
  }

  // Handle bulk claim
  const handleBulkClaim = async () => {
    if (selectedStreamIds.length === 0) {
      toast.error('Please select streams to claim')
      return
    }

    if (!isConnected || !address || !streamContractAddress) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      const selectedStreams = claimableStreams.filter(s => selectedStreamIds.includes(s.streamId.toString()))
      const streamIds = selectedStreams.map(s => s.streamId)
      const totalClaimable = selectedStreams.reduce((sum, s) => sum + s.claimableAmount, BigInt(0))
      
      console.log('Bulk claiming streams:', streamIds.map(id => id.toString()))
      
      writeContract({
        address: streamContractAddress as `0x${string}`,
        abi: STREAM_CONTRACT_ABI,
        functionName: 'claimMultipleStreams',
        args: [streamIds],
        chainId: chainId
      })
      
      toast.success(`Claiming total of ${formatUnits(totalClaimable, 18)} tokens from ${selectedStreams.length} streams...`)
      
      setSelectedStreamIds([])
      setTimeout(() => {
        fetchClaimableStreams()
      }, 3000)

    } catch (error: any) {
      console.error('Bulk claim error:', error)
      toast.error(error.message || 'Failed to claim streams')
    }
  }

  // Handle adding/editing recipient
  const handleAddRecipient = () => {
    if (!newRecipientAddress.trim()) {
      toast.error('Please enter recipient address')
      return
    }
    if (!newRecipientAmount || parseFloat(newRecipientAmount) <= 0) {
      toast.error('Please enter valid amount')
      return
    }

    const newRecipient: StreamRecipient = {
      address: newRecipientAddress.trim(),
      amount: newRecipientAmount,
      duration: defaultDuration
    }

    if (editingIndex !== null) {
      // Edit existing recipient
      const updatedRecipients = [...recipients]
      updatedRecipients[editingIndex] = newRecipient
      setRecipients(updatedRecipients)
      toast.success('Recipient updated successfully')
    } else {
      // Add new recipient
      setRecipients([...recipients, newRecipient])
      toast.success('Recipient added successfully')
    }

    // Reset form
    setNewRecipientAddress('')
    setNewRecipientAmount('')
    setEditingIndex(null)
    setShowAddRecipientModal(false)
  }

  // Generate CSV template
  const downloadCsvTemplate = () => {
    const csvContent = "address,amount\n0x1234567890123456789012345678901234567890,100.5\n0x0987654321098765432109876543210987654321,250.0"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'streaming_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('CSV template downloaded')
  }

  // Parse CSV data
  const parseCsvData = (csvText: string): StreamRecipient[] => {
    const lines = csvText.trim().split('\n')
    const recipients: StreamRecipient[] = []
    
    // Skip header if it exists
    const startIndex = lines[0].toLowerCase().includes('address') ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const [address, amount] = line.split(',').map(item => item.trim())
      if (address && amount && parseFloat(amount) > 0) {
        recipients.push({
          address,
          amount,
          duration: defaultDuration
        })
      }
    }
    
    return recipients
  }

  // Handle bulk upload
  const handleBulkUpload = () => {
    let newRecipients: StreamRecipient[] = []
    
    if (csvFile) {
      // Handle file upload
      const reader = new FileReader()
      reader.onload = (e) => {
        const csvText = e.target?.result as string
        newRecipients = parseCsvData(csvText)
        
        if (newRecipients.length === 0) {
          toast.error('No valid recipients found in file')
          return
        }
        
        setRecipients([...recipients, ...newRecipients])
        toast.success(`Added ${newRecipients.length} recipients from file`)
        setCsvFile(null)
        setBulkUploadData('')
        setShowBulkUploadModal(false)
      }
      reader.readAsText(csvFile)
    } else if (bulkUploadData.trim()) {
      // Handle text input
      newRecipients = parseCsvData(bulkUploadData)
      
      if (newRecipients.length === 0) {
        toast.error('No valid recipients found in data')
        return
      }
      
      setRecipients([...recipients, ...newRecipients])
      toast.success(`Added ${newRecipients.length} recipients`)
      setBulkUploadData('')
      setCsvFile(null)
      setShowBulkUploadModal(false)
    } else {
      toast.error('Please provide CSV data or upload a file')
    }
  }

  // Prepare data for createBulkStreams function
  const createBulkStreams = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!streamContractAddress) {
      toast.error('Stream contract not available')
      return
    }

    const validRecipients = recipients.filter(r => r.address && r.amount && parseFloat(r.amount) > 0)
    if (validRecipients.length === 0) {
      toast.error('Please add at least one recipient with valid address and amount')
      return
    }

    // Stream name is now optional - no validation required

    try {
      setIsCreating(true)
      
      // Prepare contract parameters
      const addresses = validRecipients.map(r => r.address as `0x${string}`)
      const amounts = validRecipients.map(r => {
        // Use 18 decimals for native token, or get from token contract
        const decimals = selectedToken === 'U2U' ? 18 : 18 // You can extend this for different tokens
        return parseUnits(r.amount, decimals)
      })
      const durations = validRecipients.map(r => {
        const durationInHours = convertDurationToHours(r.duration || defaultDuration, durationUnit)
        return BigInt(Math.round(durationInHours * 3600)) // Convert hours to seconds
      })
      
      // Determine token address - use native address for U2U, otherwise use custom token address
      const tokenAddress = selectedToken === 'U2U' ? NATIVE_TOKEN_ADDRESS : 
        (customTokens.find(t => t.symbol === selectedToken)?.address || NATIVE_TOKEN_ADDRESS)
      
      // Calculate total amount for ETH value (only needed for native token)
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0))
      
      console.log('Creating bulk streams with params:', {
        contractAddress: streamContractAddress,
        token: tokenAddress,
        recipients: addresses,
        amounts: amounts.map(a => a.toString()),
        durations: durations.map(d => d.toString()),
        isNativeToken: tokenAddress === NATIVE_TOKEN_ADDRESS,
        totalValue: tokenAddress === NATIVE_TOKEN_ADDRESS ? totalAmount.toString() : '0'
      })
      
      // Call contract function
      await writeContract({
        address: streamContractAddress as `0x${string}`,
        abi: STREAM_CONTRACT_ABI,
        functionName: 'createBulkStreams',
        args: [
          tokenAddress as `0x${string}`, 
          addresses, 
          amounts, 
          durations
        ],
        value: tokenAddress === NATIVE_TOKEN_ADDRESS ? totalAmount : BigInt(0),
        chainId: chainId
      })
      
      toast.success('Transaction submitted! Waiting for confirmation...')
      
    } catch (error: any) {
      console.error('Bulk stream creation error:', error)
      toast.error(error.message || 'Failed to create bulk streams')
      setIsCreating(false)
    }
  }

  // Format date nicely (handles both string and BigInt)
  const formatDate = (dateInput: string | bigint) => {
    let timestamp: number
    if (typeof dateInput === 'bigint') {
      timestamp = Number(dateInput) * 1000 // Convert from seconds to milliseconds
    } else {
      timestamp = new Date(dateInput).getTime()
    }
    
    return new Date(timestamp).toLocaleDateString('en-US', {
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
      case 'active': return 'text-green-500 bg-green-50 dark:bg-green-900/20'
      case 'paused': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'completed': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'cancelled': return 'text-red-500 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
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

  // Create Stream Content
  const CreateStreamContent = () => (
    <div className="space-y-6">
      {/* Stream Configuration Section */}
      <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 dark:border-gray-700/30">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-blue-500" />
          Stream Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stream Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stream Name *
            </label>
            <input
                  type="text"
                  placeholder="Enter stream name"
                  className="w-full px-3 py-2 border border-white/20 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  id="tokenSymbol"
                />
          </div>

          {/* Stream Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(e.target.value)}
                placeholder="24"
                min="1"
                className="flex-1 px-3 py-2 border border-gray-400/60 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white caret-black dark:caret-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                autoComplete="off"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as 'minutes' | 'hours' | 'days' | 'months')}
                className="px-3 py-2 border border-gray-400/60 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
              >
                <option value="minutes" className="bg-white/90 dark:bg-gray-800/90 text-black dark:text-white">Minutes</option>
                <option value="hours" className="bg-white/90 dark:bg-gray-800/90 text-black dark:text-white">Hours</option>
                <option value="days" className="bg-white/90 dark:bg-gray-800/90 text-black dark:text-white">Days</option>
                <option value="months" className="bg-white/90 dark:bg-gray-800/90 text-black dark:text-white">Months</option>
              </select>
            </div>
          </div>

          {/* Stream Type - Full Width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Stream Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Linear Stream */}
              <div
                onClick={() => setStreamType('linear')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  streamType === 'linear'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md'
                    : 'border-white/20 dark:border-gray-600/30 bg-white/5 dark:bg-gray-700/10 hover:border-blue-300 dark:hover:border-blue-400'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  {/* Linear Flow Icon */}
                  <div className="relative w-12 h-8">
                    <svg viewBox="0 0 48 32" className="w-full h-full">
                      <defs>
                        <linearGradient id="linearGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M4 28 L44 4"
                        stroke="url(#linearGrad)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <circle cx="4" cy="28" r="2" fill="#3B82F6" />
                      <circle cx="44" cy="4" r="2" fill="#10B981" />
                    </svg>
                  </div>
                  <h4 className={`font-semibold text-sm ${
                    streamType === 'linear' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Linear Stream
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Constant flow rate throughout duration
                  </p>
                </div>
              </div>

              {/* Cliff Vesting */}
              <div
                onClick={() => setStreamType('cliff')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  streamType === 'cliff'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md'
                    : 'border-white/20 dark:border-gray-600/30 bg-white/5 dark:bg-gray-700/10 hover:border-blue-300 dark:hover:border-blue-400'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  {/* Cliff Flow Icon */}
                  <div className="relative w-12 h-8">
                    <svg viewBox="0 0 48 32" className="w-full h-full">
                      <defs>
                        <linearGradient id="cliffGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#EF4444" />
                          <stop offset="60%" stopColor="#EF4444" />
                          <stop offset="60%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                      {/* Flat line (cliff period) */}
                      <path
                        d="M4 28 L28 28"
                        stroke="#EF4444"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* Vertical drop (cliff end) */}
                      <path
                        d="M28 28 L28 16"
                        stroke="#F59E0B"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* Sloped line (vesting period) */}
                      <path
                        d="M28 16 L44 4"
                        stroke="#10B981"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <circle cx="4" cy="28" r="2" fill="#EF4444" />
                      <circle cx="28" cy="28" r="2" fill="#F59E0B" />
                      <circle cx="44" cy="4" r="2" fill="#10B981" />
                    </svg>
                  </div>
                  <h4 className={`font-semibold text-sm ${
                    streamType === 'cliff' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Cliff Vesting
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    No tokens until cliff, then linear
                  </p>
                </div>
              </div>

              {/* Custom Schedule */}
              <div
                onClick={() => setStreamType('custom')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  streamType === 'custom'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md'
                    : 'border-white/20 dark:border-gray-600/30 bg-white/5 dark:bg-gray-700/10 hover:border-blue-300 dark:hover:border-blue-400'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  {/* Custom Flow Icon */}
                  <div className="relative w-12 h-8">
                    <svg viewBox="0 0 48 32" className="w-full h-full">
                      <defs>
                        <linearGradient id="customGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="50%" stopColor="#EC4899" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                      {/* Curved custom path */}
                      <path
                        d="M4 28 Q16 20 24 24 Q32 28 44 4"
                        stroke="url(#customGrad)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <circle cx="4" cy="28" r="2" fill="#8B5CF6" />
                      <circle cx="24" cy="24" r="1.5" fill="#EC4899" />
                      <circle cx="44" cy="4" r="2" fill="#10B981" />
                    </svg>
                  </div>
                  <h4 className={`font-semibold text-sm ${
                    streamType === 'custom' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Custom Schedule
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Define your own vesting curve
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cliff Period (if cliff selected) */}
          {streamType === 'cliff' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliff Period (Hours)
              </label>
              <input
                type="number"
                value={cliffPeriod}
                onChange={(e) => setCliffPeriod(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-400/60 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white caret-black dark:caret-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                autoComplete="off"
              />
            </div>
          )}
        </div>

        {/* Stream Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <input
                  type="text"
                  placeholder="Enter description (if any)"
                  className="w-full px-3 py-2 border border-white/20 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  id="tokenSymbol"
                />
        </div>

        {/* Start Options */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Stream starts immediately upon creation
            </span>
          </div>

          {/* Additional Options */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowCancellation"
                checked={allowCancellation}
                onChange={(e) => setAllowCancellation(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="allowCancellation" className="text-sm text-gray-700 dark:text-gray-300">
                Allow cancellation
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enablePartialClaims"
                checked={enablePartialClaims}
                onChange={(e) => setEnablePartialClaims(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="enablePartialClaims" className="text-sm text-gray-700 dark:text-gray-300">
                Enable partial claims
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recipients Section */}
      <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 dark:border-gray-700/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-white flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-500" />
            Stream Recipients ({recipients.length})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddRecipientModal(true)}
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Recipient
            </button>
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200"
            >
              <Upload className="h-4 w-4 mr-1" />
              Bulk Upload
            </button>
          </div>
        </div>
        
        {recipients.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Play className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-lg text-gray-500 dark:text-gray-400">No recipients added yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add recipients to start creating your stream</p>
          </div>
        ) : (
          <div className="space-y-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-6 px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-transparent backdrop-blur-sm">
              <div className="text-sm font-semibold text-black dark:text-gray-300">Recipient Address</div>
              <div className="text-sm font-semibold text-black dark:text-gray-300">Amount ({selectedToken})</div>
              <div className="text-sm font-semibold text-black dark:text-gray-300">Duration (Hours)</div>
              <div className="text-sm font-semibold text-black dark:text-gray-300">Flow Rate</div>
              <div className="text-sm font-semibold text-black dark:text-gray-300 text-right">Actions</div>
            </div>
            
            {recipients.map((recipient, index) => {
              const flowRate = recipient.duration && recipient.amount 
                ? (parseFloat(recipient.amount) / parseFloat(recipient.duration)).toFixed(6)
                : '0';
              
              return (
                <div key={index} className="grid grid-cols-5 gap-6 px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="text-sm font-mono text-black dark:text-gray-300 truncate">
                    {recipient.address || 'Not set'}
                  </div>
                  <div className="text-sm font-medium">
                    {recipient.amount || '0'} {selectedToken}
                  </div>
                  <div className="text-sm">
                    {recipient.duration || defaultDuration} {getDurationDisplayText(durationUnit).toLowerCase()}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {flowRate} {selectedToken}/hr
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingIndex(index)
                        setNewRecipientAddress(recipient.address)
                        setNewRecipientAmount(recipient.amount)
                        setShowAddRecipientModal(true)
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setRecipients(recipients.filter((_, i) => i !== index))}
                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary */}
        {recipients.length > 0 && (
          <div className="mt-4 p-4 bg-transparent border border-white/20 dark:border-gray-600/30 rounded-lg backdrop-blur-sm">
            <div className="flex justify-between items-center text-sm">
              <span className="text-black dark:text-gray-300">Total Recipients:</span>
              <span className="font-semibold text-black dark:text-white">{recipients.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-black dark:text-gray-300">Total Amount:</span>
              <span className="font-semibold text-black dark:text-white">{totalAmount} {selectedToken}</span>
            </div>
          </div>
        )}
      </div>

      {/* Create Button */}
      <div className="flex justify-center">
        <button
          onClick={createBulkStreams}
          disabled={!isConnected || isCreating || isPending}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center text-lg shadow-lg"
        >
          {isCreating || isPending ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              {isPending ? 'Confirming...' : 'Creating Stream...'}
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              {isConnected ? 'Create Stream' : 'Connect Wallet to Create Stream'}
            </>
          )}
        </button>
      </div>
    </div>
  )

  // Claim Stream Content
  const ClaimStreamContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-black dark:text-white flex items-center">
          <Activity className="h-6 w-6 mr-2 text-blue-500" />
          Active Streams
        </h3>
        <div className="flex items-center space-x-3">
          {selectedStreamIds.length > 0 && (
            <button
              onClick={handleBulkClaim}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Claim Selected ({selectedStreamIds.length})
            </button>
          )}
          <button
            onClick={fetchClaimableStreams}
            disabled={!isConnected || isCheckingClaims}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingClaims ? 'animate-spin' : ''}`} />
            {isCheckingClaims ? 'Checking...' : 'Refresh'}
          </button>
        </div>
      </div>

      {!isConnected ? (
        <div className="text-center py-16 bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-xl border border-white/10 dark:border-gray-700/30">
          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20 w-fit mx-auto mb-4">
            <Wallet className="w-10 h-10 text-blue-600 dark:text-blue-300" />
          </div>
          <p className="text-xl dark:text-gray-300 text-gray-600 mb-2">
            Connect Your Wallet
          </p>
          <p className="text-sm dark:text-gray-400 text-gray-500">
            Connect your wallet to view and claim available streams
          </p>
        </div>
      ) : claimableStreams.length === 0 ? (
        <div className="text-center py-16 bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-xl border border-white/10 dark:border-gray-700/30">
          <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-4">
            <Clock className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl dark:text-gray-300 text-gray-600 mb-2">
            No Active Streams
          </p>
          <p className="text-sm dark:text-gray-400 text-gray-500">
            You don't have any active streams to claim from
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claimableStreams.map((stream) => (
            <div key={stream.streamId} className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 dark:border-gray-700/30 hover:bg-white/10 dark:hover:bg-gray-700/20 transition-all duration-200">
                  <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedStreamIds.includes(stream.streamId.toString())}
                    onChange={(e) => {
                      const streamIdStr = stream.streamId.toString()
                      if (e.target.checked) {
                        setSelectedStreamIds([...selectedStreamIds, streamIdStr])
                      } else {
                        setSelectedStreamIds(selectedStreamIds.filter(id => id !== streamIdStr))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-semibold text-black dark:text-white">
                        Stream #{stream.streamId.toString()}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stream.status)}`}>
                        {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      From: {stream.sender.slice(0, 6)}...{stream.sender.slice(-4)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleClaimStream(stream)}
                  disabled={stream.claimableAmount === BigInt(0)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Claim {formatUnits(stream.claimableAmount, 18)} {stream.tokenSymbol}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
                  <p className="text-sm font-semibold">{formatUnits(stream.totalAmount, 18)} {stream.tokenSymbol}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Claimed</p>
                  <p className="text-sm font-semibold">{formatUnits(stream.claimedAmount, 18)} {stream.tokenSymbol}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Flow Rate</p>
                  <p className="text-sm font-semibold">
                    {stream.flowRatePerHour ? stream.flowRatePerHour.toFixed(6) : '0.000000'} {stream.tokenSymbol}/hr
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
                  <p className="text-sm font-semibold">{stream.progress}%</p>
                </div>
              </div>              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Started: {formatDate(stream.startTime)}</span>
                  <span>Ends: {formatDate(stream.endTime)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stream.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
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
            

            {/* Header with Title and Token Selector */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-black dark:text-white flex items-center">
                
                Token Streaming
              </h1>
              
              {/* Token Selector in Header */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <select
                    value={selectedToken}
                    onChange={(e) => handleTokenSelection(e.target.value)}
                    className="px-4 py-2 pr-8 text-sm border border-white/20 dark:border-gray-600/30 bg-white/10 dark:bg-gray-700/10 backdrop-blur-md dark:text-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg appearance-none cursor-pointer shadow-lg"
                  >
                    <option value="U2U" className="bg-white/90 dark:bg-gray-800/90 text-black dark:text-white">U2U (Native)</option>
                    {customTokens.map((token) => (
                      <option key={token.symbol} value={token.symbol} className="bg-white/90 dark:bg-gray-800/90 text-black dark:text-white">
                        {token.symbol}
                      </option>
                    ))}
                    <option value="add_token" className="bg-white/90 dark:bg-gray-800/90 text-black dark:text-white">+ Add Token</option>
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
            <div className="flex space-x-3 mb-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                  activeTab === 'create'
                    ? 'bg-white/20 dark:bg-gray-700/50 shadow-md text-black dark:text-white border border-white/20 dark:border-gray-600'
                    : 'text-black dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-800/30'
                }`}
              >
                <Play className="h-4 w-4 mr-1.5" />
                Create Stream
              </button>
              <button
                onClick={() => setActiveTab('claim')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                  activeTab === 'claim'
                    ? 'bg-white/20 dark:bg-gray-700/50 shadow-md text-black dark:text-white border border-white/20 dark:border-gray-600'
                    : 'text-black dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-800/30'
                }`}
              >
                <DollarSign className="h-4 w-4 mr-1.5" />
                Claim Streams
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
                      Streaming Contract Not Available
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      The streaming contract is not deployed on {networkName}. Please switch to U2U Mainnet or U2U Testnet to use this feature.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="w-full max-w-6xl">
            <div className="bg-transparent rounded-xl">
              {isContractAvailable ? (
                <>
                  {activeTab === 'create' && <CreateStreamContent />}
                  {activeTab === 'claim' && <ClaimStreamContent />}
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-4">
                    <Zap className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Streaming Feature Unavailable
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please switch to U2U Mainnet or U2U Testnet to use the streaming feature.
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
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Zap className="w-10 h-10 text-blue-600 dark:text-blue-300" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
                Connect Your Wallet
              </h2>
              <p className="text-black dark:text-gray-300 text-base sm:text-lg max-w-md mx-auto">
                Connect your wallet to access streaming features and manage your token streams.
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black/90 backdrop-blur-md rounded-xl p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-white/20">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
              {editingIndex !== null ? 'Edit Recipient' : 'Add Recipient'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Address *
                </label>
                <input
                  type="text"
                  value={newRecipientAddress}
                  onChange={(e) => setNewRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-400/60 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white caret-black dark:caret-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ({selectedToken}) *
                </label>
                <input
                  type="number"
                  value={newRecipientAmount}
                  onChange={(e) => setNewRecipientAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-400/60 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white caret-black dark:caret-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Duration: {defaultDuration} {getDurationDisplayText(durationUnit).toLowerCase()} (uses stream default)
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddRecipientModal(false)
                  setNewRecipientAddress('')
                  setNewRecipientAmount('')
                  setEditingIndex(null)
                }}
                className="px-4 py-2 text-black dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecipient}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {editingIndex !== null ? 'Update' : 'Add'} Recipient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black/90 backdrop-blur-md rounded-xl p-6 w-full max-w-lg mx-4 border border-gray-200 dark:border-white/20">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
              Bulk Upload Recipients
            </h3>
            
            <div className="space-y-4">
              {/* CSV Template Download */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Need a template?</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Download CSV template with example data</p>
                </div>
                <button
                  onClick={downloadCsvTemplate}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Template
                </button>
              </div>
              
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-400/60 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white caret-black dark:caret-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {csvFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    File selected: {csvFile.name}
                  </p>
                )}
              </div>
              
              <div className="text-center text-gray-500 dark:text-gray-400">OR</div>
              
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste CSV Data
                </label>
                <textarea
                  value={bulkUploadData}
                  onChange={(e) => setBulkUploadData(e.target.value)}
                  placeholder="address,amount\n0x123...,100.5\n0x456...,250.0"
                  rows={4}
                  className="w-full px-3 py-2 border border-white/20 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none font-mono text-sm"
                />
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Format: address,amount (one per line). Duration will use stream default ({defaultDuration} hours).
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkUploadModal(false)
                  setBulkUploadData('')
                  setCsvFile(null)
                }}
                className="px-4 py-2 text-black dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={!csvFile && !bulkUploadData.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                Upload Recipients
              </button>
            </div>
          </div>
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

      {/* Custom Token Modal */}
      {showCustomTokenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black/90 backdrop-blur-md rounded-xl p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-white/20">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
              Add Custom Token
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Symbol *
                </label>
                <input
                  type="text"
                  placeholder="e.g., USDC"
                  className="w-full px-3 py-2 border border-white/20 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  id="tokenSymbol"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Address *
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-white/20 dark:border-gray-600/30 rounded-md bg-white/10 dark:bg-gray-700/10 backdrop-blur-md text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  id="tokenAddress"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCustomTokenModal(false)}
                className="px-4 py-2 text-black dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const symbolInput = document.getElementById('tokenSymbol') as HTMLInputElement
                  const addressInput = document.getElementById('tokenAddress') as HTMLInputElement
                  
                  if (symbolInput?.value && addressInput?.value) {
                    handleAddCustomToken(symbolInput.value, addressInput.value)
                  } else {
                    toast.error('Please fill in all fields')
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Add Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <PaymentConfigProvider>
      <StreamingPage />
    </PaymentConfigProvider>
  )
}
