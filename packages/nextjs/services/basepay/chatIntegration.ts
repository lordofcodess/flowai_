import { PaymentAgent, createPaymentAgent } from './agent';
import { PayAIService, createPayAIService, OPENROUTER_API_KEY } from './payai';
import { PaymentAgentResponse, ChatMessage, PaymentRequest, BASE_SEPOLIA_NETWORK } from './types';
import { WalletClient } from 'viem';
import { paymentENSResolver, PaymentENSResolver } from './ensResolver';
import { ensRegistrationService, ENSRegistrationRequest } from './ensRegistration';

export interface PaymentChatIntegration {
  initialize(walletClient: WalletClient | null): Promise<void>;
  processMessage(message: string, userAddress?: string): Promise<PaymentAgentResponse>;
  getConversationHistory(): ChatMessage[];
  clearConversationHistory(): void;
  getAgentStatus(): any;
  updateWalletClient(walletClient: WalletClient | null): Promise<void>;
  executePayment(paymentRequest: PaymentRequest): Promise<PaymentAgentResponse>;
  getHelpMessage(): string;
  isInitialized(): boolean;
}

class PaymentChatIntegrationImpl implements PaymentChatIntegration {
  private paymentAgent: PaymentAgent | null = null;
  private payAIService: PayAIService | null = null;
  private initialized: boolean = false;

  async initialize(walletClient: WalletClient | null): Promise<void> {
    try {
      console.log('Initializing Payment Chat Integration...');
      
      // Create payment agent with Base Sepolia configuration
      console.log('Creating payment agent...');
      this.paymentAgent = createPaymentAgent({
        ...BASE_SEPOLIA_NETWORK,
        chainId: BASE_SEPOLIA_NETWORK.chainId
      });
      console.log('Payment agent created successfully');

      // Initialize with wallet client if provided
      if (walletClient) {
        console.log('Initializing payment agent with wallet client...');
        await this.paymentAgent.initialize(walletClient);
        console.log('Payment agent initialized with wallet client');
      }

      // Create AI service (only on server side)
      if (typeof window === 'undefined') {
        console.log('Creating PayAI service (server-side)...');
        this.payAIService = createPayAIService(this.paymentAgent, OPENROUTER_API_KEY);
        console.log('PayAI service created successfully');
      } else {
        console.log('Skipping PayAI service creation (client-side) - will use API routes instead');
      }

      this.initialized = true;
      console.log('Payment Chat Integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Payment Chat Integration:', error);
      console.error('Error details:', error);
      
      // Don't throw the error, just log it and continue with limited functionality
      this.initialized = false;
      
      // Create a basic fallback response
      console.log('Continuing with limited payment functionality...');
    }
  }

  async processMessage(message: string, userAddress?: string): Promise<PaymentAgentResponse> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'Payment integration not initialized'
      };
    }

    try {
      // If AI service is available (server-side), use it for enhanced processing
      if (this.payAIService) {
        return await this.payAIService.processMessage(message, userAddress);
      }

      // If running on client-side, use API route
      if (typeof window !== 'undefined') {
        return await this.processMessageViaAPI(message, userAddress);
      }

      // Fallback to direct payment agent processing
      if (this.paymentAgent) {
        return await this.processMessageDirect(message, userAddress);
      }

      return {
        success: false,
        error: 'No payment processing method available'
      };
    } catch (error) {
      console.error('Error processing payment message:', error);
      return {
        success: false,
        error: `Failed to process message: ${error}`
      };
    }
  }

  /**
   * Process message via API route (client-side)
   */
  private async processMessageViaAPI(message: string, userAddress?: string): Promise<PaymentAgentResponse> {
    try {
      const response = await fetch('/api/payment/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userAddress
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: `Failed to process message via API: ${error}`
      };
    }
  }

  /**
   * Direct message processing without AI (fallback)
   */
  private async processMessageDirect(message: string, userAddress?: string): Promise<PaymentAgentResponse> {
    if (!this.paymentAgent) {
      throw new Error('Payment agent not available');
    }

    const lowerMessage = message.toLowerCase();

    // Handle balance queries
    if (lowerMessage.includes('balance') || lowerMessage.includes('how much') || lowerMessage.includes('funds')) {
      return await this.paymentAgent.getBalance(userAddress as `0x${string}`);
    }

    // Handle ENS registration commands
    if (this.isENSRegistrationCommand(lowerMessage)) {
      return await this.handleENSRegistration(message, userAddress);
    }

    // Handle ENS availability check commands
    if (this.isENSAvailabilityCommand(lowerMessage)) {
      return await this.handleENSAvailabilityCheck(message);
    }

    // Handle ENS resolution commands (who is)
    if (this.isENSResolutionCommand(lowerMessage)) {
      return await this.handleENSResolution(message);
    }

    // Handle payment commands
    if (this.isPaymentCommand(lowerMessage)) {
      const paymentDetails = await this.extractPaymentDetails(message);
      if (paymentDetails) {
        // Use ENS name for display if available, otherwise use formatted address
        const displayRecipient = paymentDetails.ensName || this.formatAddress(paymentDetails.to);
        
        // For direct processing, we'll return a confirmation request
        return {
          success: true,
          data: {
            message: `Ready to send ${paymentDetails.amount} ${paymentDetails.token} to ${displayRecipient}. Please confirm this transaction.`,
            type: 'payment',
            timestamp: new Date().toISOString(),
            needsConfirmation: true
          },
          message: `Payment ready: ${paymentDetails.amount} ${paymentDetails.token} to ${displayRecipient}`,
          transaction: {
            type: 'send',
            amount: paymentDetails.amount,
            token: paymentDetails.token,
            recipient: paymentDetails.to,
            status: 'pending'
          }
        };
      } else {
        // If extraction failed, it might be due to ENS resolution failure
        const ensName = PaymentENSResolver.extractENSName(message);
        if (ensName) {
          return {
            success: false,
            error: `Could not resolve ENS name "${ensName}". Please check the name and try again.`
          };
        } else {
          return {
            success: false,
            error: `Please provide valid payment details. Example: "Send 0.1 ETH to alex.eth" or "Send 10 USDC to 0x123..."`
          };
        }
      }
    }

    // Default help response
    return {
      success: true,
      data: {
        message: 'I can help you with Base network payments! Try saying:\n• "What\'s my balance?"\n• "Send 0.1 ETH to 0x123..."\n• "Send 10 USDC to 0x456..."',
        type: 'ai_response',
        timestamp: new Date().toISOString()
      },
      message: 'I can help you with Base network payments!'
    };
  }

  /**
   * Check if message is a payment command
   */
  private isPaymentCommand(message: string): boolean {
    const paymentKeywords = ['send', 'pay', 'transfer', 'give'];
    return paymentKeywords.some(keyword => message.includes(keyword)) && 
           (message.includes('eth') || message.includes('usdc') || /\d+\.?\d*/.test(message));
  }

  /**
   * Extract payment details from message (supports ENS names)
   */
  private async extractPaymentDetails(message: string): Promise<PaymentRequest | null> {
    try {
      // Extract amount and token
      const amountMatch = message.match(/(\d+\.?\d*)\s*(eth|usdc)/i);
      if (!amountMatch) return null;
      
      const amount = amountMatch[1];
      const token = amountMatch[2].toUpperCase() as 'ETH' | 'USDC';
      
      // First try to extract ENS name
      const ensName = PaymentENSResolver.extractENSName(message);
      if (ensName) {
        console.log(`Found ENS name in payment: ${ensName}`);
        
        // Resolve ENS name to address
        const resolution = await paymentENSResolver.resolveENSName(ensName);
        if (resolution.success && resolution.address) {
          console.log(`ENS resolved: ${ensName} -> ${resolution.address}`);
          return { 
            to: resolution.address as `0x${string}`, 
            amount, 
            token,
            ensName // Store original ENS name for display
          };
        } else {
          console.error(`Failed to resolve ENS name ${ensName}:`, resolution.error);
          // Return null to indicate failure - the calling function should handle this
          return null;
        }
      }
      
      // Fallback to extract recipient address (0x format)
      const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
      if (!addressMatch) return null;
      
      const to = addressMatch[0] as `0x${string}`;
      
      return { to, amount, token };
    } catch (error) {
      console.error('Error extracting payment details:', error);
      return null;
    }
  }

  /**
   * Check if message is an ENS registration command
   */
  private isENSRegistrationCommand(message: string): boolean {
    return message.includes('register') && message.includes('.eth');
  }

  /**
   * Check if message is an ENS availability check command
   */
  private isENSAvailabilityCommand(message: string): boolean {
    return (message.includes('is') && message.includes('available') && message.includes('.eth')) ||
           (message.includes('check') && message.includes('.eth') && message.includes('available'));
  }

  /**
   * Check if message is an ENS resolution command
   */
  private isENSResolutionCommand(message: string): boolean {
    return (message.includes('who is') && message.includes('.eth')) ||
           (message.includes('who owns') && message.includes('.eth')) ||
           (message.includes('resolve') && message.includes('.eth'));
  }

  /**
   * Handle ENS registration
   */
  private async handleENSRegistration(message: string, userAddress?: string): Promise<PaymentAgentResponse> {
    try {
      const ensName = PaymentENSResolver.extractENSName(message);
      if (!ensName) {
        return {
          success: false,
          error: 'Please specify an ENS name to register (e.g., "register myname.eth")'
        };
      }

      if (!userAddress) {
        return {
          success: false,
          error: 'Please connect your wallet to register ENS names'
        };
      }

      const label = ensName.replace('.eth', '');
      
      // Check availability first
      const availability = await ensRegistrationService.checkAvailability(label);
      if (!availability.success) {
        return {
          success: false,
          error: `Failed to check availability: ${availability.error}`
        };
      }

      if (!availability.available) {
        const ownerInfo = availability.data?.owner ? ` (owned by ${this.formatAddress(availability.data.owner)})` : '';
        return {
          success: false,
          error: `${ensName} is not available for registration${ownerInfo}`
        };
      }

      // Get price estimate
      const priceInfo = await ensRegistrationService.getRegistrationPrice(label, 1);
      const priceDisplay = priceInfo.success ? ` (estimated cost: ${priceInfo.price?.total} ETH for 1 year)` : '';

      return {
        success: true,
        data: {
          message: `${ensName} is available for registration${priceDisplay}. ENS registration requires a two-step process:\n\n1. Commit to registration (prevents front-running)\n2. Wait 60 seconds\n3. Complete registration\n\nWould you like to start the registration process?`,
          type: 'ens_registration',
          timestamp: new Date().toISOString(),
          needsConfirmation: true
        },
        message: `${ensName} is available for registration${priceDisplay}`
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to process ENS registration: ${error}`
      };
    }
  }

  /**
   * Handle ENS availability check
   */
  private async handleENSAvailabilityCheck(message: string): Promise<PaymentAgentResponse> {
    try {
      const ensName = PaymentENSResolver.extractENSName(message);
      if (!ensName) {
        return {
          success: false,
          error: 'Please specify an ENS name to check (e.g., "is myname.eth available?")'
        };
      }

      const label = ensName.replace('.eth', '');
      const availability = await ensRegistrationService.checkAvailability(label);
      
      if (!availability.success) {
        return {
          success: false,
          error: `Failed to check availability: ${availability.error}`
        };
      }

      if (availability.available) {
        const priceInfo = availability.data?.price;
        const priceDisplay = priceInfo ? ` Registration cost: ${priceInfo.total} ETH for 1 year.` : '';
        
        return {
          success: true,
          data: {
            message: `✅ ${ensName} is available for registration!${priceDisplay}`,
            type: 'ens_availability',
            timestamp: new Date().toISOString()
          },
          message: `${ensName} is available for registration!`
        };
      } else {
        const data = availability.data;
        let ownerInfo = '';
        
        if (data?.owner) {
          ownerInfo = `\nOwned by: ${this.formatAddress(data.owner)}`;
        }
        
        if (data?.expires) {
          const expiryDate = new Date(data.expires * 1000);
          ownerInfo += `\nExpires: ${expiryDate.toLocaleDateString()}`;
        }

        return {
          success: true,
          data: {
            message: `❌ ${ensName} is not available for registration.${ownerInfo}`,
            type: 'ens_availability',
            timestamp: new Date().toISOString()
          },
          message: `${ensName} is not available`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to check ENS availability: ${error}`
      };
    }
  }

  /**
   * Handle ENS resolution (who is)
   */
  private async handleENSResolution(message: string): Promise<PaymentAgentResponse> {
    try {
      const ensName = PaymentENSResolver.extractENSName(message);
      if (!ensName) {
        return {
          success: false,
          error: 'Please specify an ENS name to resolve (e.g., "who is vitalik.eth?")'
        };
      }

      const resolution = await paymentENSResolver.resolveENSDetails(ensName);
      
      if (!resolution.success) {
        return {
          success: false,
          error: `Failed to resolve ${ensName}: ${resolution.error}`
        };
      }

      const data = resolution.data!;
      let responseMessage = `📋 Information for ${ensName}:\n\n`;

      if (data.address) {
        responseMessage += `💳 Address: ${data.address}\n`;
      }

      if (data.owner && data.owner !== data.address) {
        responseMessage += `👤 Owner: ${data.owner}\n`;
      }

      if (data.expires) {
        const expiryDate = new Date(data.expires * 1000);
        const isExpired = data.expires * 1000 < Date.now();
        responseMessage += `⏰ ${isExpired ? 'Expired' : 'Expires'}: ${expiryDate.toLocaleDateString()}\n`;
      }

      if (data.resolver && data.resolver !== '0x0000000000000000000000000000000000000000') {
        responseMessage += `🔧 Resolver: ${this.formatAddress(data.resolver)}\n`;
      }

      // Add social profiles
      const socials = [];
      if (data.twitter) socials.push(`🐦 Twitter: ${data.twitter}`);
      if (data.github) socials.push(`💻 GitHub: ${data.github}`);
      if (data.discord) socials.push(`💬 Discord: ${data.discord}`);
      if (data.telegram) socials.push(`📱 Telegram: ${data.telegram}`);
      if (data.email) socials.push(`📧 Email: ${data.email}`);
      if (data.url) socials.push(`🌐 Website: ${data.url}`);

      if (socials.length > 0) {
        responseMessage += `\n📱 Social Profiles:\n${socials.join('\n')}\n`;
      }

      if (data.description) {
        responseMessage += `\n📝 Description: ${data.description}\n`;
      }

      if (data.avatar) {
        responseMessage += `\n🖼️ Avatar: ${data.avatar}\n`;
      }

      // Show additional text records if any
      if (data.textRecords && Object.keys(data.textRecords).length > 0) {
        const otherRecords = Object.entries(data.textRecords)
          .filter(([key]) => !['avatar', 'description', 'email', 'url', 'com.twitter', 'com.github', 'com.discord', 'org.telegram'].includes(key))
          .map(([key, value]) => `${key}: ${value}`)
          .slice(0, 5); // Limit to 5 additional records

        if (otherRecords.length > 0) {
          responseMessage += `\n📄 Other Records:\n${otherRecords.join('\n')}\n`;
        }
      }

      return {
        success: true,
        data: {
          message: responseMessage.trim(),
          type: 'ens_resolution',
          timestamp: new Date().toISOString()
        },
        message: `Resolved ${ensName}`
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to resolve ENS name: ${error}`
      };
    }
  }

  /**
   * Format address for display
   */
  private formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getConversationHistory(): ChatMessage[] {
    if (this.payAIService) {
      return this.payAIService.getConversationHistory();
    }
    
    if (this.paymentAgent) {
      return this.paymentAgent.getChatHistory();
    }
    
    return [];
  }

  clearConversationHistory(): void {
    if (this.payAIService) {
      this.payAIService.clearConversationHistory();
    }
    
    if (this.paymentAgent) {
      this.paymentAgent.clearChatHistory();
    }
  }

  getAgentStatus(): any {
    if (this.payAIService) {
      return this.payAIService.getAgentStatus();
    }
    
    if (this.paymentAgent) {
      return this.paymentAgent.getAgentStatus();
    }
    
    return {
      initialized: false,
      status: 'not_initialized',
      capabilities: [],
      messageCount: 0
    };
  }

  getHelpMessage(): string {
    if (this.payAIService) {
      return this.payAIService.getHelpMessage();
    }
    
    return `Welcome to the Base Payment Assistant! I can help you with:

💰 Payment Operations
- Send ETH payments to any address
- Send USDC stablecoin payments
- Check your token balances

🌐 ENS Domain Services
- Register .eth domain names
- Check domain availability
- Resolve domain information
- View text records and social profiles

📊 Account Management
- View your ETH and USDC balances
- Check transaction status

🔒 Security Features
- Address validation
- Amount confirmation
- Transaction warnings

⚡ Base Network Benefits
- Fast transactions (~2 seconds)
- Low fees (under $0.01)
- Ethereum compatibility

Just tell me what you'd like to do! For example:
- "Send 0.1 ETH to alex.eth"
- "What's my balance?"
- "Register myname.eth"
- "Is alice.eth available?"
- "Who is vitalik.eth?"
- "Send 10 USDC to multiple addresses"`;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the underlying payment agent (for advanced usage)
   */
  getPaymentAgent(): PaymentAgent | null {
    return this.paymentAgent;
  }

  /**
   * Get the underlying AI service (for advanced usage)
   */
  getPayAIService(): PayAIService | null {
    return this.payAIService;
  }

  /**
   * Update wallet client (for when user connects/disconnects wallet)
   */
  async updateWalletClient(walletClient: WalletClient | null): Promise<void> {
    if (this.paymentAgent && walletClient) {
      await this.paymentAgent.initialize(walletClient);
    }
  }

  /**
   * Re-initialize with new wallet client
   */
  async reinitialize(walletClient: WalletClient | null): Promise<void> {
    await this.initialize(walletClient);
  }

  /**
   * Get suggested payment prompts
   */
  getSuggestedPrompts(): string[] {
    return [
      "What's my balance?",
      "Send 0.1 ETH to alex.eth",
      "Send 10 USDC to blockdevrel.eth", 
      "Register myname.eth",
      "Is alice.eth available?",
      "Who is vitalik.eth?",
      "Send 0.5 ETH to 0x742d35Cc6634C0532925a3b8D5C0B4F3e8dCdD98",
      "How do I send a payment?",
      "What tokens can I send?",
      "Check my transaction history",
      "What are the fees on Base?"
    ];
  }

  /**
   * Execute a payment directly (for confirmed transactions)
   */
  async executePayment(paymentRequest: PaymentRequest): Promise<PaymentAgentResponse> {
    if (!this.paymentAgent) {
      return {
        success: false,
        error: 'Payment agent not available. Please refresh and try again.'
      };
    }

    // Check if payment agent is initialized with wallet
    try {
      return await this.paymentAgent.sendPayment(paymentRequest);
    } catch (error: any) {
      if (error.message?.includes('Wallet not connected')) {
        return {
          success: false,
          error: 'Wallet not connected. Please ensure your wallet is connected and try again.'
        };
      }
      
      return {
        success: false,
        error: `Payment failed: ${error.message || 'Unknown error'}`
      };
    }
  }
}

// Create singleton instance
export const paymentChatIntegration = new PaymentChatIntegrationImpl();

// Export types for use in components
export type { ChatMessage as PaymentChatMessage };
export type { PaymentAgentResponse, PaymentRequest };

// Export utility functions
export const formatPaymentAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const parsePaymentAmount = (amount: string): number | null => {
  const parsed = parseFloat(amount);
  return isNaN(parsed) ? null : parsed;
};
