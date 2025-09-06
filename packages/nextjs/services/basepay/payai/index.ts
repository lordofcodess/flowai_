import OpenAI from 'openai';
import { PaymentAgent } from '../agent';
import { PaymentAgentResponse, ChatMessage, PaymentRequest, BatchPaymentRequest } from '../types';
import { randomBytes } from 'crypto';
import { paymentENSResolver, PaymentENSResolver } from '../ensResolver';
import { ensRegistrationService } from '../ensRegistration';

export class PayAIService {
  private openai: OpenAI;
  private paymentAgent: PaymentAgent;
  private systemPrompt: string;
  private conversationHistory: ChatMessage[] = [];
  private currentContext: {
    lastRecipient?: string;
    lastAmount?: string;
    lastToken?: 'ETH' | 'USDC';
    lastOperation?: string;
    pendingPayments?: PaymentRequest[];
    userAddress?: string;
    sessionData?: any;
  } = {};

  constructor(paymentAgent: PaymentAgent, apiKey: string) {
    this.paymentAgent = paymentAgent;
    
    // Only create OpenAI client on server-side
    if (typeof window === 'undefined') {
      this.openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': 'https://ethaccra.com',
          'X-Title': 'Payment Agent - Base Payment Assistant',
        },
      });
    } else {
      // Browser environment - OpenAI client should not be used here
      console.warn('PayAIService created in browser environment - OpenAI client will not be available');
      this.openai = null as any; // This will cause methods to fail gracefully
    }

    this.systemPrompt = this.createSystemPrompt();
  }

  /**
   * Create comprehensive system prompt for payment operations
   */
  private createSystemPrompt(): string {
    return `You are an expert Base blockchain payment assistant. Your role is to help users send payments, check balances, and manage their crypto transactions on Base network.

## Important Rules:
1. NEVER generate fake payment data - always call the actual payment functions
2. If payment operations fail, return the error message, don't make up data
3. Only provide real data from the blockchain via payment contracts
4. Always confirm payment details before executing transactions
5. Warn users about irreversible nature of blockchain transactions

## Your Capabilities

### Core Payment Operations:
1. Send ETH: Send Ethereum payments to any address
2. Send USDC: Send USDC stablecoin payments
3. Batch Payments: Send multiple payments in one transaction
4. Balance Checking: Check ETH and USDC balances
5. Transaction Status: Check transaction confirmation status
6. Gasless Transactions: Use Base's gasless payment features when available

### ENS Domain Services:
1. Register ENS: Register .eth domain names (requires wallet)
2. Check Availability: Check if .eth domains are available for registration
3. Resolve ENS: Get detailed information about .eth domains including text records and social profiles
4. ENS Payments: Send payments to .eth addresses

### Supported Tokens:
- ETH: Native Ethereum on Base network
- USDC: USD Coin stablecoin on Base network

### Network Information:
- Current Network: Base Sepolia Testnet (for development)
- Gasless Transactions: Enabled via Base paymaster
- Minimum Amount: 0.001 ETH/USDC
- Maximum Amount: 10 ETH/USDC (for safety)
- Confirmation Time: ~2 seconds on Base

## Response Guidelines

### Always:
1. Be Helpful: Provide clear, actionable guidance for payments
2. Be Accurate: Verify all payment details before execution
3. Be Secure: Always confirm recipient addresses and amounts
4. Be Educational: Explain what transactions do and their costs
5. Be Cautious: Warn about irreversible transactions

### Response Format:
- Use clear, conversational language
- Include relevant transaction details
- Provide step-by-step instructions for complex operations
- Include warnings for irreversible operations
- Suggest alternatives when appropriate
- Do NOT use markdown formatting (no **bold**, *italic*, or other markdown syntax)
- Use plain text only for better readability

Remember: You are a helpful, secure, and knowledgeable payment assistant. Always prioritize user security and transaction accuracy while making payments easy to understand and execute.`;
  }

  /**
   * Process a chat message using the LLM with context awareness
   */
  async processMessage(message: string, userAddress?: string): Promise<PaymentAgentResponse> {
    try {
      // Update context with user address
      if (userAddress) {
        this.currentContext.userAddress = userAddress;
        this.paymentAgent.setCurrentUserAddress(userAddress as `0x${string}`);
      }

      // Add user message to conversation history
      const userMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      this.conversationHistory.push(userMessage);

      const lowerMessage = message.toLowerCase();
      
      // Handle follow-up questions and context-based queries
      const contextualResponse = await this.handleContextualQuery(message, lowerMessage, userAddress);
      if (contextualResponse) {
        return this.addToConversationAndReturn(contextualResponse);
      }

      // Check for payment commands
      if (this.isPaymentCommand(lowerMessage)) {
        const paymentDetails = await this.extractPaymentDetails(message);
        if (paymentDetails) {
          this.currentContext.lastRecipient = paymentDetails.to;
          this.currentContext.lastAmount = paymentDetails.amount;
          this.currentContext.lastToken = paymentDetails.token;
          this.currentContext.lastOperation = 'send';
          
          return this.addToConversationAndReturn(await this.handlePaymentCommand(paymentDetails, message, userAddress));
        } else {
          // Check if it's an ENS resolution failure
          const ensName = PaymentENSResolver.extractENSName(message);
          if (ensName) {
            return this.addToConversationAndReturn({
              success: false,
              error: `Could not resolve ENS name "${ensName}". Please check the name and try again.`
            });
          } else {
            return this.addToConversationAndReturn({
              success: false,
              error: "Please provide payment details like: 'Send 0.1 ETH to alex.eth' or 'Send 10 USDC to 0x742d35Cc...'"
            });
          }
        }
      }

      // Check for ENS registration commands
      if (this.isENSRegistrationCommand(lowerMessage)) {
        return this.addToConversationAndReturn(await this.handleENSRegistration(message, userAddress));
      }

      // Check for ENS availability commands
      if (this.isENSAvailabilityCommand(lowerMessage)) {
        return this.addToConversationAndReturn(await this.handleENSAvailabilityCheck(message));
      }

      // Check for ENS resolution commands
      if (this.isENSResolutionCommand(lowerMessage)) {
        return this.addToConversationAndReturn(await this.handleENSResolution(message));
      }

      // Check for balance queries
      if (lowerMessage.includes('balance') || lowerMessage.includes('how much') || lowerMessage.includes('funds')) {
        this.currentContext.lastOperation = 'balance';
        const balanceResult = await this.paymentAgent.getBalance(userAddress as `0x${string}`);
        return this.addToConversationAndReturn(balanceResult);
      }

      // Check for transaction status queries
      const txHash = this.extractTransactionHash(message);
      if (txHash) {
        this.currentContext.lastOperation = 'status';
        const statusResult = await this.paymentAgent.getTransactionStatus(txHash);
        return this.addToConversationAndReturn(statusResult);
      }

      // For general queries, use LLM to provide helpful guidance
      const llmResponse = await this.getEnhancedLLMResponse(message, userAddress);
      
      return this.addToConversationAndReturn({
        success: true,
        data: {
          message: llmResponse,
          type: 'ai_response',
          timestamp: new Date().toISOString()
        },
        message: llmResponse
      });
    } catch (error) {
      console.error('PayAI Service Error:', error);
      
      const fallbackResponse = this.getFallbackResponse(message);
      
      return this.addToConversationAndReturn({
        success: true,
        data: {
          message: fallbackResponse,
          type: 'fallback_response',
          timestamp: new Date().toISOString()
        },
        message: fallbackResponse
      });
    }
  }

  /**
   * Handle payment command
   */
  private async handlePaymentCommand(paymentDetails: PaymentRequest, message: string, userAddress?: string): Promise<PaymentAgentResponse> {
    try {
      // Check if this is a confirmation
      const lowerMessage = message.toLowerCase();
      const isConfirmation = lowerMessage.includes('yes') || lowerMessage.includes('confirm') || 
                           lowerMessage.includes('go ahead') || lowerMessage.includes('do it') ||
                           lowerMessage.includes('proceed') || lowerMessage.includes('send now');
      
      // If user is confirming and we have a user address
      if (isConfirmation && userAddress) {
        console.log(`User confirmed payment: ${paymentDetails.amount} ${paymentDetails.token} to ${paymentDetails.to}`);
        
        // Check if we're running server-side (no direct wallet access)
        const isServerSide = typeof window === 'undefined';
        
        if (isServerSide) {
          // On server-side, we can't execute payments directly - return a confirmation that needs client-side execution
          const displayRecipient = paymentDetails.ensName || this.formatAddress(paymentDetails.to);
          return {
            success: true,
            data: {
              message: `Payment confirmed! Please complete the transaction in your wallet to send ${paymentDetails.amount} ${paymentDetails.token} to ${displayRecipient}.`,
              type: 'payment',
              timestamp: new Date().toISOString(),
              needsConfirmation: true // This will trigger client-side execution
            },
            message: `Payment confirmed: ${paymentDetails.amount} ${paymentDetails.token} to ${displayRecipient}`,
            transaction: {
              type: 'send',
              amount: paymentDetails.amount,
              token: paymentDetails.token,
              recipient: paymentDetails.to,
              status: 'pending'
            }
          };
        } else {
          // On client-side, attempt to execute the payment
          try {
            const paymentResult = await this.paymentAgent.sendPayment(paymentDetails);
            
            if (paymentResult.success) {
              const displayRecipient = paymentDetails.ensName || this.formatAddress(paymentDetails.to);
              return {
                success: true,
                data: {
                  message: `Successfully sent ${paymentDetails.amount} ${paymentDetails.token} to ${displayRecipient}!`,
                  type: 'payment',
                  payment: paymentResult.data?.payment,
                  timestamp: new Date().toISOString()
                },
                message: `Payment sent successfully! Transaction hash: ${paymentResult.data?.payment?.hash}`,
                transaction: paymentResult.transaction
              };
            } else {
              return {
                success: false,
                error: `Payment failed: ${paymentResult.error}`
              };
            }
          } catch (walletError: any) {
            return {
              success: false,
              error: `Payment execution failed: ${walletError.message || 'Unknown error'}`
            };
          }
        }
      }
      
      // If not a confirmation, return the payment proposal
      const networkInfo = this.paymentAgent.getNetworkInfo();
      const displayRecipient = paymentDetails.ensName || this.formatAddress(paymentDetails.to);
      
      // Check if we're running server-side without wallet access
      const isServerSide = typeof window === 'undefined';
      const warningMessage = isServerSide ? 
        " Note: You'll need to confirm this transaction from the client interface where your wallet is connected." : "";
      
      return {
        success: true,
        data: {
          message: `I can send ${paymentDetails.amount} ${paymentDetails.token} to ${displayRecipient} on ${networkInfo.name}. This transaction cannot be reversed.${warningMessage} Would you like me to proceed?`,
          type: 'payment',
          timestamp: new Date().toISOString(),
          needsConfirmation: true
        },
        message: `Ready to send ${paymentDetails.amount} ${paymentDetails.token} to ${displayRecipient}. Confirm to proceed.`,
        transaction: {
          type: 'send',
          amount: paymentDetails.amount,
          token: paymentDetails.token,
          recipient: paymentDetails.to,
          status: 'pending'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process payment: ${error}`
      };
    }
  }

  /**
   * Handle contextual queries and follow-up questions
   */
  private async handleContextualQuery(message: string, lowerMessage: string, userAddress?: string): Promise<PaymentAgentResponse | null> {
    // Handle follow-up confirmations
    if (this.currentContext.lastOperation) {
      const isConfirmation = lowerMessage.includes('yes') || lowerMessage.includes('confirm') || 
                           lowerMessage.includes('go ahead') || lowerMessage.includes('do it') ||
                           lowerMessage.includes('proceed');
      
      if (isConfirmation) {
        if (this.currentContext.lastOperation === 'send' && 
            this.currentContext.lastRecipient && 
            this.currentContext.lastAmount && 
            this.currentContext.lastToken) {
          
          const paymentRequest: PaymentRequest = {
            to: this.currentContext.lastRecipient as `0x${string}`,
            amount: this.currentContext.lastAmount,
            token: this.currentContext.lastToken
          };
          
          return await this.handlePaymentCommand(paymentRequest, `yes send ${this.currentContext.lastAmount} ${this.currentContext.lastToken} to ${this.currentContext.lastRecipient}`, userAddress);
        }
      }
    }

    return null;
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
   * Extract transaction hash from message
   */
  private extractTransactionHash(message: string): `0x${string}` | null {
    const hashMatch = message.match(/0x[a-fA-F0-9]{64}/);
    return hashMatch ? hashMatch[0] as `0x${string}` : null;
  }

  /**
   * Format address for display
   */
  private formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Get enhanced LLM response
   */
  private async getEnhancedLLMResponse(message: string, userAddress?: string): Promise<string> {
    // If OpenAI client is not available (browser environment), return fallback
    if (!this.openai) {
      console.warn('OpenAI client not available, using fallback response');
      return this.getFallbackResponse(message);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          ...this.buildContextualMessages(),
          {
            role: 'user',
            content: this.formatUserMessage(message, userAddress)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0].message.content || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error('LLM Error:', error);
      return this.getFallbackResponse(message);
    }
  }

  /**
   * Build contextual messages from conversation history
   */
  private buildContextualMessages(): Array<{role: 'user' | 'assistant', content: string}> {
    const recentMessages = this.conversationHistory.slice(-6);
    
    return recentMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
  }

  /**
   * Format user message with context
   */
  private formatUserMessage(message: string, userAddress?: string): string {
    let context = `User message: "${message}"\n\n`;
    
    if (userAddress) {
      context += `User address: ${userAddress}\n`;
    }
    
    const networkInfo = this.paymentAgent.getNetworkInfo();
    context += `Network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})\n`;
    
    context += `\nPlease provide a helpful response about payment operations on Base network.`;
    
    return context;
  }

  /**
   * Get fallback response when LLM fails
   */
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! I\'m your Base payment assistant. I can help you send ETH and USDC payments, check balances, and manage transactions on Base network. What would you like to do?';
    }
    
    if (lowerMessage.includes('help')) {
      return 'I can help you with:\n\n• Send ETH payments\n• Send USDC payments\n• Send batch payments to multiple recipients\n• Check your token balances\n• Check transaction status\n• Use gasless transactions on Base\n\nJust tell me what you\'d like to do!';
    }
    
    if (lowerMessage.includes('send') || lowerMessage.includes('pay')) {
      return 'I can help you send payments on Base network! Please provide details like: "Send 0.1 ETH to 0x742d35Cc6634C0532925a3b8D5C0B4F3e8dCdD98"';
    }
    
    if (lowerMessage.includes('balance')) {
      return 'I can check your ETH and USDC balances on Base network. Just ask "What\'s my balance?" or connect your wallet for me to check.';
    }
    
    return 'I\'m here to help with Base network payments! You can send ETH or USDC, check balances, or get transaction status. What would you like to do?';
  }

  /**
   * Add response to conversation history and return it
   */
  private addToConversationAndReturn(response: PaymentAgentResponse): PaymentAgentResponse {
    const assistantMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: response.message || response.error || 'Operation completed',
      timestamp: new Date(),
      operation: response.transaction ? {
        type: response.transaction.type as any,
        amount: response.transaction.amount,
        token: response.transaction.token,
        recipient: response.transaction.recipient,
        data: response.data
      } : undefined,
      transaction: response.transaction
    };
    
    this.conversationHistory.push(assistantMessage);
    return response;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    this.conversationHistory = [];
    this.currentContext = {};
  }

  /**
   * Get current context
   */
  getCurrentContext(): typeof this.currentContext {
    return { ...this.currentContext };
  }

  /**
   * Get agent status
   */
  getAgentStatus(): {
    initialized: boolean;
    status: string;
    capabilities: string[];
    messageCount: number;
  } {
    return {
      initialized: this.paymentAgent.isAgentInitialized(),
      status: 'ready',
      capabilities: [
        'ETH Payments',
        'USDC Payments',
        'Batch Payments',
        'Balance Checking',
        'Transaction Status',
        'Gasless Transactions',
        'ENS Registration',
        'ENS Availability Check',
        'ENS Resolution'
      ],
      messageCount: this.conversationHistory.length
    };
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

  /**
   * Get help message
   */
  getHelpMessage(): string {
    return `Welcome to the Base Payment Assistant! I can help you with:

💰 Payment Operations
- Send ETH payments to any address
- Send USDC stablecoin payments
- Send batch payments to multiple recipients
- Use gasless transactions (when available)

🌐 ENS Domain Services
- Register .eth domain names
- Check domain availability
- Resolve domain information
- View text records and social profiles

📊 Account Management
- Check your ETH and USDC balances
- View transaction history
- Check transaction status

🔒 Security Features
- Address validation
- Amount confirmation
- Transaction warnings
- Scam protection tips

⚡ Base Network Benefits
- Fast transactions (~2 seconds)
- Low fees (under $0.01)
- Gasless payments available
- Ethereum compatibility

Just tell me what you'd like to do! For example:
- "Send 0.1 ETH to alex.eth"
- "What's my balance?"
- "Register myname.eth"
- "Is alice.eth available?"
- "Who is vitalik.eth?"
- "Check transaction 0xabc123..."
- "Send 10 USDC to multiple addresses"`;
  }
}

// Export factory function and API key
export function createPayAIService(paymentAgent: PaymentAgent, apiKey: string): PayAIService {
  return new PayAIService(paymentAgent, apiKey);
}

export const OPENROUTER_API_KEY = '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';