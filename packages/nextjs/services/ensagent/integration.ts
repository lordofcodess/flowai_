// ENS Agent Integration Helper for Existing Chat Interfaces
import { ENSAgent } from './agent';
import { ENSAgentResponse } from './types';
import { ethers } from 'ethers';

/**
 * Simple integration helper for existing chat interfaces
 * This provides a clean interface to integrate ENS functionality into your chat
 */
export class ENSIntegration {
  private agent: ENSAgent;
  private isInitialized: boolean = false;

  constructor() {
    this.agent = new ENSAgent();
  }

  /**
   * Initialize the ENS agent with your provider and signer
   */
  async initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
    await this.agent.initialize(provider, signer);
    this.isInitialized = true;
  }

  /**
   * Process a chat message - main integration point
   * Returns a response that you can display in your chat interface
   */
  async processChatMessage(message: string, userAddress?: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
    operation?: string;
    transaction?: any;
  }> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: 'ENS Agent not initialized. Please connect your wallet first.',
        error: 'Agent not initialized'
      };
    }

    try {
      const response = await this.agent.processMessage(message, userAddress);
      
      return {
        success: response.success,
        message: response.message || (response.success ? 'Operation completed successfully' : 'Operation failed'),
        data: response.data,
        error: response.error,
        operation: response.data?.operationType,
        transaction: response.transaction
      };
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while processing your request.',
        error: `Integration error: ${error}`
      };
    }
  }

  /**
   * Get available ENS operations for suggestions/help
   */
  getAvailableOperations(): string[] {
    return [
      'Check if a name is available',
      'Register a new ENS name',
      'Renew an existing name',
      'Set text records (description, url, email, etc.)',
      'Set address records (ETH, BTC, etc.)',
      'Resolve name to address',
      'Resolve address to name',
      'Transfer name ownership',
      'Get comprehensive name information'
    ];
  }

  /**
   * Get example commands for your chat interface
   */
  getExampleCommands(): string[] {
    return [
      'Is example.eth available?',
      'Register mydomain.eth for 1 year',
      'Set description for mydomain.eth to "My awesome website"',
      'Set ETH address for mydomain.eth to 0x...',
      'What does vitalik.eth resolve to?',
      'Tell me about example.eth',
      'Transfer mydomain.eth to 0x...',
      'Renew mydomain.eth for 2 years'
    ];
  }

  /**
   * Check if a message is ENS-related
   */
  isENSMessage(message: string): boolean {
    const ensKeywords = [
      'ens', 'eth', 'register', 'domain', 'name', 'resolve', 'record',
      'transfer', 'renew', 'available', 'resolver', 'address'
    ];
    
    const lowerMessage = message.toLowerCase();
    return ensKeywords.some(keyword => lowerMessage.includes(keyword)) || 
           /\.eth\b/.test(message) || 
           /0x[a-fA-F0-9]{40}/.test(message);
  }

  /**
   * Get agent status for your chat interface
   */
  getAgentStatus(): {
    initialized: boolean;
    ready: boolean;
    capabilities: string[];
  } {
    return {
      initialized: this.isInitialized,
      ready: this.agent.isReady(),
      capabilities: this.getAvailableOperations()
    };
  }

  /**
   * Get help text for your chat interface
   */
  getHelpText(): string {
    return `🤖 ENS Agent Commands

Name Operations:
• Check availability: "Is example.eth available?"
• Register: "Register mydomain.eth for 1 year"
• Renew: "Renew mydomain.eth for 2 years"
• Transfer: "Transfer mydomain.eth to 0x..."

Record Operations:
• Set text: "Set description for example.eth to 'My site'"
• Set address: "Set ETH address for example.eth to 0x..."
• Set resolver: "Set resolver for example.eth to 0x..."

Resolution:
• Resolve name: "What does vitalik.eth resolve to?"
• Get info: "Tell me about example.eth"

Tips:
• Always include .eth suffix
• Use natural language - I understand context
• Make sure you're connected to Sepolia testnet`;
  }

  /**
   * Direct ENS operations (if you want to bypass chat parsing)
   */
  async checkNameAvailability(name: string) {
    return await this.agent.isNameAvailable(name);
  }

  async registerName(name: string, owner: string, duration: number) {
    return await this.agent.registerName(name, owner, duration);
  }

  async resolveName(name: string) {
    return await this.agent.resolveName(name);
  }

  async setNameInfo(name: string, key: string, value: string) {
    return await this.agent.setTextRecord(name, key, value);
  }

  async getNameInfo(name: string) {
    return await this.agent.getNameInfo(name);
  }

  /**
   * Get conversation history (if you want to maintain context)
   */
  getConversationHistory() {
    return this.agent.getChatHistory();
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory() {
    this.agent.clearChatHistory();
  }
}

// Export a default instance for easy use
export const ensIntegration = new ENSIntegration();
