"use client"

import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { FileText, Wallet, CreditCard, CheckCircle, Clock, Home, Copy, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from "react-hot-toast"
import Link from 'next/link'
import { useParams } from 'next/navigation'
import InvoicesAbi from '../../../../lib/InvoicesAbi.json'
import { getInvoicesAddress } from '../../../../lib/contract-addresses'

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

export default function PayInvoicePage() {
  // Get invoice ID and network from URL params
  const params = useParams()
  const urlParam = params?.id as string
  
  // Parse invoice ID and network suffix from URL parameter
  const parseUrlParam = (param: string) => {
    if (!param) return { invoiceId: '', networkSuffix: 't', targetChainId: 545 }
    
    const lastChar = param.slice(-1).toLowerCase()
    if (lastChar === 'm' || lastChar === 't') {
      const invoiceId = param.slice(0, -1)
      const networkSuffix = lastChar
      const targetChainId = networkSuffix === 'm' ? 747 : 545 // 747 for Flow mainnet, 545 for Flow testnet
      return { invoiceId, networkSuffix, targetChainId }
    } else {
      // Legacy format without network suffix - default to testnet
      return { invoiceId: param, networkSuffix: 't', targetChainId: 545 }
    }
  }
  
  const { invoiceId, networkSuffix, targetChainId } = parseUrlParam(urlParam)
  
  // State management
  const [isMounted, setIsMounted] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Wallet connection
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Contract hooks
  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })
  
  // Get contract address based on URL network parameter
  const contractAddress = getInvoicesAddress(targetChainId)
  
  // Debug logs
  useEffect(() => {
    console.log('=== DEBUGGING INVOICE FETCH ===')
    console.log('URL Parameter:', urlParam)
    console.log('Parsed Invoice ID:', invoiceId)
    console.log('Network Suffix:', networkSuffix)
    console.log('Target Chain ID:', targetChainId)
    console.log('Current Chain ID:', chainId)
    console.log('Contract Address:', contractAddress)
    console.log('BigInt Invoice ID:', BigInt(invoiceId || '0'))
    console.log('Query enabled:', !!contractAddress && !!invoiceId && invoiceId !== '0')
  }, [urlParam, invoiceId, networkSuffix, targetChainId, chainId, contractAddress])
  
  // Read invoice details from contract using the target network
  const { 
    data: invoiceData, 
    isLoading: isLoadingInvoice, 
    error: invoiceError,
    refetch: refetchInvoice 
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: InvoicesAbi.abi,
    functionName: 'getInvoice',
    args: [BigInt(invoiceId || '0')],
    chainId: targetChainId, // Use the network specified in URL
    query: {
      enabled: !!contractAddress && !!invoiceId && invoiceId !== '0',
    },
  })
  
  // Debug contract call result
  useEffect(() => {
    console.log('=== CONTRACT CALL RESULT ===')
    console.log('Invoice Data:', invoiceData)
    console.log('Is Loading:', isLoadingInvoice)
    console.log('Error:', invoiceError)
  }, [invoiceData, isLoadingInvoice, invoiceError])
  
  // Wagmi public client for robust reads (viem-backed)
  const publicClient = usePublicClient()

  // Normalized on-chain invoice state
  const [onChainInvoice, setOnChainInvoice] = useState<Invoice | null>(null)
  
  // Network validation
  const isCorrectNetwork = chainId === targetChainId
  const getNetworkName = (chainId: number) => {
    return chainId === 747 ? 'Flow EVM Mainnet' : chainId === 545 ? 'Flow EVM Testnet' : `Chain ${chainId}`
  }
  const targetNetworkName = getNetworkName(targetChainId)
  const currentNetworkName = getNetworkName(chainId)

  // Normalize invoiceData when available, otherwise run fallback reads
  useEffect(() => {
    if (invoiceData) {
      try {
        const data = invoiceData as readonly [bigint, string, string, bigint, string, boolean, string, bigint]
        setOnChainInvoice({
          id: data[0],
          name: data[1],
          details: data[2],
          amount: data[3],
          creator: data[4],
          isPaid: data[5],
          paidBy: data[6],
          paidAt: data[7],
        })
        return
      } catch (e) {
        console.warn('Failed to normalize invoiceData, will try fallback read', e)
      }
    }

    const fetchInvoiceOnChain = async (idBig: bigint) => {
      if (!contractAddress) return null
      try {
        if (publicClient && typeof (publicClient as any).readContract === 'function') {
          try {
            const res: any = await (publicClient as any).readContract({
              address: contractAddress as `0x${string}`,
              abi: InvoicesAbi.abi,
              functionName: 'invoices',
              args: [idBig],
            })
            if (res) {
              setOnChainInvoice({
                id: res[0] as bigint,
                name: res[1] as string,
                details: res[2] as string,
                amount: res[3] as bigint,
                creator: res[4] as string,
                isPaid: res[5] as boolean,
                paidBy: res[6] as string,
                paidAt: res[7] as bigint,
              })
              return
            }
          } catch (e) {
            console.debug('publicClient.readContract(invoices) failed, trying getInvoice', e)
          }

          try {
            const res2: any = await (publicClient as any).readContract({
              address: contractAddress as `0x${string}`,
              abi: InvoicesAbi.abi,
              functionName: 'getInvoice',
              args: [idBig],
            })
            const r = Array.isArray(res2) && res2.length > 1 ? res2 : res2[0] ?? res2
            setOnChainInvoice({
              id: r[0] as bigint,
              name: r[1] as string,
              details: r[2] as string,
              amount: r[3] as bigint,
              creator: r[4] as string,
              isPaid: r[5] as boolean,
              paidBy: r[6] as string,
              paidAt: r[7] as bigint,
            })
            return
          } catch (e) {
            console.debug('publicClient.readContract(getInvoice) failed, will try ethers fallback', e)
          }
        }

        // ethers fallback + window.ethereum eth_call fallback
        try {
          const ethers = await import('ethers')
          const transportUrl = (publicClient as any)?.transport?.url
          const provider = transportUrl ? new ethers.JsonRpcProvider(transportUrl) : new ethers.JsonRpcProvider()
          const iface = new ethers.Interface(InvoicesAbi.abi as any)
          const calldata = iface.encodeFunctionData('getInvoice', [idBig])
          let raw: string | null = null
          try {
            raw = await provider.call({ to: contractAddress as `0x${string}`, data: calldata })
            console.debug('ethers fallback raw call data (provider.call):', raw)
          } catch (callErr) {
            console.debug('provider.call failed, attempting window.ethereum eth_call if available', callErr)
            try {
              const eth = (window as any)?.ethereum
              if (eth && typeof eth.request === 'function') {
                const resp = await eth.request({ method: 'eth_call', params: [{ to: contractAddress, data: calldata }, 'latest'] })
                raw = resp as string
                console.debug('ethers fallback raw call data (window.ethereum.eth_call):', raw)
              }
            } catch (ethCallErr) {
              console.debug('window.ethereum eth_call attempt failed', ethCallErr)
            }
          }

          if (!raw) throw new Error('No raw call data available from provider or wallet')

          let decoded: any
          try {
            decoded = iface.decodeFunctionResult('getInvoice', raw)
          } catch (dErr) {
            console.debug('ethers decode getInvoice failed, trying alternative signature', dErr)
            const altIface = new ethers.Interface([
              'function getInvoice(uint256) view returns (tuple(uint256 id,string name,string details,uint256 amount,address creator,bool isPaid,address paidBy,uint256 paidAt))'
            ])
            decoded = altIface.decodeFunctionResult('getInvoice', raw)
            if (Array.isArray(decoded) && decoded.length === 1) decoded = decoded[0]
          }

          setOnChainInvoice({
            id: decoded[0] as bigint,
            name: decoded[1] as string,
            details: decoded[2] as string,
            amount: decoded[3] as bigint,
            creator: decoded[4] as string,
            isPaid: decoded[5] as boolean,
            paidBy: decoded[6] as string,
            paidAt: decoded[7] as bigint,
          })
          return
        } catch (ethersErr) {
          console.error('ethers fallback failed for getInvoice:', ethersErr)
        }
      } catch (err) {
        console.error('Error fetching invoice on-chain:', err)
      }
      return null
    }

    (async () => {
      try {
        const idBig = BigInt(invoiceId || '0')
        await fetchInvoiceOnChain(idBig)
      } catch (e) {
        console.error('fetchInvoiceOnChain error', e)
      }
    })()
  }, [invoiceData, invoiceError, contractAddress, invoiceId, publicClient])

  // keep old variable name used in JSX
  const invoice = onChainInvoice

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Payment successful!')
      setIsPaying(false)
      // Refresh invoice data
      refetchInvoice()
    }
  }, [isConfirmed, refetchInvoice])

  // Handle write contract errors (user rejection, insufficient funds, etc.)
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError)
      setIsPaying(false)
      
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
      setIsPaying(false)
      toast.error('Transaction failed to complete')
    }
  }, [receiptError])

  // Reset paying state when transaction is no longer pending and not confirmed
  useEffect(() => {
    if (!isPending && !isConfirming && !isConfirmed && isPaying && !hash) {
      // Transaction was cancelled or failed before getting a hash
      setIsPaying(false)
    }
  }, [isPending, isConfirming, isConfirmed, isPaying, hash])
  
  // Handle payment errors
  useEffect(() => {
    if (invoiceError) {
      console.log('Invoice Error Details:', invoiceError)
      setError('Invoice not found or does not exist')
    } else {
      setError(null)
    }
  }, [invoiceError])

  // Handle case where contract address is not found
  useEffect(() => {
    if (!contractAddress && chainId) {
      console.log('No contract address found for chain ID:', chainId)
      setError(`Contract not deployed on current network (Chain ID: ${chainId}). Please switch to Flow EVM Mainnet or Flow EVM Testnet.`)
    }
  }, [contractAddress, chainId])

  // Handle payment
  const handlePayInvoice = async () => {
    if (!invoice || !contractAddress) {
      toast.error('Invoice not found')
      return
    }

    if (invoice.isPaid) {
      toast.error('Invoice is already paid')
      return
    }

    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!isCorrectNetwork) {
      toast.error(`Please switch to ${targetNetworkName} to pay this invoice`)
      return
    }

    setIsPaying(true)
    
    try {
      // Call payInvoice contract function with the exact amount in FLOW
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: InvoicesAbi.abi,
        functionName: 'payInvoice',
        args: [invoice.id],
        value: invoice.amount, // Send FLOW amount
      })
      
      // Note: Don't use toast.loading here as it persists. 
      // The loading state is managed by the button's disabled state and text.
    } catch (error: any) {
      console.error('Error paying invoice:', error)
      toast.error('Failed to initiate payment')
      setIsPaying(false)
    }
  }

  // Copy invoice link to clipboard
  const copyInvoiceLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Invoice link copied to clipboard!')
  }

  // Format date nicely
  const formatDate = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return 'Not set'
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Render a placeholder during server rendering and initial hydration
  if (!isMounted) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="animate-pulse rounded-full h-16 w-16 bg-gray-200 dark:bg-gray-800"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-screen dark:text-white text-black p-6">
      {/* Home button */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Home className="text-black dark:hover:text-gray-200 hover:text-gray-800 dark:text-white" size={30} />
        </Link>
      </div>

      <div className="flex flex-col max-w-4xl mx-auto mt-16">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Invoice Payment</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {invoiceId ? `Invoice #22018${invoiceId}` : 'Loading invoice...'}
          </p>
          {invoiceId && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Network: {targetNetworkName}
            </p>
          )}
        </div>

        {/* Main Content */}
        {isLoadingInvoice ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading invoice details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20 w-fit mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link href="/pages/invoices">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                View All Invoices
              </button>
            </Link>
          </div>
        ) : invoice ? (
          <div className="space-y-6">
            {/* Network Warning (if wrong network) */}
            {isConnected && !isCorrectNetwork && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3">⚠️</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Wrong Network Detected
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      This invoice is on <strong>{targetNetworkName}</strong> but you're connected to <strong>{currentNetworkName}</strong>. 
                      Please switch to {targetNetworkName} to pay this invoice.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Details Card */}
            <div className="bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-black dark:text-white mb-2">{invoice.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Invoice ID: #22018{invoice.id.toString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={copyInvoiceLink}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded"
                    title="Copy invoice link"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  {invoice.isPaid ? (
                    <div className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Paid</span>
                    </div>
                  ) : (
                    <div className="flex items-center px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              {invoice.details && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{invoice.details}</p>
                </div>
              )}

              {/* Amount */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Amount</h3>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatEther(invoice.amount)} FLOW
                </div>
              </div>

              {/* Creator Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Invoice Creator</h3>
                <div className="flex items-center space-x-2">
                  <code className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    {formatAddress(invoice.creator)}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(invoice.creator)
                      toast.success('Address copied!')
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Payment Info (if paid) */}
              {invoice.isPaid && invoice.paidBy && invoice.paidAt && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Paid By</p>
                      <div className="flex items-center space-x-2">
                        <code className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                          {formatAddress(invoice.paidBy)}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(invoice.paidBy)
                            toast.success('Address copied!')
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Date</p>
                      <p className="text-sm font-medium text-black dark:text-white">
                        {formatDate(invoice.paidAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Section */}
            {!invoice.isPaid && (
              <div className="bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-6">Make Payment</h3>
                
                {!isConnected ? (
                  <div className="text-center py-8">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 w-fit mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-2">Connect Your Wallet</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Connect your wallet to pay this invoice
                    </p>
                    <ConnectButton />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-300">Payment Amount</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{formatEther(invoice.amount)} FLOW</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePayInvoice}
                      disabled={isPaying || isPending || isConfirming || !isCorrectNetwork}
                      className={`w-full py-4 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center text-lg ${
                        !isCorrectNetwork 
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white'
                      }`}
                    >
                      {!isCorrectNetwork ? (
                        <>
                          ⚠️ Switch to {targetNetworkName}
                        </>
                      ) : isPaying || isPending || isConfirming ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Processing Payment...'}
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-3" />
                          Pay {formatEther(invoice.amount)} FLOW
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {!isCorrectNetwork ? (
                        <>You must be connected to {targetNetworkName} to pay this invoice.</>
                      ) : (
                        <>Payment will be processed securely on the blockchain. Make sure you have sufficient FLOW balance and gas fees.</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
