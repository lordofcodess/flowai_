import { Button } from "@/components/ui/button";

interface WelcomeSectionProps {
  isDarkMode?: boolean;
  suggestedPrompts?: Array<{ text: string; color: string }>;
  setNewMessage?: (message: string) => void;
}

const WelcomeSection = ({ 
  isDarkMode = false, 
  suggestedPrompts = [],
  setNewMessage = () => {} 
}: WelcomeSectionProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Flow ENS Assistant
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          I'm your AI-powered ENS assistant. I can help you with domain registration, name resolution, record management, and all things ENS!
        </p>
      </div>
      
      {/* Suggested Prompts Section */}
      {suggestedPrompts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Try asking me about:
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-sm"
                style={{ borderColor: prompt.color }}
                onClick={() => setNewMessage(prompt.text)}
              >
                {prompt.text}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeSection;
