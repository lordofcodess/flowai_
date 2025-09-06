import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, X } from "lucide-react";
import { useEffect, useRef } from "react";

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
  metadata?: {
    ensQuery?: string;
    action?: any;
    confidence?: number;
    suggestions?: string[];
  };
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  handleActionConfirm: (action: any, messageId: string) => void;
  handleActionReject: (messageId: string) => void;
  formatTime: (date: Date) => string;
  onSuggestionClick?: (suggestion: string) => void;
}

const ChatMessages = ({ 
  messages, 
  handleActionConfirm, 
  handleActionReject, 
  formatTime,
  onSuggestionClick
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    // Small delay to ensure DOM is updated before scrolling
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <div className="flex-1 p-2 md:p-3 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/20 [&::-webkit-scrollbar-thumb]:bg-muted/40 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="max-w-4xl mx-auto w-full space-y-6 p-2">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`flex items-start max-w-[85%] ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* Message Content */}
                <div className="space-y-3 flex-1">
                  {/* All messages as regular chat bubbles */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Actions for all messages */}
                  {message.actions && message.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="bg-card border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{action.description}</span>
                        <Badge variant={
                          action.status === 'completed' || action.status === 'confirmed' 
                            ? 'default' 
                            : action.status === 'pending' 
                              ? 'secondary' 
                              : 'destructive'
                        } className="text-xs" >
                          {(action.status === 'completed' || action.status === 'confirmed') && <CheckCircle className="w-3 h-3 mr-1" />}
                          {action.status}
                        </Badge>
                      </div>
                      
                      {/* Show confirmation symbols for pending actions */}
                      {action.status === 'pending' && message.pendingAction && (
                        <div className="flex items-center space-x-3 pt-2">
                          <div 
                            onClick={() => handleActionConfirm(message.pendingAction, message.id)}
                            className="cursor-pointer hover:scale-110 transition-transform select-none"
                            title="Confirm Action"
                          >
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div 
                            onClick={() => handleActionReject(message.id)}
                            className="cursor-pointer hover:scale-110 transition-transform select-none"
                            title="Cancel Action"
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </div>
                        </div>
                      )}
                      
                      {action.txHash && (
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>Tx: {action.txHash.slice(0, 10)}...{action.txHash.slice(-8)}</span>
                          <Button variant="ghost" size="sm" className="h-auto p-0 text-primary">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Suggestions */}
                  {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Try these commands:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.metadata.suggestions.slice(0, 4).map((suggestion, suggestionIndex) => (
                          <Button
                            key={suggestionIndex}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => onSuggestionClick?.(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* Invisible div to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;
