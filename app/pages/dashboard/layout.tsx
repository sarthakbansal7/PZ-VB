"use client";
import React from 'react';
import { RainbowKitProvider, darkTheme, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { config } from '@/lib/wagmiConfig';
import { AuroraBackground } from '@/components/ui/aurora';


const queryClient = new QueryClient();

export default function AirdropLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container">
            <AuroraBackground>
                <WagmiProvider config={config}>
                    <QueryClientProvider client={queryClient}>
                        <RainbowKitProvider 
                            theme={darkTheme()}
                            showRecentTransactions={true}
                        >
                            {children}
                        </RainbowKitProvider>
                    </QueryClientProvider>
                </WagmiProvider>
            </AuroraBackground>
        </div>
    );
}