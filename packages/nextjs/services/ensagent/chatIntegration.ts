// ENS Chat Integration Service
import { ENSAgent } from './agent';
import { ENSAgentResponse, ChatMessage as ENSChatMessage } from './types';
import { ethers } from 'ethers';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  pendingAction?: {
    type: string;
    description: string;
    ensName?: string;
    cost?: string;
    [key: string]: any;
  };
  actions?: {
    type: 'transaction' | 'update' | 'confirmation' | 'ens_operation';
    description: string;
    txHash?: string;
    status: 'pending' | 'completed' | 'failed' | 'confirmed';
  }[];
  metadata?: {
    ensQuery?: string;
    action?: any;
    confidence?: number;
    suggestions?: string[];
  };
}

export class ENSChatIntegration {
  private agent: ENSAgent;
  private isInitialized: boolean = false;
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    this.agent = new ENSAgent();
  }

  /**
   * Initialize with provider and signer (optional for API-based processing)
   */
  async initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
    if (this.isInitialized) {
      console.warn('ENS Chat Integration already initialized, skipping...');
      return;
    }
    
    // For client-side, we don't need to initialize the agent
    // as processing happens via API routes
    this.isInitialized = true;
    console.log('ENS Chat Integration initialized successfully');
  }

  /**
   * Process a chat message and return formatted response
   */
  async processMessage(message: string, userAddress?: string): Promise<{
    success: boolean;
    chatMessage: ChatMessage;
    error?: string;
  }> {
    try {
      // Add user message to conversation history
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content: message,
        sender: 'user',
        timestamp: new Date()
      };
      this.conversationHistory.push(userMessage);

      // Call the API route instead of direct agent processing
      const response = await fetch('/api/ens/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userAddress,
          conversationHistory: this.conversationHistory.slice(-10) // Send last 10 messages for context
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const chatMessage = this.convertToChatMessage(message, result);
        this.conversationHistory.push(chatMessage);
        return {
          success: true,
          chatMessage,
          error: result.error
        };
      } else {
        const errorMessage = this.createErrorMessage(result.error || 'Failed to process message');
        this.conversationHistory.push(errorMessage);
        return {
          success: false,
          chatMessage: errorMessage,
          error: result.error
        };
      }
    } catch (error) {
      console.error('ENS Chat Integration Error:', error);
      const errorMessage = this.createErrorMessage(`Failed to process message: ${error}`);
      this.conversationHistory.push(errorMessage);
      return {
        success: false,
        chatMessage: errorMessage,
        error: `Processing error: ${error}`
      };
    }
  }

  /**
   * Check if message is ENS-related
   */
  isENSMessage(message: string): boolean {
    // Always return true to ensure all messages go through LLM processing
    // The LLM will determine if it's ENS-related and respond appropriately
    return true;
  }

  /**
   * Get ENS suggestions
   */
  getENSSuggestions(): string[] {
    return [
      "Is vitalik.eth available?",
      "Register myname.eth for 1 year",
      "Set description for myname.eth to 'My awesome website'",
      "What does example.eth resolve to?",
      "Tell me about myname.eth",
      "Renew myname.eth for 2 years",
      "Set ETH address for myname.eth to 0x...",
      "Transfer myname.eth to 0x..."
    ];
  }

  /**
   * Get agent status
   */
  getAgentStatus() {
    return {
      initialized: this.isInitialized,
      ready: this.agent.isReady(),
      capabilities: [
        'Name registration and renewal',
        'Record management (text, address, custom)',
        'Name resolution and reverse lookup',
        'Natural language processing',
        'Transaction management'
      ]
    };
  }

  /**
   * Convert ENS response to chat message
   */
  private convertToChatMessage(userMessage: string, response: ENSAgentResponse): ChatMessage {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chatMessage: ChatMessage = {
      id: messageId,
      content: response.message || (response.success ? 'Operation completed successfully' : 'Operation failed'),
      sender: 'ai',
      timestamp: new Date(),
      metadata: {
        ensQuery: this.extractENSName(userMessage),
        action: response.data,
        confidence: response.success ? 0.9 : 0.1
      }
    };

    // Add pending actions if it's a transaction
    if (response.transaction) {
      const operationType = response.transaction.type || response.data?.type;
      const ensName = response.transaction.ensName || this.extractENSName(userMessage);
      const cost = response.data?.costEth || response.data?.price || '0.01 ETH';
      
      chatMessage.pendingAction = {
        type: 'ens_operation',
        description: this.getOperationDescription(operationType),
        ensName: ensName,
        cost: cost,
        txHash: response.transaction.hash
      };

      chatMessage.actions = [{
        type: 'ens_operation',
        description: this.getOperationDescription(operationType),
        txHash: response.transaction.hash,
        status: response.transaction.status || 'pending'
      }];
    }

    return chatMessage;
  }

  /**
   * Create error message
   */
  private createErrorMessage(error: string): ChatMessage {
    return {
      id: `error_${Date.now()}`,
      content: error,
      sender: 'ai',
      timestamp: new Date(),
      metadata: {
        confidence: 0.1,
        suggestions: this.getENSSuggestions()
      }
    };
  }

  /**
   * Extract ENS name from message
   */
  private extractENSName(message: string): string | undefined {
    const ensPattern = /([a-z0-9-]+\.eth)/gi;
    const match = message.match(ensPattern);
    return match ? match[0].toLowerCase() : undefined;
  }

  /**
   * Get operation description
   */
  private getOperationDescription(operationType?: string): string {
    const descriptions: { [key: string]: string } = {
      'register': 'Registering ENS name',
      'renew': 'Renewing ENS name',
      'setRecord': 'Setting ENS record',
      'transfer': 'Transferring ENS name',
      'resolve': 'Resolving ENS name',
      'commit': 'Creating commitment',
      'reveal': 'Revealing commitment',
      'registration_ready': 'Ready to register ENS name',
      'renewal_ready': 'Ready to renew ENS name',
      'set_record_ready': 'Ready to set ENS record',
      'transfer_ready': 'Ready to transfer ENS name',
      'name_available': 'ENS name is available',
      'name_registered': 'ENS name is registered',
      'general_query': 'ENS name query'
    };
    
    return descriptions[operationType || ''] || 'Processing ENS operation';
  }

  /**
   * Get chat history
   */
  getChatHistory(): ENSChatMessage[] {
    return this.agent.getChatHistory();
  }

  /**
   * Clear chat history
   */
  clearChatHistory(): void {
    this.agent.clearChatHistory();
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.agent.isReady();
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
  }

  /**
   * Get conversation context for better responses
   */
  getConversationContext(): string {
    if (this.conversationHistory.length === 0) return '';
    
    const recentMessages = this.conversationHistory.slice(-6); // Last 6 messages
    return recentMessages.map(msg => 
      `${msg.sender}: ${msg.content}`
    ).join('\n');
  }
}

// Export singleton instance
export const ensChatIntegration = new ENSChatIntegration();
