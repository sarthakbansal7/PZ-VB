import {
    u2uMainnet,
    u2uTestnet
} from "./evm-chains-mainnet";

// Export the native address constant
export const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

export const contractMainnetAddresses = {
    [u2uMainnet.id]: '0x071A4FCcEEe657c8d4729F664957e1777f6A719E',
    [u2uTestnet.id]: '0x071A4FCcEEe657c8d4729F664957e1777f6A719E',
};

// Token interface with optional priceFeed field
export interface Token {
    symbol: string;
    address: string;
    decimals: number;
    priceFeed?: string;
}

export const tokensPerMainnetChain: { [chainId: number]: Token[] } = {
    [u2uMainnet.id]: [
        {
            symbol: 'U2U',
            address: NATIVE_ADDRESS,
            decimals: 18,
            priceFeed: ''
        },
        {
            symbol: 'USDT',
            address: '0x7277Cc818e3F3FfBb169c6Da9CC77Fc2d2a34895',
            decimals: 6,
            priceFeed: ''
        },
        {
            symbol: 'USDC',
            address: '0x836d275563bAb5E93Fd6Ca62a95dB7065Da94342',
            decimals: 6,
            priceFeed: ''
        },
    ],
    [u2uTestnet.id]: [
        {
            symbol: 'U2U',
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
