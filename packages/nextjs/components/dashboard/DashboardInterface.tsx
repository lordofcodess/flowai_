"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Sidebar from "./Sidebar";
import WelcomeSection from "./WelcomeSection";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import RightPanel from "./RightPanel";
import TypingIndicator from "./TypingIndicator";
import { useActivities } from "@/hooks/useActivities";
import { Activity } from "@/services/activities/activityManager";

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
    status: 'pending' | 'completed' | 'failed';
  }[];
}

// Using Activity type from activity manager

export function DashboardInterface() {
  const { address, isConnected } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState<'chat' | 'transactions' | 'payments' | 'identity' | 'newEns' | 'credentials'>('chat');
  
  // Use real activities from activity manager
  const { activities: recentActivities, isLoading: activitiesLoading } = useActivities(10);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleActionConfirm = (action: any, messageId: string) => {
    // Handle action confirmation logic here
    console.log('Action confirmed:', action, 'for message:', messageId);
  };

  const handleActionReject = (messageId: string) => {
    // Handle action rejection logic here
    console.log('Action rejected for message:', messageId);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || isProcessing) return;
    
    setIsProcessing(true);
    const message = newMessage.trim();
    setNewMessage('');
    
    const now = new Date();
    const newChatMessage: ChatMessage = {
      id: `user_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      content: message,
      sender: 'user',
      timestamp: now,
    };
    setMessages(prev => [...prev, newChatMessage]);
    
    // Simulate agent response
    setTimeout(() => {
      const agentNow = new Date();
      const agentResponse: ChatMessage = {
        id: `ai_${agentNow.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
        content: `I received your message: "${message}". How can I help you today?`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentResponse]);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isConnected={isConnected}
        account={address || null}
      />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-shrink-0">
              <WelcomeSection />
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              <ChatMessages 
                messages={messages} 
                handleActionConfirm={handleActionConfirm}
                handleActionReject={handleActionReject}
                formatTime={formatTime}
              />
            </div>
            <div className="flex-shrink-0">
              <ChatInput 
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendMessage={sendMessage}
                isProcessing={isProcessing}
              />
            </div>
            <div className="flex-shrink-0">
              <TypingIndicator />
            </div>
          </div>
          <RightPanel 
            isRightPanelCollapsed={isRightPanelCollapsed}
            setIsRightPanelCollapsed={setIsRightPanelCollapsed}
            recentActivities={recentActivities}
            formatTime={formatTime}
          />
        </div>
      </div>
    </div>
  );
}
