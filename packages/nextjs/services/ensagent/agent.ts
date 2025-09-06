// Main ENS Agent Class
import { ethers } from 'ethers';
import { ENSContractManager } from './contracts';
import { ENSOperations } from './operations';
import { ENSAIService, OPENROUTER_API_KEY } from './ai';
import { SEPOLIA_NETWORK } from '../../abis/constants';

// Sepolia testnet configuration for ENS resolution
const SEPOLIA_ENS_NETWORK = {
  chainId: 11155111,
  name: 'Ethereum Sepolia Testnet',
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/__krcmuK9Ex84Kfc9l765YL9ljhsIYmJ',
  blockExplorer: 'https://sepolia.etherscan.io',
  ensContracts: {
    ENSRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    BaseRegistrar: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
    ETHRegistrarController: '0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968',
    DNSRegistrar: '0x5a07C75Ae469Bf3ee2657B588e8E6ABAC6741b4f',
    ReverseRegistrar: '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6',
    NameWrapper: '0x0635513f179D50A207757E05759CbD106d7dFcE8',
    PublicResolver: '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5',
    UniversalResolver: '0x3c85752a5d47DD09D677C645Ff2A938B38fbFEbA',
    OffchainDNSResolver: '0x179be112b24ad4cfc392ef8924dfa08c20ad8583'
  }
};
import { 
  ENSAgentConfig, 
  ENSAgentResponse, 
  ENSAgentCapabilities, 
  ENSNameInfo,
  ChatMessage,
  ENSOperation
} from './types';

export class ENSAgent {
  private contractManager: ENSContractManager;
  private operations: ENSOperations;
  private aiService: ENSAIService | null = null;
  private config: ENSAgentConfig;
  private isInitialized: boolean = false;

  constructor(config?: Partial<ENSAgentConfig>) {
    this.config = {
      network: SEPOLIA_NETWORK,
      contracts: SEPOLIA_NETWORK.ensContracts,
      settings: {
        defaultResolver: SEPOLIA_NETWORK.ensContracts.PublicResolver,
        supportedTLDs: ['.eth', '.test'],
        maxNameLength: 50,
        registrationPrice: '0.01',
        minCommitmentAge: 60,
        minRegistrationDuration: 28 * 24 * 60 * 60
      },
      ...config
    };

    // Initialize with default provider
    const provider = new ethers.JsonRpcProvider(this.config.network.rpcUrl);
    console.log(`Initializing ENS Agent with RPC: ${this.config.network.rpcUrl}`);
    this.contractManager = new ENSContractManager(provider, this.config);
    this.operations = new ENSOperations(this.contractManager);
    
    // Only initialize AI service on server side
    if (typeof window === 'undefined') {
      this.aiService = new ENSAIService(this, OPENROUTER_API_KEY);
    }
    
    this.isInitialized = true;
  }

  /**
   * Initialize with a custom provider
   */
  async initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
    if (this.isInitialized) {
      console.warn('ENS Agent already initialized, skipping...');
      return; // Already initialized
    }

    try {
      // Re-initialize with the new provider
      this.contractManager = new ENSContractManager(provider, this.config);
      if (signer) {
        this.contractManager.setSigner(signer);
      }
      this.operations = new ENSOperations(this.contractManager);
      
      // Re-initialize AI service with updated agent
      if (typeof window === 'undefined') {
        this.aiService = new ENSAIService(this, OPENROUTER_API_KEY);
      }
      
      this.isInitialized = true;
      console.log('ENS Agent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ENS Agent:', error);
      throw error;
    }
  }

  /**
   * Set the signer for transactions
   */
  setSigner(signer: ethers.Signer): void {
    this.contractManager.setSigner(signer);
  }

  /**
   * Process a chat message
   */
  async processMessage(message: string, userAddress?: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    // Use AI service for enhanced chat processing if available (server-side only)
    if (this.aiService) {
      return await this.aiService.processMessage(message, userAddress);
    } else {
      // Fallback to basic operations processing
      return await this.operations.processChatMessage(message, userAddress);
    }
  }

  /**
   * Get comprehensive name information
   */
  async getNameInfo(name: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.getNameInfo(name);
  }

  /**
   * Check if a name is available
   */
  async isNameAvailable(name: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.isNameAvailable(name);
  }

  /**
   * Resolve a name to an address
   */
  async resolveName(name: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.resolveName(name);
  }

  /**
   * Resolve an address to a name (uses Sepolia for ENS resolution)
   */
  async resolveAddress(address: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    // Create a Sepolia provider for ENS resolution
    const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_ENS_NETWORK.rpcUrl);
    const sepoliaContractManager = new ENSContractManager(sepoliaProvider, {
      network: SEPOLIA_ENS_NETWORK,
      contracts: SEPOLIA_ENS_NETWORK.ensContracts,
      settings: {
        defaultResolver: SEPOLIA_ENS_NETWORK.ensContracts.PublicResolver,
        supportedTLDs: ['.eth', '.test'],
        maxNameLength: 50,
        registrationPrice: '0.01',
        minCommitmentAge: 60,
        minRegistrationDuration: 28 * 24 * 60 * 60
      }
    });

    return await sepoliaContractManager.resolveAddress(address);
  }

  /**
   * Register a name
   */
  async registerName(name: string, owner: string, duration: number, secret?: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    const finalSecret = secret || this.generateSecret();
    return await this.contractManager.registerName(name, owner, duration, finalSecret);
  }

  /**
   * Renew a name
   */
  async renewName(name: string, duration: number): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.renewName(name, duration);
  }

  /**
   * Get price for a name registration
   */
  async getPrice(name: string, duration: number): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.getPrice(name, duration);
  }

  /**
   * Transfer a name
   */
  async transferName(name: string, newOwner: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.transferName(name, newOwner);
  }

  /**
   * Set a text record
   */
  async setTextRecord(name: string, key: string, value: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.setTextRecord(name, key, value);
  }

  /**
   * Set an address record
   */
  async setAddressRecord(name: string, address: string, coinType: number = 60): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.setAddressRecord(name, address, coinType);
  }

  /**
   * Set the resolver for a name
   */
  async setResolver(name: string, resolverAddress: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.setResolver(name, resolverAddress);
  }

  /**
   * Get a text record
   */
  async getTextRecord(name: string, key: string): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.getTextRecord(name, key);
  }

  /**
   * Get an address record
   */
  async getAddressRecord(name: string, coinType: number = 60): Promise<ENSAgentResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ENS Agent not initialized'
      };
    }

    return await this.contractManager.getAddressRecord(name, coinType);
  }

  /**
   * Get chat history
   */
  getChatHistory(): ChatMessage[] {
    return this.operations.getChatHistory();
  }

  /**
   * Clear chat history
   */
  clearChatHistory(): void {
    this.operations.clearChatHistory();
  }

  /**
   * Get operation history
   */
  getOperationHistory(): ENSOperation[] {
    return this.operations.getOperationHistory();
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): ENSAgentCapabilities {
    return {
      canRegister: true,
      canRenew: true,
      canSetResolver: true,
      canSetRecords: true,
      canTransfer: true,
      canResolve: true,
      canCommit: true,
      canReveal: true
    };
  }

  /**
   * Get agent status
   */
  getStatus(): { 
    initialized: boolean; 
    status: string; 
    capabilities: ENSAgentCapabilities; 
    messageCount: number;
  } {
    return {
      initialized: this.isInitialized,
      status: 'ready',
      capabilities: this.getCapabilities(),
      messageCount: this.getChatHistory().length
    };
  }

  /**
   * Generate a random secret
   */
  private generateSecret(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  /**
   * Get agent configuration
   */
  getConfig(): ENSAgentConfig {
    return { ...this.config };
  }

  /**
   * Update agent configuration
   */
  updateConfig(newConfig: Partial<ENSAgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if agent is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get network information
   */
  getNetworkInfo(): { chainId: number; name: string; rpcUrl: string; blockExplorer: string } {
    return { ...this.config.network };
  }

  /**
   * Get contract addresses
   */
  getContractAddresses(): Record<string, string> {
    return { ...this.config.contracts };
  }

  /**
   * Get settings
   */
  getSettings(): typeof this.config.settings {
    return { ...this.config.settings };
  }

  /**
   * Get AI service instance
   */
  getAIService(): ENSAIService | null {
    return this.aiService;
  }

  /**
   * Get suggested operations
   */
  async getSuggestedOperations(name?: string): Promise<string[]> {
    if (!this.aiService) {
      return ['Check name availability', 'Register a domain', 'Set records', 'Resolve names'];
    }
    return await this.aiService.getSuggestedOperations(name);
  }

  /**
   * Get help message
   */
  getHelpMessage(): string {
    if (!this.aiService) {
      return 'AI service not available. Please try basic ENS operations.';
    }
    return this.aiService.getHelpMessage();
  }

  /**
   * Get AI-enhanced agent status
   */
  getAIStatus(): { 
    initialized: boolean; 
    status: string; 
    capabilities: string[];
    messageCount: number;
  } {
    if (!this.aiService) {
      return {
        initialized: false,
        status: 'AI service not available',
        capabilities: ['Basic ENS operations'],
        messageCount: 0
      };
    }
    return this.aiService.getAgentStatus();
  }

  /**
   * Get AI agent statistics
   */
  getAIStats(): {
    totalMessages: number;
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageResponseTime: number;
  } {
    if (!this.aiService) {
      return {
        totalMessages: 0,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageResponseTime: 0
      };
    }
    return this.aiService.getAgentStats();
  }

  /**
   * Get operations instance for AI service
   */
  getOperations(): ENSOperations {
    return this.operations;
  }
}
