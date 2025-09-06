import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NetworkSwitcher } from "@/components/ui/NetworkSwitcher";
import { Bot, Menu, Wallet, Sun, Moon } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";

interface HeaderProps {
  agentName: string | null;
  agentEns: string | null;
  currentPage: string;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const Header = ({ 
  agentName, 
  agentEns, 
  currentPage, 
  isSidebarCollapsed, 
  setIsSidebarCollapsed 
}: HeaderProps) => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme on component mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const connectWallet = async () => {
    try {
      await connect({ connector: injected() });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const WalletButton = () => {
    if (!isConnected) {
      return (
        <Button 
          onClick={connectWallet}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary"
        >
          Connect Wallet
        </Button>
      );
    }

    return (
      <div className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background">
        <Wallet className="w-4 h-4" />
        <span className="text-xs font-medium">Connected</span>
      </div>
    );
  };
  return (
    <div className="border-b border-border bg-card flex-shrink-0">
      {/* Mobile Header */}
      <div className="md:hidden px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <div>
              <h3 className="font-semibold text-sm">
                {agentName || "AI Agent"}
              </h3>
              {agentEns && (
                <p className="text-xs text-muted-foreground font-mono">{agentEns}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <NetworkSwitcher variant="compact" />
            <Badge variant="outline" className="border-primary text-primary text-xs">
              <Bot className="w-3 h-3 mr-1" />
              AI Agent
            </Badge>
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block px-4 py-[1.7vh]">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {agentName || "AI Agent"}
            </h3>
            {agentEns && (
              <p className="text-sm text-muted-foreground font-mono">{agentEns}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 hover:bg-muted"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <NetworkSwitcher variant="compact" />
            <WalletButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
