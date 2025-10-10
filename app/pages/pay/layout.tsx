"use client";
import React, { useEffect, useState } from 'react';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { config } from '@/lib/wagmiConfig';
import { AuroraBackground } from '@/components/ui/aurora';

const queryClient = new QueryClient();

export default function InvoicesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        // Check for dark mode on mount
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };

        checkDarkMode();

        // Watch for theme changes
        const observer = new MutationObserver(() => {
            checkDarkMode();
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="container">
            <AuroraBackground>
                <WagmiProvider config={config}>
                    <QueryClientProvider client={queryClient}>
                        <RainbowKitProvider 
                            theme={isDarkMode 
                                ? darkTheme({
                                    accentColor: '#1f2937',
                                    accentColorForeground: 'white',
                                    borderRadius: 'medium',
                                    fontStack: 'system',
                                    overlayBlur: 'small',
                                })
                                : lightTheme({
                                    accentColor: '#3b82f6',
                                    accentColorForeground: 'white',
                                    borderRadius: 'medium',
                                    fontStack: 'system',
                                    overlayBlur: 'small',
                                })
                            }
                        >
                            {children}
                        </RainbowKitProvider>
                    </QueryClientProvider>
                </WagmiProvider>
            </AuroraBackground>
        </div>
    );
}