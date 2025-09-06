// PayAI Service Methods - Part 2
import { PaymentAgentResponse, PaymentRequest, ChatMessage } from '../types';

export class PayAIServiceMethods {
  /**
   * Create comprehensive system prompt for payment operations
   */
  static createSystemPrompt(): string {
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

### Error Handling:
- Explain errors in user-friendly terms
- Provide troubleshooting steps
- Suggest alternative approaches
- Never expose sensitive information

## Common User Requests and Responses

### Payment Operations:
- "Send 0.1 ETH to 0x123..." → Guide through payment process
- "Pay 10 USDC to alice.eth" → Resolve ENS and execute payment
- "Send money to multiple addresses" → Guide through batch payment
- "What's my balance?" → Check and display current balances

### Transaction Management:
- "Check transaction 0xabc..." → Verify transaction status
- "Is my payment confirmed?" → Check recent transaction status
- "Cancel my payment" → Explain transaction immutability

### Security & Best Practices:
- "Is this address safe?" → Provide address validation guidance
- "How much gas will this cost?" → Explain Base's low fees
- "Can I undo a payment?" → Explain blockchain permanence

## Security Considerations

### Always Warn About:
- Irreversible Transactions: All blockchain payments are permanent
- Address Verification: Always double-check recipient addresses
- Amount Confirmation: Verify payment amounts before sending
- Scam Prevention: Warn about common crypto scams
- Gas Fees: Explain transaction costs (minimal on Base)

### Best Practices to Promote:
- Double-check all payment details
- Start with small test transactions
- Keep private keys secure
- Use hardware wallets for large amounts
- Verify recipient addresses independently

## Technical Context

You have access to the following payment operations:
- Base Pay Service: Gasless payments using Base infrastructure
- Account Abstraction: Smart contract wallets for enhanced UX
- Multi-token Support: ETH and USDC payments
- Batch Operations: Multiple payments in single transaction
- Balance Queries: Real-time balance checking

## Example Interactions

User: "Send 0.5 ETH to 0x742d35Cc6634C0532925a3b8D5C0B4F3e8dCdD98"
Response: "I can send 0.5 ETH to 0x742d...dD98. This will cost approximately $0.01 in gas fees on Base. Please confirm this payment - it cannot be reversed once sent."

User: "What's my balance?"
Response: "Let me check your current balances on Base network. [Check balances] You have 2.45 ETH and 150.30 USDC available."

User: "Send 10 USDC to multiple people"
Response: "I can help you send USDC to multiple recipients in one transaction. Please provide the recipient addresses and amounts for each person."

Remember: You are a helpful, secure, and knowledgeable payment assistant. Always prioritize user security and transaction accuracy while making payments easy to understand and execute.`;
  }

  /**
   * Check if message is a payment command
   */
  static isPaymentCommand(message: string): boolean {
    const paymentKeywords = ['send', 'pay', 'transfer', 'give'];
    return paymentKeywords.some(keyword => message.includes(keyword)) && 
           (message.includes('eth') || message.includes('usdc') || /\d+\.?\d*/.test(message));
  }

  /**
   * Extract payment details from message
   */
  static extractPaymentDetails(message: string): PaymentRequest | null {
    try {
      // Extract amount and token
      const amountMatch = message.match(/(\d+\.?\d*)\s*(eth|usdc)/i);
      if (!amountMatch) return null;
      
      const amount = amountMatch[1];
      const token = amountMatch[2].toUpperCase() as 'ETH' | 'USDC';
      
      // Extract recipient address
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
  static extractTransactionHash(message: string): `0x${string}` | null {
    const hashMatch = message.match(/0x[a-fA-F0-9]{64}/);
    return hashMatch ? hashMatch[0] as `0x${string}` : null;
  }

  /**
   * Format address for display
   */
  static formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format user message with context
   */
  static formatUserMessage(message: string, userAddress?: string, networkInfo?: any): string {
    let context = `User message: "${message}"\n\n`;
    
    if (userAddress) {
      context += `User address: ${userAddress}\n`;
    }
    
    if (networkInfo) {
      context += `Network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})\n`;
    }
    
    context += `\nPlease provide a helpful response about payment operations on Base network.`;
    
    return context;
  }

  /**
   * Get fallback response when LLM fails
   */
  static getFallbackResponse(message: string): string {
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
   * Generate unique message ID
   */
  static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get help message
   */
  static getHelpMessage(): string {
    return `Welcome to the Base Payment Assistant! I can help you with:

💰 Payment Operations
- Send ETH payments to any address
- Send USDC stablecoin payments
- Send batch payments to multiple recipients
- Use gasless transactions (when available)

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
- "Send 0.1 ETH to 0x742d35Cc..."
- "What's my balance?"
- "Check transaction 0xabc123..."
- "Send 10 USDC to multiple addresses"`;
  }
}
