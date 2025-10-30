import { defineChain } from 'viem'
export const NATIVE_ADDRESS = `0x0000000000000000000000000000000000000000`

export const flowMainnet = defineChain({
    id: 747,
    name: 'Flow EVM Mainnet',
    nativeCurrency: { decimals: 18, name: 'FLOW', symbol: 'FLOW' },
    rpcUrls: {
        default: { http: ['https://mainnet.evm.nodes.onflow.org'] },
    },
    blockExplorers: {
        default: { name: 'FlowScan', url: 'https://evm.flowscan.io' },
    },
})

export const flowTestnet = defineChain({
    id: 545,
    name: 'Flow EVM Testnet',
    nativeCurrency: { decimals: 18, name: 'FLOW', symbol: 'FLOW' },
    rpcUrls: {
        default: { http: ['https://testnet.evm.nodes.onflow.org'] },
    },
    blockExplorers: {
        default: { name: 'FlowScan Testnet', url: 'https://evm-testnet.flowscan.io' },
    },
})

export const allMainnetChains = [
    flowMainnet,
    flowTestnet
]
