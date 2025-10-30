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

// Flow EVM Chain IDs
export const FLOW_MAINNET_CHAIN_ID = 747;
export const FLOW_TESTNET_CHAIN_ID = 545;

// Contract addresses for different networks
export const CONTRACT_ADDRESSES: NetworkContracts = {
  // Flow EVM Mainnet
  [FLOW_MAINNET_CHAIN_ID]: {
    airdrop: "0x563442Ec415De8444059A46fc09F0F552AE8661a", // Placeholder - update with actual mainnet addresses
    bulkTransfer: "0xDfcB96A9A5744CdfB173C36849Af5bD7343DAb7E", // Placeholder - update with actual mainnet addresses
    stream: "0xbb7E1b1Ef5c36fC4aE96879Ea3c4586B68569cAC", // Placeholder - update with actual mainnet addresses
    payroll: "0x0A51554c3a743A62fcb6a633cf04CB2e0cd14169", // Placeholder - update with actual mainnet addresses
    invoices: "0x41353BAFF99bAB4AfE2bb6acF040C8C75B80137f", // Placeholder - update with actual mainnet addresses
  },
  // Flow EVM Testnet
  [FLOW_TESTNET_CHAIN_ID]: {
    airdrop: "0x563442Ec415De8444059A46fc09F0F552AE8661a",
    bulkTransfer: "0xDfcB96A9A5744CdfB173C36849Af5bD7343DAb7E",
    stream: "0xbb7E1b1Ef5c36fC4aE96879Ea3c4586B68569cAC",
    payroll: "0x0A51554c3a743A62fcb6a633cf04CB2e0cd14169",
    invoices: "0x41353BAFF99bAB4AfE2bb6acF040C8C75B80137f",
  },
};

// Native token address (used for ETH/FLOW transfers)
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