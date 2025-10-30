import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { http, createConfig } from 'wagmi';

export const flowMainnet = defineChain({
    id: 747,
    name: 'Flow EVM Mainnet',
    nativeCurrency: { 
        name: 'FLOW', 
        symbol: 'FLOW', 
        decimals: 18 
    },
    rpcUrls: {
        default: { 
            http: ['https://mainnet.evm.nodes.onflow.org'] 
        },
    },
    blockExplorers: {
        default: { 
            name: 'FlowScan', 
            url: 'https://evm.flowscan.io' 
        },
    },
    testnet: false,
});

export const flowTestnet = defineChain({
    id: 545,
    name: 'Flow EVM Testnet',
    nativeCurrency: { 
        name: 'FLOW', 
        symbol: 'FLOW', 
        decimals: 18 
    },
    rpcUrls: {
        default: { 
            http: ['https://testnet.evm.nodes.onflow.org'] 
        },
    },
    blockExplorers: {
        default: { 
            name: 'FlowScan Testnet', 
            url: 'https://evm-testnet.flowscan.io' 
        },
    },
    testnet: true,
});

export const config = getDefaultConfig({
    appName: 'PayZoll - Web3 Finance Infrastructure',
    projectId: '23c5e43972b3775ee6ed4f74f3e76efb',
    chains: [flowMainnet, flowTestnet],
    transports: {
        [flowMainnet.id]: http(),
        [flowTestnet.id]: http(),
    },
    ssr: true,
});
