import {
    flowMainnet,
    flowTestnet
} from "./evm-chains-mainnet";

// Export the native address constant
export const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

export const contractMainnetAddresses = {
    [flowMainnet.id]: '0xDfcB96A9A5744CdfB173C36849Af5bD7343DAb7E', // Placeholder - update with actual mainnet address
    [flowTestnet.id]: '0xDfcB96A9A5744CdfB173C36849Af5bD7343DAb7E',
};

// Token interface with optional priceFeed field
export interface Token {
    symbol: string;
    address: string;
    decimals: number;
    priceFeed?: string;
}

export const tokensPerMainnetChain: { [chainId: number]: Token[] } = {
    [flowMainnet.id]: [
        {
            symbol: 'FLOW',
            address: NATIVE_ADDRESS,
            decimals: 18,
            priceFeed: ''
        },
        {
            symbol: 'USDT',
            address: '0x4d21582f50Fb5D211fd69ABF065AD07E8738870D', // Placeholder - update with actual mainnet address
            decimals: 6,
            priceFeed: ''
        },
        {
            symbol: 'USDC',
            address: '0x2eD344c586303C98FC3c6D5B42C5616ED42f9D9d', // Placeholder - update with actual mainnet address
            decimals: 6,
            priceFeed: ''
        },
    ],
    [flowTestnet.id]: [
        {
            symbol: 'FLOW',
            address: NATIVE_ADDRESS,
            decimals: 18,
            priceFeed: ''
        },
        {
            symbol: 'USDT',
            address: '0x4d21582f50Fb5D211fd69ABF065AD07E8738870D',
            decimals: 6,
            priceFeed: ''
        },
        {
            symbol: 'USDC',
            address: '0x2eD344c586303C98FC3c6D5B42C5616ED42f9D9d',
            decimals: 6,
            priceFeed: ''
        },
    ],
};
