// ENS Operations Module
import { ENSContractManager } from './contracts';
import { ENSAgentResponse, ENSOperation, ENSNameInfo, ENSCommitment, ENSPrice, ChatMessage } from './types';
import { validateENSName, generateSecret, createCommitment, calculatePrice, isValidAddress } from './utils';

export class ENSOperations {
  private contractManager: ENSContractManager;
  private operationHistory: ENSOperation[] = [];
  private chatHistory: ChatMessage[] = [];

  constructor(contractManager: ENSContractManager) {
    this.contractManager = contractManager;
  }

  /**
   * Process a chat message and determine the appropriate ENS operation
   */
  async processChatMessage(message: string, userAddress?: string): Promise<ENSAgentResponse> {
    const chatMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    this.chatHistory.push(chatMessage);

    try {
      const operation = await this.parseMessageToOperation(message, userAddress);
      if (!operation) {
        return {
          success: false,
          error: 'Could not understand the request. Please try rephrasing your ENS operation.'
        };
      }

      const result = await this.executeOperation(operation);
      
      // Add assistant response to chat history
      const assistantMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: result.message || 'Operation completed',
        timestamp: new Date(),
        operation,
        transaction: result.transaction
      };

      this.chatHistory.push(assistantMessage);

      return result;
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: `Error: ${error}`,
        timestamp: new Date()
      };

      this.chatHistory.push(errorMessage);

      return {
        success: false,
        error: `Failed to process message: ${error}`
      };
    }
  }

  /**
   * Parse natural language message to ENS operation
   */
  private async parseMessageToOperation(message: string, userAddress?: string): Promise<ENSOperation | null> {
    const lowerMessage = message.toLowerCase();

    // Check for name availability
    if (lowerMessage.includes('available') || lowerMessage.includes('check') || lowerMessage.includes('is')) {
      const name = this.extractNameFromMessage(message);
      if (name) {
        return {
          type: 'resolve',
          name,
          data: { checkAvailability: true }
        };
      }
    }

    // Check for registration
    if (lowerMessage.includes('register') || lowerMessage.includes('buy') || lowerMessage.includes('get')) {
      const name = this.extractNameFromMessage(message);
      if (name) {
        const duration = this.extractDurationFromMessage(message) || 365 * 24 * 60 * 60; // Default 1 year
        return {
          type: 'register',
          name,
          data: { 
            owner: userAddress,
            duration,
            secret: generateSecret()
          }
        };
      }
    }

    // Check for renewal
    if (lowerMessage.includes('renew') || lowerMessage.includes('extend')) {
      const name = this.extractNameFromMessage(message);
      if (name) {
        const duration = this.extractDurationFromMessage(message) || 365 * 24 * 60 * 60;
        return {
          type: 'renew',
          name,
          data: { duration }
        };
      }
    }

    // Check for setting records
    if (lowerMessage.includes('set') || lowerMessage.includes('update') || lowerMessage.includes('add')) {
      const name = this.extractNameFromMessage(message);
      if (name) {
        const record = this.extractRecordFromMessage(message);
        if (record) {
          return {
            type: 'setRecord',
            name,
            data: record
          };
        }
      }
    }

    // Check for resolution
    if (lowerMessage.includes('resolve') || lowerMessage.includes('lookup') || lowerMessage.includes('find')) {
      const name = this.extractNameFromMessage(message);
      if (name) {
        return {
          type: 'resolve',
          name,
          data: { resolveAddress: true }
        };
      }
    }

    // Check for transfer
    if (lowerMessage.includes('transfer') || lowerMessage.includes('give') || lowerMessage.includes('send')) {
      const name = this.extractNameFromMessage(message);
      const address = this.extractAddressFromMessage(message);
      if (name && address) {
        return {
          type: 'transfer',
          name,
          data: { newOwner: address }
        };
      }
    }

    return null;
  }

  /**
   * Execute an ENS operation
   */
  async executeOperation(operation: ENSOperation): Promise<ENSAgentResponse> {
    this.operationHistory.push(operation);

    try {
      switch (operation.type) {
        case 'register':
          return await this.handleRegistration(operation);
        case 'renew':
          return await this.handleRenewal(operation);
        case 'setRecord':
          return await this.handleSetRecord(operation);
        case 'transfer':
          return await this.handleTransfer(operation);
        case 'resolve':
          return await this.handleResolution(operation);
        case 'commit':
          return await this.handleCommitment(operation);
        case 'reveal':
          return await this.handleReveal(operation);
        default:
          return {
            success: false,
            error: `Unknown operation type: ${operation.type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Operation failed: ${error}`
      };
    }
  }

  /**
   * Handle name registration
   */
  private async handleRegistration(operation: ENSOperation): Promise<ENSAgentResponse> {
    const { name, data } = operation;
    
    // Validate name
    const validation = validateENSName(name);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Check availability
    const availability = await this.contractManager.isNameAvailable(name);
    if (!availability.success || !availability.data?.available) {
      return {
        success: false,
        error: 'Name is not available for registration'
      };
    }

    // Register the name
    const result = await this.contractManager.registerName(
      name,
      data.owner,
      data.duration,
      data.secret
    );

    return result;
  }

  /**
   * Handle name renewal
   */
  private async handleRenewal(operation: ENSOperation): Promise<ENSAgentResponse> {
    const { name, data } = operation;
    
    const validation = validateENSName(name);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    return await this.contractManager.renewName(name, data.duration);
  }

  /**
   * Handle setting records
   */
  private async handleSetRecord(operation: ENSOperation): Promise<ENSAgentResponse> {
    const { name, data } = operation;
    
    const validation = validateENSName(name);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    if (data.key && data.value) {
      // Text record
      return await this.contractManager.setTextRecord(name, data.key, data.value);
    } else if (data.address && data.coinType !== undefined) {
      // Address record
      return await this.contractManager.setAddressRecord(name, data.address, data.coinType);
    } else if (data.resolver) {
      // Set resolver
      return await this.contractManager.setResolver(name, data.resolver);
    }

    return {
      success: false,
      error: 'Invalid record data'
    };
  }

  /**
   * Handle name transfer
   */
  private async handleTransfer(operation: ENSOperation): Promise<ENSAgentResponse> {
    const { name, data } = operation;
    
    const validation = validateENSName(name);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    if (!isValidAddress(data.newOwner)) {
      return {
        success: false,
        error: 'Invalid new owner address'
      };
    }

    return await this.contractManager.transferName(name, data.newOwner);
  }

  /**
   * Handle name resolution
   */
  private async handleResolution(operation: ENSOperation): Promise<ENSAgentResponse> {
    const { name, data } = operation;
    
    const validation = validateENSName(name);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    if (data.checkAvailability) {
      return await this.contractManager.isNameAvailable(name);
    } else if (data.resolveAddress) {
      return await this.contractManager.resolveName(name);
    } else {
      // Get comprehensive name info
      return await this.contractManager.getNameInfo(name);
    }
  }

  /**
   * Handle commitment creation
   */
  private async handleCommitment(operation: ENSOperation): Promise<ENSAgentResponse> {
    const { name, data } = operation;
    
    const validation = validateENSName(name);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    return await this.contractManager.createCommitment(name, data.owner, data.secret);
  }

  /**
   * Handle reveal operation
   */
  private async handleReveal(operation: ENSOperation): Promise<ENSAgentResponse> {
    // This would be implemented based on the specific reveal logic
    return {
      success: false,
      error: 'Reveal operation not yet implemented'
    };
  }

  /**
   * Extract ENS name from message
   */
  public extractNameFromMessage(message: string): string | null {
    const ensPattern = /([a-z0-9-]+\.eth)/gi;
    const match = message.match(ensPattern);
    return match ? match[0].toLowerCase() : null;
  }

  /**
   * Extract duration from message
   */
  public extractDurationFromMessage(message: string): number | null {
    const durationPattern = /(\d+)\s*(day|days|year|years|month|months)/gi;
    const match = message.match(durationPattern);
    
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      switch (unit) {
        case 'day':
        case 'days':
          return value * 24 * 60 * 60;
        case 'month':
        case 'months':
          return value * 30 * 24 * 60 * 60;
        case 'year':
        case 'years':
          return value * 365 * 24 * 60 * 60;
      }
    }
    
    return null;
  }

  /**
   * Extract record information from message
   */
  public extractRecordFromMessage(message: string): any | null {
    // Extract key-value pairs
    const keyValuePattern = /(\w+)\s*[:=]\s*([^\s]+)/gi;
    const matches = message.match(keyValuePattern);
    
    if (matches) {
      const record: any = {};
      matches.forEach(match => {
        const [key, value] = match.split(/[:=]/).map(s => s.trim());
        record[key] = value;
      });
      return record;
    }

    // Extract address
    const addressPattern = /0x[a-fA-F0-9]{40}/g;
    const addressMatch = message.match(addressPattern);
    if (addressMatch) {
      return { address: addressMatch[0], coinType: 60 };
    }

    return null;
  }

  /**
   * Extract address from message
   */
  private extractAddressFromMessage(message: string): string | null {
    const addressPattern = /0x[a-fA-F0-9]{40}/g;
    const match = message.match(addressPattern);
    return match ? match[0] : null;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get operation history
   */
  getOperationHistory(): ENSOperation[] {
    return [...this.operationHistory];
  }

  /**
   * Get chat history
   */
  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  /**
   * Clear chat history
   */
  clearChatHistory(): void {
    this.chatHistory = [];
  }

  /**
   * Get comprehensive name information
   */
  async getNameInfo(name: string): Promise<ENSAgentResponse> {
    return await this.contractManager.getNameInfo(name);
  }

  /**
   * Get name price
   */
  async getNamePrice(name: string, duration: number): Promise<ENSAgentResponse> {
    try {
      const price = calculatePrice(name, duration);
      return {
        success: true,
        data: { name, duration, price },
        message: `Price for ${name} (${duration} seconds): ${price} ETH`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate price: ${error}`
      };
    }
  }

}
