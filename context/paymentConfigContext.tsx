"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { allMainnetChains as chains } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain as tokens } from '@/lib/evm-tokens-mainnet';

export interface PaymentConfig {
  selectedChain: any;
  selectedToken: any;
  exchangeRate: number;
  selectedTokenSymbol: string;
  isConfigured: boolean;
}

interface PaymentConfigContextType {
  config: PaymentConfig;
  updateConfig: (config: Partial<PaymentConfig>) => void;
  showConfigModal: boolean;
  setShowConfigModal: (show: boolean) => void;
  resetConfig: () => void;
}

const defaultConfig: PaymentConfig = {
  selectedChain: chains[0],
  selectedToken: tokens[chains[0].id][0],
  exchangeRate: 1,
  selectedTokenSymbol: "",
  isConfigured: false,
};

const PaymentConfigContext = createContext<PaymentConfigContextType | undefined>(undefined);

export const PaymentConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PaymentConfig>(defaultConfig);
  const [showConfigModal, setShowConfigModal] = useState(true); // Show on first load

  const updateConfig = (newConfig: Partial<PaymentConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig,
      isConfigured: true, // Mark as configured when any update happens
    }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    setShowConfigModal(true);
  };

  return (
    <PaymentConfigContext.Provider value={{
      config,
      updateConfig,
      showConfigModal,
      setShowConfigModal,
      resetConfig,
    }}>
      {children}
    </PaymentConfigContext.Provider>
  );
};

export const usePaymentConfig = () => {
  const context = useContext(PaymentConfigContext);
  if (context === undefined) {
    // Return default values during SSR or when provider is not available
    // This prevents build errors during static generation
    return {
      config: defaultConfig,
      updateConfig: () => {}, // No-op function
      showConfigModal: false, // Don't show modal during SSR
      setShowConfigModal: () => {}, // No-op function
      resetConfig: () => {}, // No-op function
    };
  }
  return context;
};