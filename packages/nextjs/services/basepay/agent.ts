import { BasePayService } from './pay';
import { BaseAccountService } from './baseaccount';
import {
  PaymentAgentConfig,
  PaymentRequest,
  PaymentResult,
  BatchPaymentRequest,
  TokenBalance,
  PaymentAgentResponse,
  ChatMessage,
  PaymentOperation,
  AccountInfo,
  BASE_SEPOLIA_NETWORK,
  BASE_MAINNET_NETWORK
} from './types';
import { WalletClient } from 'viem';

export class PaymentAgent {
  private payService: BasePayService;
  private accountService: BaseAccountService;
  private config: PaymentAgentConfig;
  private isInitialized: boolean = false;
  private chatHistory: ChatMessage[] = [];
  private operationHistory: PaymentOperation[] = [];
  private currentUserAddress: `0x${string}` | null = null;

  constructor(config?: Partial<PaymentAgentConfig>) {
    // Use Base Sepolia as default for development
    this.config = {
      ...BASE_SEPOLIA_NETWORK,
      ...config
    };

    try {
      this.payService = new BasePayService(this.config.chainId);
      this.accountService = new BaseAccountService(this.config.chainId);
      this.isInitialized = true;
      console.log('PaymentAgent constructor completed successfully');
    } catch (error) {
      console.error('PaymentAgent constructor error:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Initialize with a wallet client
   */
  async initialize(walletClient: WalletClient): Promise<void> {
    try {
      this.payService.setWalletClient(walletClient);
      
      if (walletClient.account?.address) {
        this.currentUserAddress = walletClient.account.address;
        
        // Initialize Base account for gasless transactions
        try {
          await this.payService.initializeBaseAccount(walletClient.account.address);
          console.log('Payment agent initialized with Base account');
        } catch (error) {
          console.warn('Base account initialization failed, using standard wallet:', error);
        }
      }
      
      this.isInitialized = true;
      console.log('Payment agent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize payment agent:', error);
      throw error;
    }
  }

  /**
   * Send a payment
   */
  async sendPayment(request: PaymentRequest): Promise<PaymentAgentResponse> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Payment agent not initialized'
        };
      }

      // Validate payment request
      const validation = this.validatePaymentRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Execute payment
      const result = await this.payService.sendPayment(request);
      
      // Add to operation history
      this.operationHistory.push({
        type: 'send',
        name: `Send ${request.amount} ${request.token}`,
        description: `Sent ${request.amount} ${request.token} to ${request.to}`,
        parameters: request,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          message: `Successfully sent ${request.amount} ${request.token} to ${this.formatAddress(request.to)}`,
          type: 'payment',
          payment: result,
          timestamp: new Date().toISOString()
        },
        message: `Payment of ${request.amount} ${request.token} sent successfully!`,
        transaction: {
          type: 'send',
          amount: request.amount,
          token: request.token,
          recipient: request.to,
          status: 'completed',
          hash: result.hash
        }
      };
    } catch (error) {
      console.error('Payment failed:', error);
      return {
        success: false,
        error: `Payment failed: ${error}`
      };
    }
  }

  /**
   * Send batch payments
   */
  async sendBatchPayments(request: BatchPaymentRequest): Promise<PaymentAgentResponse> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Payment agent not initialized'
        };
      }

      // Validate batch request
      for (const payment of request.payments) {
        const validation = this.validatePaymentRequest(payment);
        if (!validation.valid) {
          return {
            success: false,
            error: `Invalid payment in batch: ${validation.error}`
          };
        }
      }

      // Execute batch payment
      const result = await this.payService.sendBatchPayments(
        request.payments.map(p => ({
          to: p.to,
          amount: p.amount,
          token: p.token
        }))
      );

      // Add to operation history
      this.operationHistory.push({
        type: 'batch_send',
        name: `Batch payment to ${request.payments.length} recipients`,
        description: `Sent payments to ${request.payments.length} recipients`,
        parameters: request,
        timestamp: new Date()
      });

      const totalAmount = request.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const recipients = request.payments.map(p => this.formatAddress(p.to));

      return {
        success: true,
        data: {
          message: `Successfully sent batch payments to ${request.payments.length} recipients`,
          type: 'batch_payment',
          payment: result,
          timestamp: new Date().toISOString()
        },
        message: `Batch payment completed! Sent to ${recipients.join(', ')}`,
        transaction: {
          type: 'batch_send',
          recipients: request.payments.map(p => p.to),
          status: 'completed',
          hash: result.hash
        }
      };
    } catch (error) {
      console.error('Batch payment failed:', error);
      return {
        success: false,
        error: `Batch payment failed: ${error}`
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address?: `0x${string}`): Promise<PaymentAgentResponse> {
    try {
      const targetAddress = address || this.currentUserAddress;
      if (!targetAddress) {
        return {
          success: false,
          error: 'No address provided and no connected wallet'
        };
      }

      const accountInfo = await this.accountService.getAccountInfo(targetAddress);
      const balances = await this.payService.getBalances(targetAddress);

      // Add to operation history
      this.operationHistory.push({
        type: 'check_balance',
        name: 'Check Balance',
        description: `Checked balance for ${this.formatAddress(targetAddress)}`,
        parameters: { address: targetAddress },
        timestamp: new Date()
      });

      const formattedBalances = balances.map(b => ({
        ...b,
        formatted: `${parseFloat(b.balance).toFixed(4)} ${b.symbol}`
      }));

      return {
        success: true,
        data: {
          message: this.formatBalanceMessage(formattedBalances),
          type: 'balance',
          balance: formattedBalances,
          timestamp: new Date().toISOString()
        },
        message: this.formatBalanceMessage(formattedBalances),
        transaction: {
          type: 'check_balance',
          status: 'completed'
        }
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      return {
        success: false,
        error: `Failed to get balance: ${error}`
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(hash: `0x${string}`): Promise<PaymentAgentResponse> {
    try {
      const receipt = await this.payService.getTransactionReceipt(hash);
      
      return {
        success: true,
        data: {
          message: `Transaction ${this.formatAddress(hash)} status: ${receipt ? 'confirmed' : 'pending'}`,
          type: 'transaction',
          timestamp: new Date().toISOString()
        },
        message: `Transaction ${receipt ? 'confirmed' : 'pending'}`,
        transaction: {
          type: 'send',
          status: receipt ? 'completed' : 'pending',
          hash
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get transaction status: ${error}`
      };
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: Partial<PaymentRequest>): { valid: boolean; error?: string } {
    if (!request.to) {
      return { valid: false, error: 'Recipient address is required' };
    }

    if (!request.to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return { valid: false, error: 'Invalid recipient address format' };
    }

    if (!request.amount) {
      return { valid: false, error: 'Amount is required' };
    }

    const amount = parseFloat(request.amount);
    if (isNaN(amount) || amount <= 0) {
      return { valid: false, error: 'Amount must be a positive number' };
    }

    if (amount < parseFloat(this.config.settings.minAmount)) {
      return { valid: false, error: `Amount must be at least ${this.config.settings.minAmount} ${request.token || 'ETH'}` };
    }

    if (amount > parseFloat(this.config.settings.maxAmount)) {
      return { valid: false, error: `Amount cannot exceed ${this.config.settings.maxAmount} ${request.token || 'ETH'}` };
    }

    if (!request.token || !['ETH', 'USDC'].includes(request.token)) {
      return { valid: false, error: 'Token must be ETH or USDC' };
    }

    return { valid: true };
  }

  /**
   * Format address for display
   */
  private formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format balance message
   */
  private formatBalanceMessage(balances: TokenBalance[]): string {
    if (balances.length === 0) {
      return 'No balances found';
    }

    const balanceStrings = balances.map(b => b.formatted);
    return `Your balances: ${balanceStrings.join(', ')}`;
  }

  /**
   * Get chat history
   */
  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  /**
   * Get operation history
   */
  getOperationHistory(): PaymentOperation[] {
    return [...this.operationHistory];
  }

  /**
   * Add message to chat history
   */
  addToChatHistory(message: ChatMessage): void {
    this.chatHistory.push(message);
  }

  /**
   * Clear chat history
   */
  clearChatHistory(): void {
    this.chatHistory = [];
  }

  /**
   * Get agent configuration
   */
  getConfig(): PaymentAgentConfig {
    return { ...this.config };
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens(): string[] {
    return ['ETH', 'USDC'];
  }

  /**
   * Get current network info
   */
  getNetworkInfo(): { chainId: number; name: string; testnet: boolean } {
    const isTestnet = this.config.chainId === 84532;
    return {
      chainId: this.config.chainId,
      name: this.config.chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia',
      testnet: isTestnet
    };
  }

  /**
   * Get current user address
   */
  getCurrentUserAddress(): `0x${string}` | null {
    return this.currentUserAddress;
  }

  /**
   * Set current user address
   */
  setCurrentUserAddress(address: `0x${string}` | null): void {
    this.currentUserAddress = address;
  }

  /**
   * Check if agent is initialized
   */
  isAgentInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get agent status
   */
  getAgentStatus(): {
    initialized: boolean;
    status: string;
    capabilities: string[];
    chainId: number;
    network: string;
  } {
    return {
      initialized: this.isInitialized,
      status: this.isInitialized ? 'ready' : 'not_initialized',
      capabilities: [
        'Send ETH payments',
        'Send USDC payments',
        'Batch payments',
        'Balance checking',
        'Transaction status',
        'Gasless transactions'
      ],
      chainId: this.config.chainId,
      network: this.getNetworkInfo().name
    };
  }
}

// Factory function to create payment agent
export function createPaymentAgent(config?: Partial<PaymentAgentConfig>): PaymentAgent {
  return new PaymentAgent(config);
}
