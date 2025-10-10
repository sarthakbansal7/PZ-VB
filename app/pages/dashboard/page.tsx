"use client"

import React, { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Wallet, 
  Plus, 
  Users, 
  Zap, 
  Coins,
  Send,
  Gift,
  Home,
  ChevronRight,
  Activity,
  CreditCard,
  Menu,
  X,
  ChevronLeft,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { toast } from "react-hot-toast"

// Import actual service components
import InvoicesPage from '../invoices/page'
import AirdropPage from '../airdrop/page'
import StreamingPage from '../streaming/page'
import BulkPayoutPage from '../bulk/page'
import PaymentsPage from '../dao/page'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  description: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'bulk',
    label: 'Bulk Transfer',
    icon: <Send className="h-5 w-5" />,
    description: 'Send payments to multiple recipients at once'
  },
  {
    id: 'airdrop',
    label: 'Airdrops',
    icon: <Gift className="h-5 w-5" />,
    description: 'Distribute tokens to multiple wallets'
  },
  {
    id: 'streaming',
    label: 'Token Streaming',
    icon: <Zap className="h-5 w-5" />,
    description: 'Create continuous token streams'
  },
  {
    id: 'dao',
    label: 'DAO Payroll',
    icon: <Users className="h-5 w-5" />,
    description: 'Manage employee salary payments'
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: <FileText className="h-5 w-5" />,
    description: 'Create and manage payment invoices'
  }
]

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [activeService, setActiveService] = useState('bulk')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Wallet connection
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Set mounted state after hydration and check mobile
  useEffect(() => {
    setIsMounted(true)
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarCollapsed(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Render a placeholder during server rendering and initial hydration
  if (!isMounted) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="animate-pulse rounded-full h-16 w-16 bg-gray-200 dark:bg-gray-800"></div>
      </div>
    )
  }

  // Render content based on active service
  const renderActiveContent = () => {
    switch (activeService) {
      case 'bulk':
        return <BulkPayoutPage />
      case 'airdrop':
        return <AirdropPage />
      case 'streaming':
        return <StreamingPage />
      case 'dao':
        return <PaymentsPage />
      case 'invoices':
        return <InvoicesPage />
      default:
        return <BulkPayoutPage />
    }
  }

  return (
    <div className="relative min-h-screen w-screen dark:text-white text-black">
      {/* Home button - only show when sidebar collapsed */}
      {sidebarCollapsed && (
        <div className="absolute top-4 left-4 z-50">
          <Link href="/">
            <Home className="text-black dark:hover:text-gray-200 hover:text-gray-800 dark:text-white" size={24} />
          </Link>
        </div>
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Mobile Backdrop */}
        {isMobile && !sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`${
          sidebarCollapsed 
            ? (isMobile ? '-translate-x-full w-80' : 'w-16') 
            : 'w-80 translate-x-0'
        } ${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'} transition-all duration-300 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link href="/">
                      <Home className="h-5 w-5 text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
                    </Link>
                    <h1 className="text-xl font-bold text-black dark:text-white">PayZoll</h1>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">All your payment solutions in one place</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="p-1">
                  {/* Empty space for collapsed state - home button will be positioned absolutely */}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 py-6">
            <nav className="space-y-2 px-4">
              {sidebarItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveService(item.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center ${
                    activeService === item.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center">
                    <div className={`${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0`}>
                      {item.icon}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs opacity-75 mt-0.5">{item.description}</div>
                      </div>
                    )}
                  </div>
                  {!sidebarCollapsed && activeService === item.id && (
                    <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />
                  )}
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed ? (
              <div className="space-y-3">
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="w-full p-3 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Collapse
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all"
                  title="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {/* Mobile menu button for collapsed sidebar */}
            {isMobile && sidebarCollapsed && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-4 lg:p-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeService}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-auto"
                >
                  <div className="max-w-full">
                    {renderActiveContent()}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
