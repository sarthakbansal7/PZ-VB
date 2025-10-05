import { getDefaultConfig, Chain } from '@rainbow-me/rainbowkit';

const u2uMainnet = {
    id: 39,
    name: 'Mainnet',
    iconUrl: 'https://u2u.xyz/favicon.ico',
    iconBackground: '#ffffff',
    nativeCurrency: { name: 'U2U', symbol: 'U2U', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc-mainnet.u2u.xyz'] },
    },
    blockExplorers: {
        default: { name: 'U2UScan', url: 'https://u2uscan.xyz' },
    },
} as const satisfies Chain;

const u2uTestnet = {
    id: 2484,
    name: 'Testnet',
    iconUrl: 'https://u2u.xyz/favicon.ico',
    iconBackground: '#ffffff',
    nativeCurrency: { name: 'U2U', symbol: 'U2U', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc-nebulas-testnet.u2u.xyz'] },
    },
    blockExplorers: {
        default: { name: 'U2UScan Testnet', url: 'https://testnet.u2uscan.xyz' },
    },
} as const satisfies Chain;

const config = getDefaultConfig({
    appName: 'PayZoll',
    projectId: '23c5e43972b3775ee6ed4f74f3e76efb',
    chains: [u2uMainnet, u2uTestnet],
});


export { config };
