import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Mic, FileText, Send } from "lucide-react";

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: () => void;
  isProcessing: boolean;
  onClear?: () => void;
}

const ChatInput = ({ newMessage, setNewMessage, sendMessage, isProcessing, onClear }: ChatInputProps) => {
  // Ensure newMessage is always a string
  const safeMessage = newMessage || "";
  
  return (
    <div className="p-1 md:p-2 mb-6 bg-card">
      <div className="max-w-2xl mx-auto w-full">
        <div className="relative">
          <Input
            placeholder="Ask your agent anything..."
            value={safeMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="w-full pr-16 md:pr-20 h-9 md:h-10 text-sm duration-200 border border-border focus:outline-none focus:ring-0 focus:border-border bg-transparent rounded-full"
            disabled={isProcessing}
          />
          
          {/* Action Icons Inside Input */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {onClear && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-muted/50 text-muted-foreground"
                onClick={onClear}
                title="Clear chat"
              >
                <FileText className="w-3 h-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-muted/50 max-sm:hidden">
              <Paperclip className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-muted/50 max-sm:hidden">
              <Mic className="w-3 h-3" />
            </Button>
            <Button 
              onClick={sendMessage}
              disabled={isProcessing || !safeMessage.trim()}
              size="sm"
              className="h-5 w-5 md:h-6 md:w-6 p-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
