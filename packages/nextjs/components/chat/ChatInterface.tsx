"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";

// Import ENS integration
import { ensChatIntegration, ChatMessage as ENSChatMessage } from '@/services/ensagent/chatIntegration';
import ENSMessageCard from '@/components/ens/ENSMessageCard';
import { useActivities } from '@/hooks/useActivities';

// Import Payment integration
import { paymentChatIntegration, PaymentChatMessage } from '@/services/basepay/chatIntegration';

// Import Activity types
import { Activity } from '@/services/activities/activityManager';

// Import dashboard components
import Sidebar from "../dashboard/Sidebar";
import Header from "../dashboard/Header";
import WelcomeSection from "../dashboard/WelcomeSection";
import ChatMessages from "../dashboard/ChatMessages";
import ChatInput from "../dashboard/ChatInput";
import RightPanel from "../dashboard/RightPanel";
import TypingIndicator from "../dashboard/TypingIndicator";

// Import page components
import Transactions from "../pages/Transactions";
import Payments from "../pages/Payments";
import Identity from "../pages/Identity";
import NewEns from "../pages/NewEns";
import Credentials from "../pages/Credentials";

// Using Activity type from activity manager instead of local interface

interface ChatMessage {
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
  // AI service metadata
  metadata?: {
    ensQuery?: string;
    action?: any;
    confidence?: number;
    suggestions?: string[];
  };
}

const ChatInterface = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent');
  const agentEns = searchParams.get('ens');
  const agentRole = searchParams.get('role');

  // State management
  const [currentPage, setCurrentPage] = useState<'chat' | 'transactions' | 'payments' | 'identity' | 'newEns' | 'credentials'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

  // ENS Integration
  const [ensInitialized, setEnsInitialized] = useState(false);
  const [ensMessages, setEnsMessages] = useState<ENSChatMessage[]>([]);
  const [ensIsLoading, setEnsIsLoading] = useState(false);
  const [ensError, setEnsError] = useState<string | null>(null);

  // Payment Integration
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const [paymentMessages, setPaymentMessages] = useState<PaymentChatMessage[]>([]);
  const [paymentIsLoading, setPaymentIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Initialize ENS integration
  useEffect(() => {
    const initializeENS = async () => {
      try {
        // Initialize ENS integration (no provider needed for API-based processing)
        await ensChatIntegration.initialize(null as any);
        setEnsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize ENS:', error);
        setEnsError('Failed to initialize ENS service');
      }
    };

    initializeENS();
  }, []);

  // Initialize Payment integration
  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Initialize Payment integration with wallet client
        await paymentChatIntegration.initialize(walletClient || null);
        setPaymentInitialized(true);
        console.log('Payment integration initialized with wallet client:', !!walletClient);
      } catch (error) {
        console.error('Failed to initialize Payment:', error);
        setPaymentError('Failed to initialize Payment service');
      }
    };

    initializePayment();
  }, []); // Initialize once on mount

  // Update wallet client when it changes
  useEffect(() => {
    const updateWallet = async () => {
      if (paymentInitialized) {
        try {
          await paymentChatIntegration.updateWalletClient(walletClient || null);
          console.log('Payment integration wallet client updated:', !!walletClient);
        } catch (error) {
          console.error('Failed to update wallet client:', error);
        }
      }
    };

    updateWallet();
  }, [walletClient, paymentInitialized]); // Update when wallet client changes

  // Use real activities from activity manager
  const { activities: recentActivities, addActivity } = useActivities(10);

  // Suggested prompts - dynamically generated from AI service
  const [suggestedPrompts, setSuggestedPrompts] = useState<Array<{text: string, color: string}>>([]);

  // Set client flag to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add initial welcome message with suggestions when chat first loads
  useEffect(() => {
    if (!isClient || messages.length > 0 || (!ensInitialized && !paymentInitialized)) return;
    
    const welcomeMessage: ChatMessage = {
      id: `welcome_${Date.now()}`,
      content: "Welcome to your Web3 Assistant! I can help you with ENS domains, Base network payments, and more. What would you like to do?",
      sender: 'ai',
      timestamp: new Date(),
      metadata: {
        suggestions: [
          ...getPaymentSuggestions().slice(0, 4),
          ...getENSSuggestions().slice(0, 2)
        ]
      }
    };
    
    setMessages([welcomeMessage]);
  }, [isClient, messages.length, ensInitialized, paymentInitialized]);


  // Payment message processing
  const processPaymentMessage = async (message: string) => {
    if (!paymentInitialized) {
      setPaymentError('Payment service not initialized. Please connect your wallet.');
      return;
    }

    if (!isConnected || !address) {
      setPaymentError('Wallet not connected. Please connect your wallet to send payments.');
      return;
    }

    setPaymentIsLoading(true);
    setPaymentError(null);

    try {
      // Add a small delay to show the typing indicator
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await paymentChatIntegration.processMessage(message, address);
      
      if (result.success) {
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          content: result.message || result.data?.message || 'Payment operation completed.',
          sender: 'ai',
          timestamp: new Date(),
          metadata: {
            action: result.transaction,
            confidence: 0.9
          }
        };

        // Check if this is a payment that needs confirmation
        if (result.data?.needsConfirmation && result.transaction) {
          aiMessage.pendingAction = {
            type: 'payment_confirmation',
            description: `Send ${result.transaction.amount} ${result.transaction.token} to ${result.transaction.recipient ? result.transaction.recipient.slice(0, 6) + '...' + result.transaction.recipient.slice(-4) : 'recipient'}`,
            amount: result.transaction.amount,
            token: result.transaction.token,
            recipient: result.transaction.recipient
          };

          aiMessage.actions = [{
            type: 'confirmation',
            description: aiMessage.pendingAction.description,
            status: 'pending'
          }];
        }

        setMessages(prev => [...prev, aiMessage]);

        // Add activity based on payment type
        if (result.transaction) {
          if (result.transaction.type === 'send') {
            addActivity({
              title: `Payment: ${result.transaction.amount} ${result.transaction.token}`,
              description: `Sent to ${result.transaction.recipient ? result.transaction.recipient.slice(0, 6) + '...' + result.transaction.recipient.slice(-4) : 'recipient'}`,
              type: 'payment',
              status: result.transaction.status === 'completed' ? 'completed' : 'pending',
              txHash: result.transaction.hash,
            });
          } else if (result.transaction.type === 'check_balance') {
            addActivity({
              title: 'Balance Check',
              description: result.message || 'Checked account balances',
              type: 'balance_check',
              status: 'completed',
            });
          }
        }

        // Suggestions are only shown initially, not after every response
      } else {
        // Check if error is wallet-related and provide better guidance
        let errorContent = result.error || 'Failed to process payment request. Please try again.';
        if (result.error?.includes('wallet not connected')) {
          errorContent = 'Cannot process payment: wallet not connected. Please ensure your wallet is connected and try again.';
        } else if (result.error?.includes('User address is required')) {
          errorContent = 'Cannot process payment: user address is required. Please connect your wallet and try again.';
        }
        
        const errorMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          content: errorContent,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);

        // Add error activity
        addActivity({
          title: 'Payment Error',
          description: result.error || 'Payment operation failed',
          type: 'error',
          status: 'failed',
        });
      }
    } catch (error) {
      console.error('Payment message processing error:', error);
      const errorMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content: 'Failed to process payment request. Please check your connection and try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      // Add error activity
      addActivity({
        title: 'Payment Error',
        description: 'Payment processing failed',
        type: 'error',
        status: 'failed',
      });
    } finally {
      setPaymentIsLoading(false);
    }
  };

  // ENS message processing
  const processENSMessage = async (message: string) => {
    if (!ensInitialized) {
      setEnsError('ENS service not initialized. Please connect your wallet.');
      return;
    }

    setEnsIsLoading(true);
    setEnsError(null);

    try {
      // Add a small delay to show the typing indicator
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await ensChatIntegration.processMessage(message);
      
      if (result.success) {
        // Convert ENS message to regular chat message for better display
        const chatMessage: ChatMessage = {
          id: result.chatMessage.id,
          content: result.chatMessage.content,
          sender: 'ai',
          timestamp: new Date(),
          pendingAction: result.chatMessage.pendingAction,
          actions: result.chatMessage.actions,
          metadata: result.chatMessage.metadata
        };
        
        setMessages(prev => [...prev, chatMessage]);

        // Add activity based on the message content and metadata
        if (result.chatMessage.metadata?.action) {
          const action = result.chatMessage.metadata.action;
          const ensQuery = result.chatMessage.metadata.ensQuery;
          
          // Try to extract ENS name from the query or content
          const ensNameMatch = ensQuery?.match(/([a-z0-9-]+\.eth)/i) || 
                              result.chatMessage.content.match(/([a-z0-9-]+\.eth)/i);
          const ensName = ensNameMatch ? ensNameMatch[1] : 'Unknown';
          
          // Determine activity type based on content
          if (result.chatMessage.content.toLowerCase().includes('available')) {
            addActivity({
              title: `ENS Availability Check: ${ensName}`,
              description: result.chatMessage.content,
              type: 'ens_availability',
              ensName,
              status: 'completed',
            });
          } else if (result.chatMessage.content.toLowerCase().includes('register')) {
            addActivity({
              title: `ENS Registration: ${ensName}`,
              description: result.chatMessage.content,
              type: 'ens_registration',
              ensName,
              status: 'completed',
            });
          } else if (result.chatMessage.content.toLowerCase().includes('resolve') || 
                     result.chatMessage.content.toLowerCase().includes('address')) {
            addActivity({
              title: `ENS Resolution: ${ensName}`,
              description: result.chatMessage.content,
              type: 'ens_resolution',
              ensName,
              status: 'completed',
            });
          } else if (result.chatMessage.content.toLowerCase().includes('set') || 
                     result.chatMessage.content.toLowerCase().includes('update')) {
            addActivity({
              title: `ENS Update: ${ensName}`,
              description: result.chatMessage.content,
              type: 'ens_update',
              ensName,
              status: 'completed',
            });
          } else if (result.chatMessage.content.toLowerCase().includes('renew')) {
            addActivity({
              title: `ENS Renewal: ${ensName}`,
              description: result.chatMessage.content,
              type: 'ens_update',
              ensName,
              status: 'completed',
            });
          } else {
            // Generic ENS operation
            addActivity({
              title: `ENS Operation: ${ensName}`,
              description: result.chatMessage.content,
              type: 'ens_update',
              ensName,
              status: 'completed',
            });
          }
        }

        // Suggestions are only shown initially, not after every response
      } else {
        const errorMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          content: result.error || 'Failed to process ENS request. Please try again.',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);

        // Add error activity
        addActivity({
          title: 'ENS Error',
          description: result.error || 'ENS operation failed',
          type: 'error',
          status: 'failed',
        });
      }
    } catch (error) {
      console.error('ENS message processing error:', error);
      const errorMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content: 'Failed to process ENS request. Please check your connection and try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      // Add error activity
      addActivity({
        title: 'ENS Error',
        description: 'Failed to process ENS request',
        type: 'error',
        status: 'failed',
      });
    } finally {
      setEnsIsLoading(false);
    }
  };


  const getENSSuggestions = () => {
    return ensChatIntegration.getENSSuggestions();
  };

  // Get Payment suggestions
  const getPaymentSuggestions = () => {
    if (paymentChatIntegration.isInitialized()) {
      return paymentChatIntegration.getSuggestedPrompts();
    }
    return [
      "What's my balance?",
      "Send 0.1 ETH to 0x742d35Cc6634C0532925a3b8D5C0B4F3e8dCdD98",
      "Send 10 USDC to my friend",
      "How do I send a payment?",
      "What tokens can I send?",
      "Check transaction status"
    ];
  };

  // Detect if message is payment-related
  const isPaymentMessage = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const paymentKeywords = [
      'send', 'pay', 'transfer', 'balance', 'payment', 'transaction', 
      'eth', 'usdc', 'wallet', 'funds', 'money', 'crypto', 'base'
    ];
    
    return paymentKeywords.some(keyword => lowerMessage.includes(keyword)) ||
           /0x[a-fA-F0-9]{40}/.test(message) || // Ethereum address
           /\d+\.?\d*\s*(eth|usdc)/i.test(message) || // Amount with token
           /[a-z0-9-]+\.(eth|test)/i.test(message); // ENS name
  };

  // Suggestions are now only shown in the initial welcome message

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isProcessing || !isClient) return;
    
    const messageText = newMessage.trim();
    
    // Add user message first
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: messageText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    
    // Show typing indicator immediately after user message
    setIsProcessing(true);
    setShowTypingIndicator(true);
    
    try {
      // Route message to appropriate service based on content
      if (isPaymentMessage(messageText)) {
        await processPaymentMessage(messageText);
      } else {
        // Process through ENS integration (which uses LLM)
        await processENSMessage(messageText);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content: "I encountered an error processing your request. Please try again or rephrase your question.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setShowTypingIndicator(false);
    }
  };

  // Handle action confirmation
  const handleActionConfirm = async (action: any, messageId: string) => {
    console.log('Action confirmed:', action, 'for message:', messageId);
    
    // Update the action status to processing
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.actions) {
        return {
          ...msg,
          actions: msg.actions.map(act => ({
            ...act,
            status: 'pending' as const
          }))
        };
      }
      return msg;
    }));

    try {
      // Handle payment confirmation
      if (action.type === 'payment_confirmation') {
        console.log('Executing payment:', action);
        
        // Execute payment directly on client-side (bypass API to avoid wallet issues)
        const paymentRequest = {
          to: action.recipient as `0x${string}`,
          amount: action.amount,
          token: action.token as 'ETH' | 'USDC'
        };
        
        const result = await paymentChatIntegration.executePayment(paymentRequest);
        
        if (result.success) {
          // Update the action status to completed
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                actions: msg.actions?.map(act => ({
                  ...act,
                  status: 'completed' as const,
                  txHash: result.transaction?.hash
                })),
                pendingAction: undefined // Remove pending action after completion
              };
            }
            return msg;
          }));

          // Add a success message
          const successMessage: ChatMessage = {
            id: `ai_${Date.now()}`,
            content: result.message || 'Payment completed successfully!',
            sender: 'ai',
            timestamp: new Date(),
            metadata: {
              action: result.transaction,
              confidence: 1.0
            }
          };
          
          setMessages(prev => [...prev, successMessage]);

          // Add activity
          if (result.transaction) {
            addActivity({
              title: `Payment Completed: ${result.transaction.amount} ${result.transaction.token}`,
              description: `Sent to ${result.transaction.recipient ? result.transaction.recipient.slice(0, 6) + '...' + result.transaction.recipient.slice(-4) : 'recipient'}`,
              type: 'payment',
              status: 'completed',
              txHash: result.transaction.hash,
            });
          }
        } else {
          // Update the action status to failed
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId && msg.actions) {
              return {
                ...msg,
                actions: msg.actions.map(act => ({
                  ...act,
                  status: 'failed' as const
                }))
              };
            }
            return msg;
          }));

          // Add an error message
          const errorMessage: ChatMessage = {
            id: `ai_${Date.now()}`,
            content: result.error || 'Payment failed. Please try again.',
            sender: 'ai',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, errorMessage]);
        }
      }
      
      // Handle ENS operations
      else if (action.type === 'ens_operation') {
        console.log('Executing ENS operation:', action);
        // TODO: Implement actual ENS operation execution
        
        // Update the action status to completed for now
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId && msg.actions) {
            return {
              ...msg,
              actions: msg.actions.map(act => ({
                ...act,
                status: 'completed' as const
              }))
            };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error executing action:', error);
    
    // Update the action status to failed
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.actions) {
        return {
          ...msg,
          actions: msg.actions.map(act => ({
            ...act,
            status: 'failed' as const
          }))
        };
      }
      return msg;
    }));

      // Add an error message
      const errorMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content: 'Failed to execute action. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle action rejection
  const handleActionReject = (messageId: string) => {
    console.log('Action rejected for message:', messageId);
    
    // Update the action status to failed and remove pending action
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          actions: msg.actions?.map(act => ({
            ...act,
            status: 'failed' as const
          })),
          pendingAction: undefined // Remove pending action after rejection
        };
      }
      return msg;
    }));

    // Add a cancellation message
    const cancelMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      content: 'Payment cancelled by user.',
      sender: 'ai',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, cancelMessage]);
  };

  // Handle clearing messages
  const handleClearMessages = () => {
    setMessages([]);
    setEnsMessages([]);
    ensChatIntegration.clearConversationHistory();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isConnected={isConnected}
        account={address || null}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <Header
          agentName={agentName}
          agentEns={agentEns}
          currentPage={currentPage}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
        
        {/* Page Content */}
        {currentPage === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Welcome Section */}
            {messages.length === 0 && (
              <div className="flex-shrink-0">
                <WelcomeSection
                  isDarkMode={isDarkMode}
                  suggestedPrompts={suggestedPrompts}
                  setNewMessage={setNewMessage}
                />
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 min-h-0 flex flex-col">
              <ChatMessages
                messages={messages}
                handleActionConfirm={handleActionConfirm}
                handleActionReject={handleActionReject}
                formatTime={formatTime}
                onSuggestionClick={(suggestion) => {
                  setNewMessage(suggestion);
                  // Auto-send the suggestion
                  setTimeout(() => {
                    handleSendMessage();
                  }, 100);
                }}
              />
            </div>

            {/* AI Typing Indicator */}
            {(showTypingIndicator || isProcessing || ensIsLoading || paymentIsLoading) && (
              <div className="flex-shrink-0">
                <TypingIndicator />
              </div>
            )}

            {/* AI Error Display */}
            {ensError && (
              <div className="flex-shrink-0 mx-4 mb-2">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                  <strong>ENS Error:</strong> {ensError}
                </div>
              </div>
            )}

            {/* Payment Error Display */}
            {paymentError && (
              <div className="flex-shrink-0 mx-4 mb-2">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                  <strong>Payment Error:</strong> {paymentError}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="flex-shrink-0">
              <ChatInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendMessage={handleSendMessage}
                isProcessing={isProcessing || ensIsLoading || paymentIsLoading}
                onClear={handleClearMessages}
              />
            </div>
          </div>
        )}

        {/* Other Pages */}
        {currentPage === 'transactions' && (
          <div className="flex-1 overflow-hidden">
            <Transactions />
          </div>
        )}
        {currentPage === 'payments' && (
          <div className="flex-1 overflow-hidden">
            <Payments />
          </div>
        )}
        {currentPage === 'identity' && (
          <div className="flex-1 overflow-hidden">
            <Identity />
          </div>
        )}
        {currentPage === 'newEns' && (
          <div className="flex-1 overflow-hidden">
            <NewEns />
          </div>
        )}
        {currentPage === 'credentials' && (
          <div className="flex-1 overflow-hidden">
            <Credentials />
          </div>
        )}
      </div>
      
      {/* Right Panel */}
      <RightPanel
        isRightPanelCollapsed={isRightPanelCollapsed}
        setIsRightPanelCollapsed={setIsRightPanelCollapsed}
        recentActivities={recentActivities}
        formatTime={formatTime}
      />
    </div>
  );
};

export default ChatInterface;
