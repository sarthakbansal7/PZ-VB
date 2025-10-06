"use client"

import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { FileText, Wallet, CreditCard, CheckCircle, Clock, Home, Copy, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from "react-hot-toast"
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Types for invoice data
interface Invoice {
  id: string;
  name: string;
  details: string;
  amount: string;
  creator: string;
  isPaid: boolean;
  paidBy?: string;
  paidAt?: string;
  createdAt: string;
}

export default function PayInvoicePage() {
  // Get invoice ID from URL params
  const params = useParams()
  const invoiceId = params?.id as string
  
  // State management
  const [isMounted, setIsMounted] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Wallet connection
  const { address, isConnected } = useAccount()

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
    if (invoiceId) {
      fetchInvoice(invoiceId)
    }
  }, [invoiceId])

  // Mock function to fetch invoice details (replace with actual contract call)
  const fetchInvoice = async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock invoice data - replace with actual contract call
      const mockInvoices: { [key: string]: Invoice } = {
        '1': {
          id: '1',
          name: 'Web Development Services',
          details: 'Frontend development for e-commerce platform including responsive design, payment integration, and user authentication.',
          amount: '2.5',
          creator: '0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8',
          isPaid: true,
          paidBy: '0x123F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C9',
          paidAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        '2': {
          id: '2',
          name: 'Smart Contract Audit',
          details: 'Comprehensive security audit for DeFi protocol including vulnerability assessment and gas optimization recommendations.',
          amount: '5.0',
          creator: '0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8',
          isPaid: false,
          createdAt: new Date(Date.now() - 43200000).toISOString()
        },
        '3': {
          id: '3',
          name: 'Design Consultation',
          details: 'UI/UX design consultation for mobile app including wireframes, prototypes, and user experience analysis.',
          amount: '1.2',
          creator: '0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8',
          isPaid: false,
          createdAt: new Date().toISOString()
        }
      }
      
      const foundInvoice = mockInvoices[id]
      if (foundInvoice) {
        setInvoice(foundInvoice)
      } else {
        setError('Invoice not found')
      }
    } catch (err) {
      setError('Failed to load invoice')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle payment
  const handlePayInvoice = async () => {
    if (!invoice || !isConnected) return
    
    setIsPaying(true)
    
    try {
      // Simulate payment processing (replace with actual contract call)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Update invoice status
      const updatedInvoice = {
        ...invoice,
        isPaid: true,
        paidBy: address,
        paidAt: new Date().toISOString()
      }
      
      setInvoice(updatedInvoice)
      toast.success('Payment successful!')
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsPaying(false)
    }
  }

  // Copy invoice link to clipboard
  const copyInvoiceLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Invoice link copied to clipboard!')
  }

  // Format date nicely
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
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
            {invoiceId ? `Invoice #${invoiceId}` : 'Loading invoice...'}
          </p>
        </div>

        {/* Main Content */}
        {isLoading ? (
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
            {/* Invoice Details Card */}
            <div className="bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-black dark:text-white mb-2">{invoice.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Created on {formatDate(invoice.createdAt)}
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
                  {invoice.amount} ETH
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
                            navigator.clipboard.writeText(invoice.paidBy!)
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
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{invoice.amount} ETH</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePayInvoice}
                      disabled={isPaying}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center text-lg"
                    >
                      {isPaying ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-3" />
                          Pay {invoice.amount} ETH
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Payment will be processed securely on the blockchain. Make sure you have sufficient ETH balance and gas fees.
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
