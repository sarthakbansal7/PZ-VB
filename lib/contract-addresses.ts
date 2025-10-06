// Contract Addresses Configuration
// This file contains all deployed contract addresses for different networks

export interface ContractAddresses {
  bulkTransfer: string;
  airdrop: string;
  payroll: string;
  stream: string;
  invoices: string;
  // Add more contracts here as needed
  // dao?: string;
}

export interface NetworkContracts {
  [chainId: number]: ContractAddresses;
}

// U2U Mainnet Chain ID
export const U2U_MAINNET_CHAIN_ID = 39;
// U2U Testnet Chain ID
export const U2U_TESTNET_CHAIN_ID = 2484;

// Contract addresses for different networks
export const CONTRACT_ADDRESSES: NetworkContracts = {
  // U2U Mainnet
  [U2U_MAINNET_CHAIN_ID]: {
    bulkTransfer: "0xbb7E1b1Ef5c36fC4aE96879Ea3c4586B68569cAC",
    airdrop: "0xDfcB96A9A5744CdfB173C36849Af5bD7343DAb7E",
    payroll: "0x463c2b415329e199a936381b09b7499e7E68d7F9",
    stream: "0x41353BAFF99bAB4AfE2bb6acF040C8C75B80137f",
    invoices: "0x0A51554c3a743A62fcb6a633cf04CB2e0cd14169",
  },
  
  // U2U Testnet
  [U2U_TESTNET_CHAIN_ID]: {
    bulkTransfer: "0x071A4FCcEEe657c8d4729F664957e1777f6A719E",
    airdrop: "0x563442Ec415De8444059A46fc09F0F552AE8661a",
    payroll: "0xbb7E1b1Ef5c36fC4aE96879Ea3c4586B68569cAC",
    stream: "0x463c2b415329e199a936381b09b7499e7E68d7F9",
    invoices: "0x288dB1ee3701C3215F4dA5BF1A0d3B2CC8a8185f",
  },
  
  // Add more networks as needed
  // 1: { // Ethereum Mainnet
  //   bulkTransfer: "0x...",
  // },
  // 137: { // Polygon
  //   bulkTransfer: "0x...",
  // },
};

// Native token address (used for ETH/U2U transfers)
export const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

// Helper function to get contract address for current chain
export const getContractAddress = (chainId: number, contractName: keyof ContractAddresses): string | undefined => {
  return CONTRACT_ADDRESSES[chainId]?.[contractName];
};

// Helper function to get BulkTransfer contract address
export const getBulkTransferAddress = (chainId: number): string | undefined => {
  return getContractAddress(chainId, 'bulkTransfer');
};

// Helper function to get Airdrop contract address
export const getAirdropAddress = (chainId: number): string | undefined => {
  return getContractAddress(chainId, 'airdrop');
};

// Helper function to get Payroll contract address
export const getPayrollAddress = (chainId: number): string | undefined => {
  return getContractAddress(chainId, 'payroll');
};

// Helper function to get Stream contract address
export const getStreamAddress = (chainId: number): string | undefined => {
  return getContractAddress(chainId, 'stream');
};

// Helper function to get Invoices contract address
export const getInvoicesAddress = (chainId: number): string | undefined => {
  return getContractAddress(chainId, 'invoices');
};

export default CONTRACT_ADDRESSES;