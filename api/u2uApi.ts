import axios, { AxiosInstance } from 'axios';

// Flow EVM Network Configurations
export const FLOW_MAINNET_CONFIG = {
  chainId: 747, // Flow EVM Mainnet chain ID
  rpcUrl: 'https://mainnet.evm.nodes.onflow.org',
  explorerUrl: 'https://evm.flowscan.io',
  name: 'Flow EVM Mainnet',
  currency: {
    name: 'FLOW',
    symbol: 'FLOW',
    decimals: 18,
  },
};

export const FLOW_TESTNET_CONFIG = {
  chainId: 545, // Flow EVM Testnet chain ID
  rpcUrl: 'https://testnet.evm.nodes.onflow.org',
  explorerUrl: 'https://evm-testnet.flowscan.io',
  name: 'Flow EVM Testnet',
  currency: {
    name: 'FLOW',
    symbol: 'FLOW',
    decimals: 18,
  },
};

// Network configuration map
export const FLOW_NETWORKS = {
  747: FLOW_MAINNET_CONFIG,
  545: FLOW_TESTNET_CONFIG,
};

// Create axios instance factory for Flow EVM RPC calls
const createFlowRpcClient = (chainId: number = 545): AxiosInstance => {
  const config = FLOW_NETWORKS[chainId as keyof typeof FLOW_NETWORKS];
  if (!config) {
    throw new Error(`Unsupported Flow EVM chain ID: ${chainId}`);
  }
  
  return axios.create({
    baseURL: config.rpcUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
  });
};

// Flow EVM API class with network support
export class FlowApi {
  private rpcClient: AxiosInstance;
  private config: typeof FLOW_MAINNET_CONFIG | typeof FLOW_TESTNET_CONFIG;

  constructor(chainId: number = 545) {
    this.config = FLOW_NETWORKS[chainId as keyof typeof FLOW_NETWORKS];
    if (!this.config) {
      throw new Error(`Unsupported Flow EVM chain ID: ${chainId}`);
    }
    this.rpcClient = createFlowRpcClient(chainId);
  }

  /**
   * Get the current block number
   */
  async getBlockNumber(): Promise<string> {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Get balance of an address
   */
  async getBalance(address: string): Promise<string> {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string) {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [txHash],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_getTransactionReceipt',
      params: [txHash],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<string> {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_gasPrice',
      params: [],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: {
    from?: string;
    to: string;
    value?: string;
    data?: string;
  }): Promise<string> {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_estimateGas',
      params: [transaction],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Call a contract method (read-only)
   */
  async call(transaction: {
    to: string;
    data: string;
  }, blockTag: string = 'latest') {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [transaction, blockTag],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Get transaction count (nonce) for an address
   */
  async getTransactionCount(address: string, blockTag: string = 'latest'): Promise<string> {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [address, blockTag],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Send raw transaction
   */
  async sendRawTransaction(signedTx: string): Promise<string> {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [signedTx],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Get logs for events
   */
  async getLogs(filter: {
    fromBlock?: string;
    toBlock?: string;
    address?: string | string[];
    topics?: (string | string[] | null)[];
  }) {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      params: [filter],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Get network chain ID
   */
  async getChainId(): Promise<string> {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
      id: 1,
    });
    return response.data.result;
  }

  /**
   * Health check for Flow EVM connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.rpcClient.post('', {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      });
      return true;
    } catch (error) {
      console.error(`Flow EVM ${this.config.name} health check failed:`, error);
      return false;
    }
  }

  /**
   * Get explorer URL for transaction
   */
  getExplorerTxUrl(txHash: string): string {
    return `${this.config.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Get explorer URL for address
   */
  getExplorerAddressUrl(address: string): string {
    return `${this.config.explorerUrl}/address/${address}`;
  }

  /**
   * Get network configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Utility function to convert hex to decimal
   */
  static hexToDecimal(hex: string): number {
    return parseInt(hex, 16);
  }

  /**
   * Utility function to convert decimal to hex
   */
  static decimalToHex(decimal: number): string {
    return `0x${decimal.toString(16)}`;
  }

  /**
   * Format FLOW balance from wei to FLOW
   */
  static formatBalance(balanceWei: string): string {
    const balance = BigInt(balanceWei);
    const flowBalance = Number(balance) / Math.pow(10, 18);
    return flowBalance.toFixed(6);
  }
}

// Legacy exports for backward compatibility (defaults to testnet)
export const flowApi = new FlowApi(545);

// Factory function to create FlowApi instances for different networks
export const createFlowApi = (chainId: number = 545): FlowApi => {
  return new FlowApi(chainId);
};

export default flowApi;