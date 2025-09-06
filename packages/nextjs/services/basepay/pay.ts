import { createPublicClient, createWalletClient, http, parseEther, formatEther, getContract, parseUnits, WalletClient, Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { BaseAccountService } from './baseaccount';
import { BaseAccountAbstraction, BaseAccountInfo } from './baseAccountAbstraction';
import { ERC20_ABI } from '../../abis/contracts/base';
import { getContractAddress } from '../../abis/contracts/base/constants';

// Utility function to validate Ethereum addresses
function validateAddress(address: string | null | undefined, context: string): asserts address is `0x${string}` {
  if (!address || address.length !== 42 || !address.startsWith('0x')) {
    throw new Error(`Invalid ${context} address format: ${address}`);
  }
}

export interface PaymentRequest {
  to: `0x${string}`;
  amount: string;
  token: 'ETH' | 'USDC';
  message?: string;
}

export interface PaymentResult {
  hash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  amount: string;
  token: string;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: bigint;
  blockNumber?: bigint;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address: string;
}

export class BasePayService {
  private accountService: BaseAccountService;
  private accountAbstraction: BaseAccountAbstraction;
  private publicClient: any;
  private walletClient: WalletClient | null;
  private chainId: number;
  private baseAccountAddress: Address | null = null;

  constructor(chainId: number = baseSepolia.id, walletClient?: WalletClient, privateKey?: string) {
    this.chainId = chainId;
    this.walletClient = walletClient || null;
    this.accountService = new BaseAccountService(chainId, privateKey);
    this.accountAbstraction = new BaseAccountAbstraction(chainId, walletClient);
    
    const chain = chainId === base.id ? base : baseSepolia;
    
    this.publicClient = createPublicClient({
      chain,
      transport: http()
    });

    // If no wallet client provided but private key is available, create one
    if (!this.walletClient && privateKey) {
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account,
        chain,
        transport: http()
      });
    }
  }

  // Method to set wallet client after initialization
  setWalletClient(walletClient: WalletClient) {
    this.walletClient = walletClient;
    this.accountAbstraction.setWalletClient(walletClient);
  }

  // Initialize Base account for the connected wallet
  async initializeBaseAccount(ownerAddress: Address): Promise<Address> {
    try {
      // Initialize Base account using the SDK
      const baseAccount = await this.accountAbstraction.initializeBaseAccount(ownerAddress);
      
      // Get the account address
      const accountAddress = this.accountAbstraction.getAccountAddress();
      this.baseAccountAddress = accountAddress;

      console.log('Base account initialized:', accountAddress);
      return accountAddress!;
    } catch (error) {
      console.error('Error initializing Base account:', error);
      throw new Error('Failed to initialize Base account');
    }
  }

  // Get Base account info
  async getBaseAccountInfo(ownerAddress: Address): Promise<BaseAccountInfo> {
    try {
      if (!this.baseAccountAddress) {
        this.baseAccountAddress = this.accountAbstraction.getAccountAddress();
      }
      if (!this.baseAccountAddress) {
        throw new Error('Base account not initialized');
      }
      return await this.accountAbstraction.getAccountInfo(this.baseAccountAddress);
    } catch (error) {
      console.error('Error getting Base account info:', error);
      throw new Error('Failed to get Base account info');
    }
  }

  // Send ETH payment through Base account (seamless)
  async sendETH(payment: PaymentRequest): Promise<PaymentResult> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      // Initialize Base account if not already done
      if (!this.baseAccountAddress) {
        await this.initializeBaseAccount(this.walletClient.account!.address);
      }

      // Use seamless Base account abstraction (no MetaMask popup)
      const hash = await this.accountAbstraction.sendETH(
        payment.to,
        payment.amount,
        payment.message
      );

      return {
        hash,
        from: this.baseAccountAddress! as `0x${string}`,
        to: payment.to,
        amount: payment.amount,
        token: 'ETH',
        status: 'pending'
      };
    } catch (error) {
      console.error('Error sending ETH:', error);
      throw new Error('Failed to send ETH payment');
    }
  }

  // Send USDC payment through Base account (seamless)
  async sendUSDC(payment: PaymentRequest): Promise<PaymentResult> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const usdcAddress = getContractAddress('USDC', this.chainId);
      if (!usdcAddress) {
        throw new Error('USDC not supported on this network');
      }

      // Initialize Base account if not already done
      if (!this.baseAccountAddress) {
        await this.initializeBaseAccount(this.walletClient.account!.address);
      }

      // Use seamless Base account abstraction (no MetaMask popup)
      const hash = await this.accountAbstraction.sendUSDC(
        payment.to,
        payment.amount,
        usdcAddress
      );

      return {
        hash,
        from: this.baseAccountAddress! as `0x${string}`,
        to: payment.to,
        amount: payment.amount,
        token: 'USDC',
        status: 'pending'
      };
    } catch (error) {
      console.error('Error sending USDC:', error);
      throw new Error('Failed to send USDC payment');
    }
  }

  // Send payment (auto-detect token type)
  async sendPayment(payment: PaymentRequest): Promise<PaymentResult> {
    if (payment.token === 'ETH') {
      return this.sendETH(payment);
    } else if (payment.token === 'USDC') {
      return this.sendUSDC(payment);
    } else {
      throw new Error('Unsupported token type');
    }
  }

  // Send batch payments (multiple recipients in one seamless transaction)
  async sendBatchPayments(
    payments: Array<{ to: `0x${string}`; amount: string; token: 'ETH' | 'USDC' }>
  ): Promise<PaymentResult> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      // Initialize Base account if not already done
      if (!this.baseAccountAddress) {
        await this.initializeBaseAccount(this.walletClient.account!.address);
      }

      // Convert payments to the format expected by Base account abstraction
      const batchPayments = payments.map(payment => ({
        to: payment.to,
        amount: payment.amount,
        token: payment.token === 'USDC' ? getContractAddress('USDC', this.chainId) : undefined
      }));

      // Use seamless batch payment (no MetaMask popup)
      const hash = await this.accountAbstraction.sendBatchPayments(batchPayments);

      return {
        hash,
        from: this.baseAccountAddress! as `0x${string}`,
        to: payments[0]?.to || '0x0000000000000000000000000000000000000000',
        amount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toString(),
        token: 'BATCH',
        status: 'pending'
      };
    } catch (error) {
      console.error('Error sending batch payments:', error);
      throw new Error('Failed to send batch payments');
    }
  }

  // Get ETH balance (from Base account if available, otherwise from wallet)
  async getETHBalance(address: `0x${string}`): Promise<string> {
    try {
      // If we have a Base account, get its balance
      if (this.baseAccountAddress) {
        validateAddress(this.baseAccountAddress, 'Base account');
        const accountInfo = await this.accountAbstraction.getAccountInfo(this.baseAccountAddress);
        return accountInfo.balance;
      }
      
      // Validate wallet address
      validateAddress(address, 'wallet');
      
      // Otherwise, get wallet balance directly from the blockchain
      const balance = await this.publicClient.getBalance({ address });
      return formatEther(balance);
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      return '0';
    }
  }

  // Get USDC balance (from Base account if available, otherwise from wallet)
  async getUSDCBalance(address: `0x${string}`): Promise<string> {
    try {
      const usdcAddress = getContractAddress('USDC', this.chainId);
      if (!usdcAddress) {
        throw new Error('USDC not supported on this network');
      }

      // Use Base account address if available, otherwise use wallet address
      const balanceAddress = this.baseAccountAddress || address;
      
      // Validate address format
      validateAddress(balanceAddress, 'balance');

      const [balance, decimals] = await Promise.all([
        this.publicClient.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [balanceAddress]
        }),
        this.publicClient.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        })
      ]);

      return formatEther(balance * BigInt(10 ** (18 - decimals)));
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return '0';
    }
  }

  // Get all token balances (ETH and USDC)
  async getBalances(address: `0x${string}`): Promise<TokenBalance[]> {
    try {
      const balances: TokenBalance[] = [];

      // Get ETH balance
      try {
        const ethBalance = await this.getETHBalance(address);
        balances.push({
          symbol: 'ETH',
          balance: ethBalance,
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000' // ETH native token
        });
      } catch (error) {
        console.error('Error getting ETH balance:', error);
        balances.push({
          symbol: 'ETH',
          balance: '0',
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000'
        });
      }

      // Get USDC balance
      try {
        const usdcBalance = await this.getUSDCBalance(address);
        const usdcAddress = getContractAddress('USDC', this.chainId) || '';
        balances.push({
          symbol: 'USDC',
          balance: usdcBalance,
          decimals: 6, // USDC has 6 decimals
          address: usdcAddress
        });
      } catch (error) {
        console.error('Error getting USDC balance:', error);
        const usdcAddress = getContractAddress('USDC', this.chainId) || '';
        balances.push({
          symbol: 'USDC',
          balance: '0',
          decimals: 6,
          address: usdcAddress
        });
      }

      return balances;
    } catch (error) {
      console.error('Error getting balances:', error);
      // Return empty balances instead of throwing
      return [
        {
          symbol: 'ETH',
          balance: '0',
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000'
        },
        {
          symbol: 'USDC',
          balance: '0',
          decimals: 6,
          address: getContractAddress('USDC', this.chainId) || ''
        }
      ];
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(hash: `0x${string}`) {
    try {
      return await this.publicClient.getTransactionReceipt({ hash });
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }

  // Get testnet ETH from faucet
  async getTestnetETH(address: `0x${string}`): Promise<boolean> {
    if (this.chainId !== 84532) { // Only for Base Sepolia
      return false;
    }

    try {
      // Use Base Sepolia faucet
      const response = await fetch('https://faucet.quicknode.com/base/sepolia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          network: 'base-sepolia'
        })
      });

      if (response.ok) {
        console.log('Successfully requested testnet ETH from faucet');
        return true;
      } else {
        console.error('Failed to get testnet ETH from faucet');
        return false;
      }
    } catch (error) {
      console.error('Error requesting testnet ETH:', error);
      return false;
    }
  }

  // Get all token balances
  async getTokenBalances(address: `0x${string}`): Promise<TokenBalance[]> {
    try {
      const [ethBalance, usdcBalance] = await Promise.all([
        this.getETHBalance(address),
        this.getUSDCBalance(address)
      ]);

      const balances: TokenBalance[] = [
        {
          symbol: 'ETH',
          balance: ethBalance,
          decimals: 18,
          address: 'native'
        }
      ];

      const usdcAddress = getContractAddress('USDC', this.chainId);
      if (usdcAddress) {
        balances.push({
          symbol: 'USDC',
          balance: usdcBalance,
          decimals: 6,
          address: usdcAddress
        });
      }

      return balances;
    } catch (error) {
      console.error('Error getting token balances:', error);
      throw new Error('Failed to get token balances');
    }
  }

  // Get transaction status
  async getTransactionStatus(hash: `0x${string}`): Promise<PaymentResult> {
    try {
      const receipt = await this.publicClient.getTransactionReceipt({ hash });
      
      if (!receipt) {
        return {
          hash,
          from: '0x0000000000000000000000000000000000000000',
          to: '0x0000000000000000000000000000000000000000',
          amount: '0',
          token: 'ETH',
          status: 'pending'
        };
      }

      return {
        hash,
        from: receipt.from,
        to: receipt.to || '0x0000000000000000000000000000000000000000',
        amount: '0', // Would need to parse from logs for token transfers
        token: 'ETH',
        status: receipt.status === 'success' ? 'success' : 'failed',
        gasUsed: receipt.gasUsed,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw new Error('Failed to get transaction status');
    }
  }

  // Estimate gas for payment
  async estimateGas(payment: PaymentRequest): Promise<bigint> {
    try {
      if (payment.token === 'ETH') {
        return await this.publicClient.estimateGas({
          to: payment.to,
          value: parseEther(payment.amount),
          account: this.walletClient?.account?.address
        });
      } else {
        const usdcAddress = getContractAddress('USDC', this.chainId);
        if (!usdcAddress) {
          throw new Error('USDC not supported on this network');
        }

        const decimals = await this.publicClient.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        });
        
        const amount = parseUnits(payment.amount, decimals);

        return await this.publicClient.estimateContractGas({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [payment.to, amount],
          account: this.walletClient?.account?.address
        });
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  // Switch chain
  switchChain(newChainId: number) {
    this.chainId = newChainId;
    this.accountService.switchChain(newChainId);
    
    const chain = newChainId === base.id ? base : baseSepolia;
    
    this.publicClient = createPublicClient({
      chain,
      transport: http()
    });

    if (this.walletClient?.account) {
      this.walletClient = createWalletClient({
        account: this.walletClient.account,
        chain,
        transport: http()
      });
    }
  }

  // Top up Base account with ETH from wallet
  async topUpBaseAccount(amount: string): Promise<PaymentResult> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      // Initialize Base account if not already done
      if (!this.baseAccountAddress) {
        await this.initializeBaseAccount(this.walletClient.account!.address);
      }

      console.log('Top-up details:');
      console.log('From (wallet):', this.walletClient.account!.address);
      console.log('To (Base account):', this.baseAccountAddress);
      console.log('Amount:', amount, 'ETH');

      // Send ETH from wallet to Base account
      const hash = await this.walletClient.sendTransaction({
        to: this.baseAccountAddress!,
        value: parseEther(amount),
        account: this.walletClient.account!,
        chain: this.chainId === base.id ? base : baseSepolia
      });

      return {
        hash: hash as `0x${string}`,
        from: this.walletClient.account!.address as `0x${string}`,
        to: this.baseAccountAddress! as `0x${string}`,
        amount: amount,
        token: 'ETH',
        status: 'pending'
      };
    } catch (error) {
      console.error('Error topping up Base account:', error);
      throw new Error('Failed to top up Base account');
    }
  }

  // Top up Base account with USDC from wallet
  async topUpBaseAccountWithUSDC(amount: string): Promise<PaymentResult> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const usdcAddress = getContractAddress('USDC', this.chainId);
      if (!usdcAddress) {
        throw new Error('USDC not supported on this network');
      }

      // Initialize Base account if not already done
      if (!this.baseAccountAddress) {
        await this.initializeBaseAccount(this.walletClient.account!.address);
      }

      console.log('USDC Top-up details:');
      console.log('From (wallet):', this.walletClient.account!.address);
      console.log('To (Base account):', this.baseAccountAddress);
      console.log('USDC Contract:', usdcAddress);
      console.log('Amount:', amount, 'USDC');

      // Get USDC decimals (USDC uses 6 decimals, not 18)
      const decimals = await this.publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'decimals'
      });

      // Parse amount with correct decimals
      const amountInWei = parseUnits(amount, decimals);

      // Transfer USDC from wallet to Base account
      const hash = await this.walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [this.baseAccountAddress!, amountInWei],
        account: this.walletClient.account!,
        chain: this.chainId === base.id ? base : baseSepolia
      });

      return {
        hash: hash as `0x${string}`,
        from: this.walletClient.account!.address as `0x${string}`,
        to: this.baseAccountAddress! as `0x${string}`,
        amount: amount,
        token: 'USDC',
        status: 'pending'
      };
    } catch (error) {
      console.error('Error topping up Base account with USDC:', error);
      throw new Error('Failed to top up Base account with USDC');
    }
  }

  // Check if Base account needs top-up
  async needsTopUp(requiredAmount: string, token: 'ETH' | 'USDC' = 'ETH'): Promise<boolean> {
    try {
      if (!this.baseAccountAddress) {
        return true; // Account not initialized, needs setup
      }

      const balance = token === 'ETH' 
        ? await this.getETHBalance(this.baseAccountAddress as `0x${string}`)
        : await this.getUSDCBalance(this.baseAccountAddress as `0x${string}`);

      const currentBalance = parseFloat(balance);
      const required = parseFloat(requiredAmount);

      return currentBalance < required;
    } catch (error) {
      console.error('Error checking if top-up needed:', error);
      return true; // Assume needs top-up if error
    }
  }

  // Check USDC allowance for Base account
  async checkUSDCAllowance(ownerAddress: `0x${string}`, spenderAddress: `0x${string}`): Promise<string> {
    try {
      const usdcAddress = getContractAddress('USDC', this.chainId);
      if (!usdcAddress) {
        throw new Error('USDC not supported on this network');
      }

      const allowance = await this.publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [ownerAddress, spenderAddress]
      });

      const decimals = await this.publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'decimals'
      });

      return formatEther(allowance * BigInt(10 ** (18 - decimals)));
    } catch (error) {
      console.error('Error checking USDC allowance:', error);
      return '0';
    }
  }

  // Approve USDC spending for Base account
  async approveUSDC(amount: string): Promise<PaymentResult> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const usdcAddress = getContractAddress('USDC', this.chainId);
      if (!usdcAddress) {
        throw new Error('USDC not supported on this network');
      }

      // Initialize Base account if not already done
      if (!this.baseAccountAddress) {
        await this.initializeBaseAccount(this.walletClient.account!.address);
      }

      // Get USDC decimals
      const decimals = await this.publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'decimals'
      });

      // Parse amount with correct decimals
      const amountInWei = parseUnits(amount, decimals);

      // Approve USDC spending
      const hash = await this.walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [this.baseAccountAddress!, amountInWei],
        account: this.walletClient.account!,
        chain: this.chainId === base.id ? base : baseSepolia
      });

      return {
        hash: hash as `0x${string}`,
        from: this.walletClient.account!.address as `0x${string}`,
        to: usdcAddress,
        amount: amount,
        token: 'USDC',
        status: 'pending'
      };
    } catch (error) {
      console.error('Error approving USDC:', error);
      throw new Error('Failed to approve USDC spending');
    }
  }

  // Get current chain info
  getCurrentChain() {
    return {
      id: this.chainId,
      name: this.chainId === base.id ? 'Base Mainnet' : 'Base Sepolia',
      isTestnet: this.chainId === baseSepolia.id
    };
  }
}

// Factory function
export function createBasePayService(chainId?: number, walletClient?: WalletClient, privateKey?: string) {
  return new BasePayService(chainId, walletClient, privateKey);
}

// Utility functions
export const formatTokenAmount = (amount: string, decimals: number = 4) => {
  const num = parseFloat(amount);
  return num.toFixed(decimals);
};

export const parseTokenAmount = (amount: string, decimals: number) => {
  return parseUnits(amount, decimals);
};