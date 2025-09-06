import { NextRequest, NextResponse } from 'next/server';
import { paymentChatIntegration } from '@/services/basepay/chatIntegration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userAddress } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if this is an operation that requires wallet connection
    const lowerMessage = message.toLowerCase();
    const requiresWallet = lowerMessage.includes('send') || lowerMessage.includes('pay') || lowerMessage.includes('transfer') || lowerMessage.includes('balance') || lowerMessage.includes('register');
    
    if (requiresWallet && !userAddress) {
      return NextResponse.json(
        { error: 'User address is required for payment operations. Please connect your wallet.' },
        { status: 400 }
      );
    }

    // Initialize if not already done (for API usage)
    if (!paymentChatIntegration.isInitialized()) {
      await paymentChatIntegration.initialize(null);
    }

    // Process the message
    const response = await paymentChatIntegration.processMessage(message, userAddress);

    return NextResponse.json({
      success: response.success,
      message: response.message,
      data: response.data,
      error: response.error,
      transaction: response.transaction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Payment chat API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to process payment request. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get conversation history
    const history = paymentChatIntegration.getConversationHistory();
    const status = paymentChatIntegration.getAgentStatus();

    return NextResponse.json({
      success: true,
      data: {
        history,
        status,
        suggestedPrompts: paymentChatIntegration.getSuggestedPrompts(),
        helpMessage: paymentChatIntegration.getHelpMessage()
      }
    });

  } catch (error) {
    console.error('Payment chat GET API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get payment chat data'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear conversation history
    paymentChatIntegration.clearConversationHistory();

    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared'
    });

  } catch (error) {
    console.error('Payment chat DELETE API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear conversation history'
      },
      { status: 500 }
    );
  }
}
