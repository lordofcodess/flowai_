import { NextRequest, NextResponse } from 'next/server';
import { ENSAgent } from '@/services/ensagent/agent';
import { ENSAIService, createENSAIService, OPENROUTER_API_KEY } from '@/services/ensagent/ai';
import { ChatMessage } from '@/services/ensagent/types';
import { ethers } from 'ethers';

const SEPOLIA_RPC = 'https://eth-sepolia.g.alchemy.com/v2/__krcmuK9Ex84Kfc9l765YL9ljhsIYmJ';

// Global instances to maintain context across requests
// In production, you'd want to use Redis or another persistent store
const globalAgents = new Map<string, ENSAgent>();
const globalAIServices = new Map<string, ENSAIService>();

// Get or create agent and AI service for a user session
function getOrCreateUserSession(userAddress?: string) {
  const sessionKey = userAddress || 'anonymous';
  
  if (!globalAgents.has(sessionKey)) {
    console.log(`Creating new ENS agent for session: ${sessionKey}`);
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const agent = new ENSAgent();
    agent.initialize(provider);
    globalAgents.set(sessionKey, agent);
    
    // Create AI service for this session
    const aiService = createENSAIService(agent, OPENROUTER_API_KEY);
    globalAIServices.set(sessionKey, aiService);
  }
  
  return {
    agent: globalAgents.get(sessionKey)!,
    aiService: globalAIServices.get(sessionKey)!
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message, userAddress, conversationHistory } = await request.json();
    
    console.log('ENS Chat API - Received message:', message);
    console.log('ENS Chat API - User address:', userAddress);
    console.log('ENS Chat API - Conversation history length:', conversationHistory?.length || 0);

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create user session
    const { agent, aiService } = getOrCreateUserSession(userAddress);
    
    console.log('ENS Chat API - Using existing session, processing message...');
    
    // Restore conversation history if provided (for session recovery)
    if (conversationHistory && conversationHistory.length > 0) {
      // Get current AI service history length
      const currentHistory = aiService.getConversationHistory();
      
      // If the provided history is longer than current, we might need to restore context
      if (conversationHistory.length > currentHistory.length) {
        console.log('ENS Chat API - Restoring conversation context...');
        // Clear and restore conversation history
        aiService.clearConversationHistory();
        
        // Add conversation history to AI service
        const chatMessages: ChatMessage[] = conversationHistory
          .filter((msg: any) => msg.sender && msg.content)
          .map((msg: any) => ({
            id: msg.id || `restored_${Date.now()}_${Math.random()}`,
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now())
          }));
        
        aiService.setConversationHistory(chatMessages);
      }
    }

    // Process message with AI service directly for better context handling
    const response = await aiService.processMessage(message, userAddress);
    
    console.log('ENS Chat API - AI Response:', response);
    
    // Return response in expected format
    return NextResponse.json({
      success: response.success,
      message: response.message,
      data: response.data,
      error: response.error,
      transaction: response.transaction,
      // Include conversation context for client-side state management
      conversationContext: {
        lastENSName: aiService.getCurrentContext().lastENSName,
        lastOperation: aiService.getCurrentContext().lastOperation,
        historyLength: aiService.getConversationHistory().length
      }
    });
  } catch (error) {
    console.error('ENS Chat API Error:', error);
    console.error('ENS Chat API Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Optional: Add endpoint to clear conversation history
export async function DELETE(request: NextRequest) {
  try {
    const { userAddress } = await request.json();
    const sessionKey = userAddress || 'anonymous';
    
    const aiService = globalAIServices.get(sessionKey);
    if (aiService) {
      aiService.clearConversationHistory();
      console.log(`Cleared conversation history for session: ${sessionKey}`);
    }
    
    return NextResponse.json({ success: true, message: 'Conversation history cleared' });
  } catch (error) {
    console.error('ENS Chat API Delete Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear conversation history' },
      { status: 500 }
    );
  }
}
