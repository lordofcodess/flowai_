import OpenAI from 'openai';
import { ENSAgent } from '../agent';
import { ENSAgentResponse, ChatMessage, ENSOperation } from '../types';
import { randomBytes } from 'crypto';

export class ENSAIService {
  private openai: OpenAI;
  private ensAgent: ENSAgent;
  private systemPrompt: string;
  private conversationHistory: ChatMessage[] = [];
  private currentContext: {
    lastENSName?: string;
    lastOperation?: string;
    pendingOperations?: string[];
    userAddress?: string;
    sessionData?: any;
  } = {};

  constructor(ensAgent: ENSAgent, apiKey: string) {
    this.ensAgent = ensAgent;
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://ethaccra.com', // Your site URL
        'X-Title': 'ENS Agent - Ethereum Name Service Assistant', // Your site title
      },
    });

    this.systemPrompt = this.createSystemPrompt();
  }

  /**
   * Create comprehensive system prompt for ENS operations
   */
  private createSystemPrompt(): string {
    return `You are an expert Ethereum Name Service (ENS) assistant. Your role is to help users interact with the ENS system by calling the appropriate ENS functions.

## Important Rules:
1. NEVER generate fake ENS data - always call the actual ENS functions
2. If ENS data retrieval fails, return the error message, don't make up data
3. Only provide real data from the blockchain via ENS contracts

## Your Capabilities

### Core ENS Operations:
1. Name Registration: Help users register .eth domain names
2. Name Resolution: Resolve ENS names to addresses and vice versa
3. Record Management: Set and retrieve text records, address records, and other resolver data
4. Name Renewal: Extend the registration period for existing names
5. Name Transfer: Transfer ownership of ENS names
6. Availability Checking: Check if names are available for registration
7. Price Calculation: Calculate registration and renewal costs
8. Commitment/Reveal: Handle the two-step registration process for security

### Supported Record Types:
- Address Records: Map names to Ethereum addresses (ETH, BTC, LTC, etc.)
- Text Records: Store arbitrary key-value pairs (email, url, description, etc.)
- Content Hash: Store IPFS hashes for decentralized websites
- ABI: Store contract ABI for smart contract interaction
- Public Key: Store public keys for encryption/signing

### Network Information:
- Current Network: Sepolia Testnet
- Supported TLDs: .eth, .test
- Default Resolver: Public Resolver contract
- Registration Price: Dynamic pricing based on name length and demand
- Minimum Duration: 28 days
- Commitment Period: 60 seconds minimum

## Response Guidelines

### Always:
1. Be Helpful: Provide clear, actionable guidance
2. Be Accurate: Verify information before responding
3. Be Secure: Warn about security implications of operations
4. Be Educational: Explain what operations do and why they're useful
5. Be Proactive: Suggest related operations or optimizations

### Response Format:
- Use clear, conversational language
- Include relevant technical details when helpful
- Provide step-by-step instructions for complex operations
- Include warnings for irreversible operations
- Suggest alternatives when appropriate
- Do NOT use markdown formatting (no **bold**, *italic*, or other markdown syntax)
- Use plain text only for better readability

### Error Handling:
- Explain errors in user-friendly terms
- Provide troubleshooting steps
- Suggest alternative approaches
- Never expose sensitive information

## Common User Requests and Responses

### Name Registration:
- "Register myname.eth" → Guide through registration process
- "How much does myname.eth cost?" → Calculate and explain pricing
- "Is myname.eth available?" → Check availability and provide status
- "Is blockdevrel.eth available?" → Check availability and provide clear yes/no answer

### Name Resolution:
- "What's the address for myname.eth?" → Resolve name to address
- "What name does 0x123... own?" → Reverse resolve address to name
- "Show me all records for myname.eth" → Display comprehensive name info

### Record Management:
- "Set my email for myname.eth" → Guide through setting text records
- "Update the address for myname.eth" → Help update address records
- "Add a website URL to myname.eth" → Set content hash or URL record

### Advanced Operations:
- "Transfer myname.eth to 0x456..." → Guide through transfer process
- "Renew myname.eth for 2 years" → Help with renewal
- "Set up a subdomain for myname.eth" → Explain subdomain management

## Security Considerations

### Always Warn About:
- Irreversible Operations: Transfers, certain record updates
- Private Key Security: Never ask for or store private keys
- Phishing: Warn about fake ENS interfaces
- Gas Costs: Explain transaction fees
- Commitment Period: Explain the 60-second wait for registrations

### Best Practices to Promote:
- Use hardware wallets for valuable names
- Verify all addresses before transfers
- Keep records up to date
- Monitor expiration dates
- Use descriptive record names

## Technical Context

You have access to the following ENS contracts and operations:
- ENS Registry: Core name management
- ETH Registrar: .eth domain registration
- Public Resolver: Standard record management
- Reverse Registrar: Address-to-name resolution
- Price Oracle: Dynamic pricing calculation

## Example Interactions

User: "I want to register myname.eth"
Response: "I'll help you register myname.eth! First, let me check if it's available and calculate the cost. [Check availability] [Calculate price] [Guide through registration process]"

User: "What can I do with myname.eth?"
Response: "With myname.eth, you can: 1) Set it to point to your wallet address, 2) Add text records like email and website, 3) Create subdomains, 4) Use it for decentralized websites, and more. What would you like to set up first?"

User: "How do I set up a website with myname.eth?"
Response: "To set up a website with myname.eth, you'll need to: 1) Upload your website to IPFS, 2) Set the content hash record, 3) Configure your resolver. Would you like me to guide you through this process?"

Remember: You are a helpful, knowledgeable, and security-conscious ENS assistant. Always prioritize user education and security while making ENS operations accessible and easy to understand.`;
  }

  /**
   * Process a chat message using the LLM with context awareness
   */
  async processMessage(message: string, userAddress?: string): Promise<ENSAgentResponse> {
    try {
      // Update context with user address
      if (userAddress) {
        this.currentContext.userAddress = userAddress;
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
      const ensName = this.extractENSName(message);
      
      // Handle follow-up questions and context-based queries
      const contextualResponse = await this.handleContextualQuery(message, lowerMessage, ensName, userAddress);
      if (contextualResponse) {
        return this.addToConversationAndReturn(contextualResponse);
      }

      // If we found an ENS name, determine the intent
      if (ensName) {
        console.log(`ENS name detected: ${ensName}`);
        this.currentContext.lastENSName = ensName;
        
        // Check for registration commands
        if (lowerMessage.includes('register') || lowerMessage.includes('buy') || lowerMessage.includes('get')) {
          console.log(`Registration command detected for: ${ensName}`);
          this.currentContext.lastOperation = 'register';
          return this.addToConversationAndReturn(await this.handleRegistrationCommand(ensName, message, userAddress));
        }
        
        // Check for renewal commands
        if (lowerMessage.includes('renew') || lowerMessage.includes('extend')) {
          console.log(`Renewal command detected for: ${ensName}`);
          this.currentContext.lastOperation = 'renew';
          return this.addToConversationAndReturn(await this.handleRenewalCommand(ensName, message, userAddress));
        }
        
        // Check for set record commands
        if (lowerMessage.includes('set') || lowerMessage.includes('update') || lowerMessage.includes('add')) {
          console.log(`Set record command detected for: ${ensName}`);
          this.currentContext.lastOperation = 'setRecord';
          return this.addToConversationAndReturn(await this.handleSetRecordCommand(ensName, message, userAddress));
        }
        
        // Check for transfer commands
        if (lowerMessage.includes('transfer') || lowerMessage.includes('give') || lowerMessage.includes('send')) {
          console.log(`Transfer command detected for: ${ensName}`);
          this.currentContext.lastOperation = 'transfer';
          return this.addToConversationAndReturn(await this.handleTransferCommand(ensName, message, userAddress));
        }
        
        // Check for availability queries specifically
        if (lowerMessage.includes('available') || lowerMessage.includes('is available') || lowerMessage.includes('check if')) {
          console.log(`Availability check for: ${ensName}`);
          this.currentContext.lastOperation = 'availability';
          const availabilityData = await this.ensAgent.isNameAvailable(ensName);
          console.log(`Availability check success: ${availabilityData.success}`);
          
          if (availabilityData.success) {
            const isAvailable = availabilityData.data?.available;
            const message = isAvailable 
              ? `${ensName} is available for registration!`
              : `${ensName} is already registered and not available.`;
            
            return this.addToConversationAndReturn({
              success: true,
              data: {
                message,
                type: 'availability_check',
                ensName,
                available: isAvailable,
                timestamp: new Date().toISOString()
              },
              message
            });
          } else {
            console.log(`Availability check failed: ${availabilityData.error}`);
            return this.addToConversationAndReturn({
              success: false,
              error: `Failed to check availability for ${ensName}: ${availabilityData.error}`
            });
          }
        }
        
        // Check for resolution or general info queries
        if (lowerMessage.includes('resolve') || lowerMessage.includes('what') || lowerMessage.includes('info') || lowerMessage.includes('tell me about')) {
          console.log(`ENS data query for: ${ensName}`);
          this.currentContext.lastOperation = 'resolve';
          // Use agent's getNameInfo method
          const ensData = await this.ensAgent.getNameInfo(ensName);
          console.log(`ENS data success: ${ensData.success}`);
          if (ensData.success) {
            console.log(`ENS data:`, ensData.data);
            // Format the ENS data into a readable response
            const formattedResponse = this.formatENSData(ensName, ensData.data);
            return this.addToConversationAndReturn({
              success: true,
              data: {
                message: formattedResponse,
                type: 'ens_data',
                ensData: ensData.data,
                timestamp: new Date().toISOString()
              },
              message: formattedResponse
            });
          } else {
            console.log(`ENS data failed: ${ensData.error}`);
            // Return the error instead of falling back to LLM
            return this.addToConversationAndReturn({
              success: false,
              error: `Failed to get ENS data for ${ensName}: ${ensData.error}`
            });
          }
        }
        
        // If just mentioning an ENS name without clear intent, provide helpful options
        console.log(`ENS name mentioned without clear intent: ${ensName}`);
        return this.addToConversationAndReturn(await this.handleGeneralENSQuery(ensName, message, userAddress));
      }

      // For non-ENS queries, use enhanced LLM to determine what ENS function to call
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
      console.error('AI Service Error:', error);
      
      // Provide a helpful fallback response instead of just an error
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
   * Handle registration command
   */
  private async handleRegistrationCommand(ensName: string, message: string, userAddress?: string): Promise<ENSAgentResponse> {
    try {
      // Extract duration from message (default to 1 year)
      const duration = this.extractDurationFromMessage(message) || 365 * 24 * 60 * 60;
      
      // Check if name is available first using agent's method
      const availabilityData = await this.ensAgent.isNameAvailable(ensName);
      if (availabilityData.success && !availabilityData.data?.available) {
        return {
          success: false,
          error: `${ensName} is already registered. Please choose a different name.`
        };
      }
      
      // Calculate registration cost using agent's method
      const costData = await this.ensAgent.getPrice(ensName, duration);
      if (!costData.success) {
        return {
          success: false,
          error: `Failed to calculate registration cost: ${costData.error}`
        };
      }
      
      const cost = costData.data?.total || '0.01'; // ETH amount
      const costWei = (parseFloat(cost) * 1e18).toString();
      
      // Check if this is a confirmation (user said yes, go ahead, etc.)
      const lowerMessage = message.toLowerCase();
      const isConfirmation = lowerMessage.includes('yes') || lowerMessage.includes('confirm') || 
                           lowerMessage.includes('go ahead') || lowerMessage.includes('do it') ||
                           lowerMessage.includes('proceed') || lowerMessage.includes('register now');
      
      // If user is confirming and we have a user address, execute the registration
      if (isConfirmation && userAddress) {
        console.log(`Executing on-chain registration for ${ensName}...`);
        
        // Generate a secret for the commitment
        const secret = this.generateRegistrationSecret();
        
        try {
          // Execute the actual registration through the ENS agent
          const registrationResult = await this.ensAgent.registerName(ensName, userAddress, duration, secret);
          
          if (registrationResult.success) {
            return {
              success: true,
              data: {
                message: `Successfully registered ${ensName}! Transaction hash: ${registrationResult.transaction?.hash}`,
                type: 'registration_completed',
                ensName,
                duration,
                cost: costWei,
                costEth: cost,
                owner: userAddress,
                txHash: registrationResult.transaction?.hash,
                timestamp: new Date().toISOString()
              },
              message: `Successfully registered ${ensName}! Your domain is now active on the blockchain.`,
              transaction: registrationResult.transaction
            };
          } else {
            return {
              success: false,
              error: `Registration failed: ${registrationResult.error}. Please check your wallet and try again.`
            };
          }
        } catch (registrationError) {
          console.error('Registration execution failed:', registrationError);
          return {
            success: false,
            error: `Registration failed: ${registrationError}. Please ensure you have sufficient ETH and try again.`
          };
        }
      }
      
      // If not a confirmation, return the registration proposal
      return {
        success: true,
        data: {
          message: `I can register ${ensName} for ${Math.floor(duration / (365 * 24 * 60 * 60))} year(s). The cost is ${cost} ETH. Would you like me to proceed with the registration?`,
          type: 'registration_ready',
          ensName,
          duration,
          cost: costWei,
          costEth: cost,
          owner: userAddress,
          timestamp: new Date().toISOString(),
          needsConfirmation: true
        },
        message: `I can register ${ensName} for ${Math.floor(duration / (365 * 24 * 60 * 60))} year(s). The cost is ${cost} ETH. Would you like me to proceed with the registration?`,
        transaction: {
          type: 'register',
          ensName,
          duration,
          cost: costWei,
          owner: userAddress,
          status: 'pending'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process registration: ${error}`
      };
    }
  }

  /**
   * Handle renewal command
   */
  private async handleRenewalCommand(ensName: string, message: string, userAddress?: string): Promise<ENSAgentResponse> {
    try {
      const duration = this.extractDurationFromMessage(message) || 365 * 24 * 60 * 60;
      
      // Calculate renewal cost using agent's method
      const costData = await this.ensAgent.getPrice(ensName, duration);
      if (!costData.success) {
        return {
          success: false,
          error: `Failed to calculate renewal cost: ${costData.error}`
        };
      }
      
      const cost = costData.data?.total || '0.01'; // ETH amount
      const costWei = (parseFloat(cost) * 1e18).toString();
      
      // Check if this is a confirmation
      const lowerMessage = message.toLowerCase();
      const isConfirmation = lowerMessage.includes('yes') || lowerMessage.includes('confirm') || 
                           lowerMessage.includes('go ahead') || lowerMessage.includes('do it') ||
                           lowerMessage.includes('proceed') || lowerMessage.includes('renew now');
      
      // If user is confirming, execute the renewal
      if (isConfirmation && userAddress) {
        console.log(`Executing on-chain renewal for ${ensName}...`);
        
        try {
          // Execute the actual renewal through the ENS agent
          const renewalResult = await this.ensAgent.renewName(ensName, duration);
          
          if (renewalResult.success) {
            return {
              success: true,
              data: {
                message: `Successfully renewed ${ensName}! Transaction hash: ${renewalResult.transaction?.hash}`,
                type: 'renewal_completed',
                ensName,
                duration,
                cost: costWei,
                costEth: cost,
                txHash: renewalResult.transaction?.hash,
                timestamp: new Date().toISOString()
              },
              message: `Successfully renewed ${ensName}! Your domain registration has been extended.`,
              transaction: renewalResult.transaction
            };
          } else {
            return {
              success: false,
              error: `Renewal failed: ${renewalResult.error}. Please check your wallet and try again.`
            };
          }
        } catch (renewalError) {
          console.error('Renewal execution failed:', renewalError);
          return {
            success: false,
            error: `Renewal failed: ${renewalError}. Please ensure you have sufficient ETH and try again.`
          };
        }
      }
      
      // If not a confirmation, return the renewal proposal
      return {
        success: true,
        data: {
          message: `I can renew ${ensName} for ${Math.floor(duration / (365 * 24 * 60 * 60))} year(s). The cost is ${cost} ETH. Would you like me to proceed with the renewal?`,
          type: 'renewal_ready',
          ensName,
          duration,
          cost: costWei,
          costEth: cost,
          timestamp: new Date().toISOString(),
          needsConfirmation: true
        },
        message: `I can renew ${ensName} for ${Math.floor(duration / (365 * 24 * 60 * 60))} year(s). The cost is ${cost} ETH. Would you like me to proceed with the renewal?`,
        transaction: {
          type: 'renew',
          ensName,
          duration,
          cost: costWei,
          status: 'pending'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process renewal: ${error}`
      };
    }
  }

  /**
   * Handle set record command
   */
  private async handleSetRecordCommand(ensName: string, message: string, userAddress?: string): Promise<ENSAgentResponse> {
    try {
      // Extract record type and value from message
      const record = this.extractRecordFromMessage(message);
      if (!record) {
        return {
          success: false,
          error: `Please specify what record you want to set for ${ensName}. For example: "Set description for ${ensName} to 'My website'" or "Set ETH address for ${ensName} to 0x..."`
        };
      }
      
      // Check if this is a confirmation
      const lowerMessage = message.toLowerCase();
      const isConfirmation = lowerMessage.includes('yes') || lowerMessage.includes('confirm') || 
                           lowerMessage.includes('go ahead') || lowerMessage.includes('do it') ||
                           lowerMessage.includes('proceed') || lowerMessage.includes('set now');
      
      // If user is confirming, execute the record setting
      if (isConfirmation && userAddress) {
        console.log(`Setting ${record.type} record for ${ensName} to ${record.value}...`);
        
        try {
          let setRecordResult;
          
          // Use appropriate method based on record type
          if (record.type === 'ETH' || record.type.toLowerCase() === 'address') {
            // Set address record
            const coinType = record.type === 'ETH' ? 60 : 60; // Default to ETH
            setRecordResult = await this.ensAgent.setAddressRecord(ensName, record.value, coinType);
          } else {
            // Set text record
            setRecordResult = await this.ensAgent.setTextRecord(ensName, record.type, record.value);
          }
          
          if (setRecordResult.success) {
            return {
              success: true,
              data: {
                message: `Successfully set ${record.type} record for ${ensName} to "${record.value}"! Transaction hash: ${setRecordResult.transaction?.hash}`,
                type: 'record_set_completed',
                ensName,
                record,
                txHash: setRecordResult.transaction?.hash,
                timestamp: new Date().toISOString()
              },
              message: `Successfully set ${record.type} record for ${ensName}! The record is now active on the blockchain.`,
              transaction: setRecordResult.transaction
            };
          } else {
            return {
              success: false,
              error: `Failed to set record: ${setRecordResult.error}. Please check your wallet and try again.`
            };
          }
        } catch (recordError) {
          console.error('Set record execution failed:', recordError);
          return {
            success: false,
            error: `Failed to set record: ${recordError}. Please ensure you have sufficient ETH and try again.`
          };
        }
      }
      
      // Store the pending record in session context for follow-up confirmations
      this.currentContext.sessionData = {
        ...this.currentContext.sessionData,
        pendingRecord: record
      };
      
      // If not a confirmation, return the set record proposal
      return {
        success: true,
        data: {
          message: `I can set the ${record.type} record for ${ensName} to "${record.value}". Would you like me to proceed?`,
          type: 'set_record_ready',
          ensName,
          record,
          timestamp: new Date().toISOString(),
          needsConfirmation: true
        },
        message: `I can set the ${record.type} record for ${ensName} to "${record.value}". Would you like me to proceed?`,
        transaction: {
          type: 'setRecord',
          ensName,
          record,
          status: 'pending'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process set record: ${error}`
      };
    }
  }

  /**
   * Extract duration from message using operations
   */
  private extractDurationFromMessage(message: string): number | null {
    try {
      // Access operations through the agent
      const operations = this.ensAgent.getOperations();
      if (operations && typeof operations.extractDurationFromMessage === 'function') {
        return operations.extractDurationFromMessage(message);
      }
      
      // Fallback to direct parsing
      const durationPattern = /(\d+)\s*(day|days|year|years|month|months)/gi;
      const match = message.match(durationPattern);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        if (unit.includes('year')) {
          return value * 365 * 24 * 60 * 60; // Convert to seconds
        } else if (unit.includes('month')) {
          return value * 30 * 24 * 60 * 60; // Convert to seconds
        } else if (unit.includes('day')) {
          return value * 24 * 60 * 60; // Convert to seconds
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting duration:', error);
      return null;
    }
  }

  /**
   * Extract record from message using operations
   */
  private extractRecordFromMessage(message: string): { type: string; value: string } | null {
    try {
      // Access operations through the agent
      const operations = this.ensAgent.getOperations();
      if (operations && typeof operations.extractRecordFromMessage === 'function') {
        const record = operations.extractRecordFromMessage(message);
        if (!record) return null;
        
        // Convert operations format to AI service format
        if (record.address) {
          return { type: 'ETH', value: record.address };
        }
        
        // Handle key-value pairs
        const keys = Object.keys(record);
        if (keys.length > 0) {
          const key = keys[0];
          return { type: key, value: record[key] };
        }
      }
      
      // Fallback to direct parsing
      const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
      if (addressMatch) {
        return { type: 'ETH', value: addressMatch[0] };
      }
      
      // Look for text record patterns
      const textRecordPattern = /(?:set|update|add)\s+(\w+)\s+(?:for|to)\s+["']?([^"']+)["']?/i;
      const textMatch = message.match(textRecordPattern);
      if (textMatch) {
        return { type: textMatch[1], value: textMatch[2] };
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting record:', error);
      return null;
    }
  }

  /**
   * Handle transfer command
   */
  private async handleTransferCommand(ensName: string, message: string, userAddress?: string): Promise<ENSAgentResponse> {
    try {
      // Extract recipient address from message
      const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
      if (!addressMatch) {
        return {
          success: false,
          error: `Please provide a valid Ethereum address to transfer ${ensName} to. For example: "Transfer ${ensName} to 0x..."`
        };
      }
      
      const recipientAddress = addressMatch[0];
      
      return {
        success: true,
        data: {
          message: `I'll help you transfer ${ensName} to ${recipientAddress}. Please confirm this transfer.`,
          type: 'transfer_ready',
          ensName,
          recipientAddress,
          timestamp: new Date().toISOString()
        },
        message: `I'll help you transfer ${ensName} to ${recipientAddress}. Please confirm this transfer.`,
        transaction: {
          type: 'transfer',
          ensName,
          recipientAddress
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process transfer: ${error}`
      };
    }
  }

  /**
   * Handle general ENS query when name is mentioned without clear intent
   */
  private async handleGeneralENSQuery(ensName: string, message: string, userAddress?: string): Promise<ENSAgentResponse> {
    try {
      // First check if the name is available using agent's method
      const availabilityData = await this.ensAgent.isNameAvailable(ensName);
      
      if (availabilityData.success && availabilityData.data?.available) {
        // Name is available - suggest registration
        const costData = await this.ensAgent.getPrice(ensName, 365 * 24 * 60 * 60);
        const cost = costData.data?.total || '0.01';
        const costWei = (parseFloat(cost) * 1e18).toString();
        
        return {
          success: true,
          data: {
            message: `${ensName} is available! You can register it for 1 year for ${cost} ETH. Would you like to register it?`,
            type: 'name_available',
            ensName,
            cost: costWei,
            costEth: cost,
            timestamp: new Date().toISOString()
          },
          message: `${ensName} is available! You can register it for 1 year for ${cost} ETH. Would you like to register it?`,
          transaction: {
            type: 'register',
            ensName,
            duration: 365 * 24 * 60 * 60,
            cost: costWei
          }
        };
      } else if (availabilityData.success && !availabilityData.data?.available) {
        // Name is registered - get full info and suggest operations
        const ensData = await this.ensAgent.getNameInfo(ensName);
        if (ensData.success) {
          const formattedResponse = this.formatENSData(ensName, ensData.data);
          return {
            success: true,
            data: {
              message: `${formattedResponse}\n\nWhat would you like to do with ${ensName}? You can renew it, set records, or transfer it.`,
              type: 'name_registered',
              ensName,
              ensData: ensData.data,
              timestamp: new Date().toISOString()
            },
            message: `${formattedResponse}\n\nWhat would you like to do with ${ensName}? You can renew it, set records, or transfer it.`
          };
        }
      }
      
      // Fallback for any errors
      return {
        success: true,
        data: {
          message: `I found the ENS name ${ensName}. What would you like to do with it? You can check if it's available, register it, or get more information.`,
          type: 'general_query',
          ensName,
          timestamp: new Date().toISOString()
        },
        message: `I found the ENS name ${ensName}. What would you like to do with it? You can check if it's available, register it, or get more information.`
      };
    } catch (error) {
      return {
        success: true,
        data: {
          message: `I found the ENS name ${ensName}. What would you like to do with it? You can check if it's available, register it, or get more information.`,
          type: 'general_query',
          ensName,
          timestamp: new Date().toISOString()
        },
        message: `I found the ENS name ${ensName}. What would you like to do with it? You can check if it's available, register it, or get more information.`
      };
    }
  }


  /**
   * Handle contextual queries and follow-up questions
   */
  private async handleContextualQuery(message: string, lowerMessage: string, ensName: string | null, userAddress?: string): Promise<ENSAgentResponse | null> {
    // Handle follow-up questions without explicit ENS names
    if (!ensName && this.currentContext.lastENSName) {
      // Check for follow-up commands that reference the last ENS name
      const followUpPatterns = [
        'yes', 'sure', 'ok', 'okay', 'do it', 'go ahead', 'proceed',
        'how much', 'what\'s the cost', 'price', 'cost',
        'more info', 'tell me more', 'details', 'what else',
        'renew it', 'extend it', 'transfer it', 'set records',
        'what can i do', 'what are my options', 'help me with'
      ];

      const hasFollowUpPattern = followUpPatterns.some(pattern => lowerMessage.includes(pattern));
      
      if (hasFollowUpPattern) {
        const lastENSName = this.currentContext.lastENSName;
        
        // Handle "yes" confirmations based on last operation
        if (lowerMessage.includes('yes') || lowerMessage.includes('sure') || lowerMessage.includes('ok') || lowerMessage.includes('do it') || lowerMessage.includes('proceed') || lowerMessage.includes('confirm')) {
          if (this.currentContext.lastOperation === 'register') {
            // Pass the confirmation message to trigger actual registration
            return await this.handleRegistrationCommand(lastENSName, `yes register ${lastENSName}`, userAddress);
          } else if (this.currentContext.lastOperation === 'renew') {
            return await this.handleRenewalCommand(lastENSName, `yes renew ${lastENSName}`, userAddress);
          } else if (this.currentContext.lastOperation === 'setRecord') {
            // For set record, we need the original record details from context
            if (this.currentContext.sessionData?.pendingRecord) {
              const pendingRecord = this.currentContext.sessionData.pendingRecord;
              return await this.handleSetRecordCommand(lastENSName, `yes set ${pendingRecord.type} for ${lastENSName} to ${pendingRecord.value}`, userAddress);
            }
          }
        }
        
        // Handle cost/price questions
        if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('how much')) {
          const costData = await this.ensAgent.getPrice(lastENSName, 365 * 24 * 60 * 60);
          if (costData.success) {
            const cost = costData.data?.total || '0.01';
            return {
              success: true,
              data: {
                message: `The cost to register ${lastENSName} for 1 year is ${cost} ETH.`,
                type: 'price_info',
                ensName: lastENSName,
                cost,
                timestamp: new Date().toISOString()
              },
              message: `The cost to register ${lastENSName} for 1 year is ${cost} ETH.`
            };
          }
        }
        
        // Handle "more info" requests
        if (lowerMessage.includes('more') || lowerMessage.includes('details') || lowerMessage.includes('tell me')) {
          return await this.handleGeneralENSQuery(lastENSName, `tell me about ${lastENSName}`, userAddress);
        }
        
        // Handle operation suggestions
        if (lowerMessage.includes('what can') || lowerMessage.includes('options') || lowerMessage.includes('help me')) {
          const availabilityData = await this.ensAgent.isNameAvailable(lastENSName);
          const isAvailable = availabilityData.success && availabilityData.data?.available;
          
          let options = [];
          if (isAvailable) {
            options = [
              `Register ${lastENSName}`,
              `Check registration cost for ${lastENSName}`,
              `Get more information about ${lastENSName}`
            ];
          } else {
            options = [
              `Get information about ${lastENSName}`,
              `Renew ${lastENSName}`,
              `Set records for ${lastENSName}`,
              `Transfer ${lastENSName}`,
              `Check expiration date for ${lastENSName}`
            ];
          }
          
          return {
            success: true,
            data: {
              message: `Here's what you can do with ${lastENSName}:\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`,
              type: 'options_list',
              ensName: lastENSName,
              options,
              timestamp: new Date().toISOString()
            },
            message: `Here's what you can do with ${lastENSName}:\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`
          };
        }
      }
    }

    // Handle pronoun references (it, that, this)
    const pronouns = ['it', 'that', 'this', 'the name', 'the domain'];
    const hasPronoun = pronouns.some(pronoun => lowerMessage.includes(pronoun));
    
    if (hasPronoun && this.currentContext.lastENSName && !ensName) {
      // Replace pronouns with the last ENS name and reprocess
      let modifiedMessage = message;
      pronouns.forEach(pronoun => {
        const regex = new RegExp(`\\b${pronoun}\\b`, 'gi');
        modifiedMessage = modifiedMessage.replace(regex, this.currentContext.lastENSName!);
      });
      
      // If the modified message now contains an ENS name, let the main processing handle it
      if (this.extractENSName(modifiedMessage)) {
        return null; // Let main processing handle the modified message
      }
    }

    return null;
  }

  /**
   * Add response to conversation history and return it
   */
  private addToConversationAndReturn(response: ENSAgentResponse): ENSAgentResponse {
    const assistantMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: response.message || response.error || 'Operation completed',
      timestamp: new Date(),
      operation: response.transaction ? {
        type: response.transaction.type as any,
        name: response.transaction.ensName || '',
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
   * Get enhanced LLM response with conversation context
   */
  private async getEnhancedLLMResponse(message: string, userAddress?: string): Promise<string> {
    try {
      console.log('Attempting enhanced LLM call with message:', message);
      
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

      const response = completion.choices[0].message.content || 'I apologize, but I could not generate a response.';
      console.log('Enhanced LLM response received:', response);
      return response;
    } catch (error) {
      console.error('Enhanced LLM Error details:', error);
      return this.getLLMResponse(message, userAddress);
    }
  }

  /**
   * Build contextual messages from conversation history
   */
  private buildContextualMessages(): Array<{role: 'user' | 'assistant', content: string}> {
    // Include last 6 messages for context (3 exchanges)
    const recentMessages = this.conversationHistory.slice(-6);
    
    return recentMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
  }

  /**
   * Get response from the LLM
   */
  private async getLLMResponse(message: string, userAddress?: string): Promise<string> {
    try {
      console.log('Attempting LLM call with message:', message);
      
      const completion = await this.openai.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: this.formatUserMessage(message, userAddress)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content || 'I apologize, but I could not generate a response.';
      console.log('LLM response received:', response);
      return response;
    } catch (error) {
      console.error('LLM Error details:', error);
      
      // Provide more specific error handling
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          console.error('API key authentication failed');
          return 'I apologize, but there\'s an authentication issue with the AI service. Please contact support.';
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          console.error('Rate limit exceeded');
          return 'I\'m currently experiencing high demand. Please try again in a moment.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          console.error('Network error');
          return 'I\'m having trouble connecting to the AI service. Please check your internet connection and try again.';
        }
      }
      
      // Fallback to a helpful response based on the message content
      return this.getFallbackResponse(message);
    }
  }

  /**
   * Get a fallback response when LLM fails
   */
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Hello! I\'m your ENS assistant. I can help you with Ethereum Name Service operations like registering domains, setting records, and resolving names. What would you like to do?';
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return 'I can help you with ENS operations including:\n\n• Register .eth domain names\n• Check if names are available\n• Resolve names to addresses\n• Set text and address records\n• Renew existing names\n• Transfer name ownership\n\nJust ask me what you\'d like to do!';
    }
    
    if (lowerMessage.includes('register') || lowerMessage.includes('buy')) {
      return 'I can help you register an ENS name! Please tell me which name you\'d like to register (e.g., "myname.eth") and I\'ll guide you through the process.';
    }
    
    if (lowerMessage.includes('available') || lowerMessage.includes('check')) {
      return 'I can help you check if ENS names are available for registration. Please provide the .eth name you\'d like to check (e.g., "is myname.eth available").';
    }
    
    if (lowerMessage.includes('resolve') || lowerMessage.includes('address')) {
      return 'I can help you resolve ENS names to addresses or vice versa. Please provide the name or address you\'d like me to look up.';
    }
    
    if (lowerMessage.includes('set') || lowerMessage.includes('update') || lowerMessage.includes('record')) {
      return 'I can help you set or update ENS records. Please tell me which name and what type of record you\'d like to set (e.g., "Set email for myname.eth to user@example.com").';
    }
    
    // Default fallback
    return 'I\'m here to help with ENS operations! You can ask me to register names, check availability, resolve addresses, set records, or get information about ENS. What would you like to do?';
  }

  /**
   * Format user message with context
   */
  private formatUserMessage(message: string, userAddress?: string): string {
    let context = `User message: "${message}"\n\n`;
    
    if (userAddress) {
      context += `User address: ${userAddress}\n`;
    }
    
    context += `\nPlease provide a helpful response about ENS operations. If the user is asking about a specific ENS operation, guide them through it step by step.`;
    
    return context;
  }

  /**
   * Get suggested operations based on context
   */
  async getSuggestedOperations(name?: string): Promise<string[]> {
    const suggestions = [
      "Check if a name is available for registration",
      "Resolve an ENS name to its address",
      "Set up text records (email, website, description)",
      "Update address records for a name",
      "Renew an existing ENS name",
      "Transfer ownership of a name",
      "Create subdomains",
      "Set up a decentralized website",
      "Check name expiration date",
      "Get comprehensive name information"
    ];

    if (name) {
      return [
        `Check availability of ${name}`,
        `Get information about ${name}`,
        `Set records for ${name}`,
        `Renew ${name}`,
        `Transfer ${name}`,
        `Create subdomains for ${name}`
      ];
    }

    return suggestions;
  }

  /**
   * Get help information
   */
  getHelpMessage(): string {
    return `Welcome to the ENS Assistant! I can help you with:

🔍 Name Operations
- Check if names are available
- Register new .eth domains
- Renew existing names
- Transfer name ownership

📍 Resolution
- Resolve names to addresses
- Reverse resolve addresses to names
- Get comprehensive name information

📝 Record Management
- Set text records (email, website, description)
- Update address records
- Manage content hashes for websites
- Set up subdomains

💰 Pricing & Costs
- Calculate registration costs
- Check renewal prices
- Estimate gas costs

Just ask me what you'd like to do with ENS! For example:
- "Register myname.eth"
- "What's the address for vitalik.eth?"
- "Set my email for myname.eth"
- "How much does myname.eth cost?"`;
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
      initialized: true,
      status: 'ready',
      capabilities: [
        'Name Registration',
        'Name Resolution', 
        'Record Management',
        'Name Renewal',
        'Name Transfer',
        'Price Calculation',
        'Availability Checking',
        'Subdomain Management'
      ],
      messageCount: this.ensAgent.getChatHistory().length
    };
  }

  /**
   * Get agent statistics
   */
  getAgentStats(): {
    totalMessages: number;
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageResponseTime: number;
  } {
    const chatHistory = this.ensAgent.getChatHistory();
    const operationHistory = this.ensAgent.getOperationHistory();
    
    const successfulOps = operationHistory.filter(op => 
      chatHistory.some(msg => msg.operation?.type === op.type && msg.role === 'assistant' && !msg.content.includes('Error'))
    ).length;

    return {
      totalMessages: chatHistory.length,
      totalOperations: operationHistory.length,
      successfulOperations: successfulOps,
      failedOperations: operationHistory.length - successfulOps,
      averageResponseTime: 1.2 // Placeholder - would be calculated from actual response times
    };
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
   * Set conversation history (for session restoration)
   */
  setConversationHistory(history: ChatMessage[]): void {
    this.conversationHistory = [...history];
  }

  /**
   * Add message to conversation history
   */
  addToConversationHistory(message: ChatMessage): void {
    this.conversationHistory.push(message);
  }

  /**
   * Update current context
   */
  updateContext(updates: Partial<typeof this.currentContext>): void {
    this.currentContext = { ...this.currentContext, ...updates };
  }

  /**
   * Test method to verify context awareness is working
   */
  async testContextAwareness(): Promise<{
    contextWorking: boolean;
    conversationLength: number;
    lastENSName?: string;
    lastOperation?: string;
  }> {
    return {
      contextWorking: true,
      conversationLength: this.conversationHistory.length,
      lastENSName: this.currentContext.lastENSName,
      lastOperation: this.currentContext.lastOperation
    };
  }

  /**
   * Generate a secure random secret for ENS registration
   */
  private generateRegistrationSecret(): string {
    // Generate a 32-byte random secret
    if (typeof window !== 'undefined' && window.crypto) {
      // Browser environment
      const randomBytesArray = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytesArray);
      return '0x' + Array.from(randomBytesArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Node.js environment
      const buffer = randomBytes(32);
      return '0x' + buffer.toString('hex');
    }
  }

  /**
   * Enhanced ENS agent function calling with better error handling
   */
  private async callENSAgentFunction(functionName: string, ...args: any[]): Promise<ENSAgentResponse> {
    try {
      console.log(`Calling ENS agent function: ${functionName}`, args);
      
      // Map function names to actual agent methods
      const functionMap: { [key: string]: (...args: any[]) => Promise<ENSAgentResponse> } = {
        'isNameAvailable': this.ensAgent.isNameAvailable.bind(this.ensAgent),
        'getNameInfo': this.ensAgent.getNameInfo.bind(this.ensAgent),
        'getPrice': this.ensAgent.getPrice.bind(this.ensAgent),
        'resolveAddress': this.ensAgent.resolveAddress.bind(this.ensAgent),
        'resolveName': this.ensAgent.resolveName.bind(this.ensAgent),
        'registerName': this.ensAgent.registerName.bind(this.ensAgent),
        'renewName': this.ensAgent.renewName.bind(this.ensAgent),
        'transferName': this.ensAgent.transferName.bind(this.ensAgent),
        'setTextRecord': this.ensAgent.setTextRecord.bind(this.ensAgent),
        'setAddressRecord': this.ensAgent.setAddressRecord.bind(this.ensAgent),
        'setResolver': this.ensAgent.setResolver.bind(this.ensAgent),
        'getTextRecord': this.ensAgent.getTextRecord.bind(this.ensAgent),
        'getAddressRecord': this.ensAgent.getAddressRecord.bind(this.ensAgent)
      };

      const func = functionMap[functionName];
      if (!func) {
        return {
          success: false,
          error: `Unknown ENS function: ${functionName}`
        };
      }

      const result = await func(...args);
      console.log(`ENS agent function ${functionName} result:`, result);
      return result;
    } catch (error) {
      console.error(`Error calling ENS agent function ${functionName}:`, error);
      return {
        success: false,
        error: `Failed to call ${functionName}: ${error}`
      };
    }
  }

  /**
   * Intelligent function selection based on user intent
   */
  private async selectAndCallENSFunction(intent: string, ensName: string, additionalData?: any): Promise<ENSAgentResponse> {
    const intentMap: { [key: string]: { func: string, args: any[] } } = {
      'check_availability': { func: 'isNameAvailable', args: [ensName] },
      'get_info': { func: 'getNameInfo', args: [ensName] },
      'get_price': { func: 'getPrice', args: [ensName, additionalData?.duration || 365 * 24 * 60 * 60] },
      'resolve_name': { func: 'resolveName', args: [ensName] },
      'resolve_address': { func: 'resolveAddress', args: [additionalData?.address || ensName] },
      'register': { func: 'registerName', args: [ensName, additionalData?.owner, additionalData?.duration, additionalData?.secret] },
      'renew': { func: 'renewName', args: [ensName, additionalData?.duration] },
      'transfer': { func: 'transferName', args: [ensName, additionalData?.recipient] },
      'set_text_record': { func: 'setTextRecord', args: [ensName, additionalData?.key, additionalData?.value] },
      'set_address_record': { func: 'setAddressRecord', args: [ensName, additionalData?.address, additionalData?.coinType] },
      'get_text_record': { func: 'getTextRecord', args: [ensName, additionalData?.key] },
      'get_address_record': { func: 'getAddressRecord', args: [ensName, additionalData?.coinType] },
      'set_resolver': { func: 'setResolver', args: [ensName, additionalData?.resolverAddress] }
    };

    const mapping = intentMap[intent];
    if (!mapping) {
      return {
        success: false,
        error: `Unknown intent: ${intent}`
      };
    }

    return await this.callENSAgentFunction(mapping.func, ...mapping.args);
  }

  /**
   * Enhanced system prompt with function calling instructions
   */
  private createEnhancedSystemPrompt(): string {
    return this.systemPrompt + `

## Function Calling Guidelines

You have access to the following ENS functions through the agent:

### Core Functions:
- isNameAvailable(name): Check if an ENS name is available for registration
- getNameInfo(name): Get comprehensive information about an ENS name
- getPrice(name, duration): Calculate registration/renewal cost
- resolveName(name): Resolve ENS name to address
- resolveAddress(address): Resolve address to ENS name (reverse resolution)
- registerName(name, owner, duration, secret): Register a new ENS name
- renewName(name, duration): Renew an existing ENS name
- transferName(name, recipient): Transfer ENS name ownership
- setTextRecord(name, key, value): Set a text record for an ENS name
- setAddressRecord(name, address, coinType): Set an address record for an ENS name
- setResolver(name, resolverAddress): Set the resolver for an ENS name
- getTextRecord(name, key): Get a text record from an ENS name
- getAddressRecord(name, coinType): Get an address record from an ENS name

### Function Selection Rules:
1. Always call the appropriate function based on user intent
2. Use context from previous messages to understand follow-up questions
3. If a user asks about "it" or "that", use the last ENS name from context
4. Provide clear feedback about what function is being called and why
5. Handle errors gracefully and suggest alternatives

### Context Awareness:
- Remember the last ENS name mentioned in conversation
- Remember the last operation performed
- Use conversation history to understand follow-up questions
- Maintain context across multiple turns of conversation

When calling functions, always explain what you're doing and why.`;
  }

  /**
   * Extract ENS name from message using operations
   */
  private extractENSName(message: string): string | null {
    try {
      // Access operations through the agent
      const operations = this.ensAgent.getOperations();
      if (operations && typeof operations.extractNameFromMessage === 'function') {
        return operations.extractNameFromMessage(message);
      }
      
      // Fallback to direct regex if operations method fails
      const ensPattern = /([a-z0-9-]+\.eth)/gi;
      const match = message.match(ensPattern);
      return match ? match[0].toLowerCase() : null;
    } catch (error) {
      console.error('Error extracting ENS name:', error);
      // Fallback to direct regex
      const ensPattern = /([a-z0-9-]+\.eth)/gi;
      const match = message.match(ensPattern);
      return match ? match[0].toLowerCase() : null;
    }
  }


  /**
   * Format ENS data into a readable response
   */
  private formatENSData(name: string, data: any): string {
    if (!data) {
      return `No data found for ${name}`;
    }

    let response = `${name}\n\n`;
    
    // Owner information
    if (data.owner) {
      response += `Owner: \`${data.owner}\`\n`;
    }
    
    // Expiration
    if (data.expiration) {
      const expDate = new Date(parseInt(data.expiration) * 1000);
      response += `Expires: ${expDate.toLocaleDateString()}\n`;
    }
    
    // Address records
    if (data.addresses && Object.keys(data.addresses).length > 0) {
      response += `\nAddress Records:\n`;
      Object.entries(data.addresses).forEach(([coinType, address]) => {
        const coinName = this.getCoinName(coinType);
        response += `• ${coinName}: \`${address}\`\n`;
      });
    }
    
    // Text records
    if (data.textRecords && Object.keys(data.textRecords).length > 0) {
      response += `\nText Records:\n`;
      Object.entries(data.textRecords).forEach(([key, value]) => {
        response += `• ${key}: ${value}\n`;
      });
    }
    
    // Content hash
    if (data.contentHash) {
      response += `\nContent Hash: \`${data.contentHash}\`\n`;
    }
    
    // Availability status
    if (data.available !== undefined) {
      response += `\nStatus: ${data.available ? 'Available' : 'Registered'}\n`;
    }
    
    return response;
  }

  /**
   * Get coin name from coin type
   */
  private getCoinName(coinType: string): string {
    const coinTypes: { [key: string]: string } = {
      '60': 'ETH',
      '0': 'BTC',
      '2': 'LTC',
      '3': 'DOGE',
      '22': 'MONA',
      '144': 'XRP',
      '145': 'BCH',
      '714': 'BNB',
      '966': 'MATIC'
    };
    return coinTypes[coinType] || `Coin ${coinType}`;
  }
}

// Export a factory function to create the AI service
export function createENSAIService(ensAgent: ENSAgent, apiKey: string): ENSAIService {
  return new ENSAIService(ensAgent, apiKey);
}

// Export the API key for easy access
export const OPENROUTER_API_KEY = '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';
