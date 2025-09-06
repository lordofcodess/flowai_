import { createPublicClient, createWalletClient, http, parseEther, formatEther, getContract } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Base Account Abstraction Service
export class BaseAccountService {
  private publicClient: any;
  private walletClient: any;
  private account: any;
  private chainId: number;

  constructor(chainId: number = baseSepolia.id, privateKey?: string) {
    this.chainId = chainId;
    const chain = chainId === base.id ? base : baseSepolia;
    
    this.publicClient = createPublicClient({
      chain,
      transport: http()
    });

    if (privateKey) {
      this.account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain,
        transport: http()
      });
    }
  }

  // Get account balance
  async getBalance(address: `0x${string}`): Promise<string> {
    try {
      const balance = await this.publicClient.getBalance({ address });
      return formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get account balance');
    }
  }

  // Get account nonce
  async getNonce(address: `0x${string}`): Promise<number> {
    try {
      return await this.publicClient.getTransactionCount({ address });
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw new Error('Failed to get account nonce');
    }
  }

  // Check if account exists
  async accountExists(address: `0x${string}`): Promise<boolean> {
    try {
      const code = await this.publicClient.getCode({ address });
      return code !== '0x';
    } catch (error) {
      console.error('Error checking account existence:', error);
      return false;
    }
  }

  // Get account info
  async getAccountInfo(address: `0x${string}`) {
    try {
      const [balance, nonce, exists] = await Promise.all([
        this.getBalance(address),
        this.getNonce(address),
        this.accountExists(address)
      ]);

      return {
        address,
        balance,
        nonce,
        exists,
        chainId: this.chainId,
        chainName: this.chainId === base.id ? 'Base Mainnet' : 'Base Sepolia'
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      throw new Error('Failed to get account information');
    }
  }

  // Create a new account (for testing purposes)
  createAccount() {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized');
    }
    return this.account;
  }

  // Get current account
  getCurrentAccount() {
    return this.account;
  }

  // Switch chain
  switchChain(newChainId: number) {
    const chain = newChainId === base.id ? base : baseSepolia;
    this.chainId = newChainId;
    
    this.publicClient = createPublicClient({
      chain,
      transport: http()
    });

    if (this.account) {
      this.walletClient = createWalletClient({
        account: this.account,
        chain,
        transport: http()
      });
    }
  }

  // Get supported chains
  getSupportedChains() {
    return [
      { id: base.id, name: 'Base Mainnet', testnet: false },
      { id: baseSepolia.id, name: 'Base Sepolia', testnet: true }
    ];
  }
}

// Factory function to create Base account service
export function createBaseAccountService(chainId?: number, privateKey?: string) {
  return new BaseAccountService(chainId, privateKey);
}

// Utility functions
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidAddress = (address: string): address is `0x${string}` => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const formatBalance = (balance: string, decimals: number = 4) => {
  const num = parseFloat(balance);
  return num.toFixed(decimals);
};
