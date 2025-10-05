// Contract Addresses Configuration
// This file contains all deployed contract addresses for different networks

export interface ContractAddresses {
  bulkTransfer: string;
  airdrop: string;
  // Add more contracts here as needed
  // dao?: string;
}

export interface NetworkContracts {
  [chainId: number]: ContractAddresses;
}

// U2U Testnet Chain ID
export const U2U_TESTNET_CHAIN_ID = 2484; // Replace with actual U2U testnet chain ID

// Contract addresses for different networks
export const CONTRACT_ADDRESSES: NetworkContracts = {
  // U2U Testnet
  [U2U_TESTNET_CHAIN_ID]: {
    bulkTransfer: "0x071A4FCcEEe657c8d4729F664957e1777f6A719E",
    airdrop: "0x563442Ec415De8444059A46fc09F0F552AE8661a",
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

export default CONTRACT_ADDRESSES;