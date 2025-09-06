import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, CheckCircle, PanelLeftClose, PanelLeftOpen, Bot, FileText, User, CreditCard } from "lucide-react";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

interface SidebarProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  currentPage: 'chat' | 'transactions' | 'payments' | 'identity' | 'newEns' | 'credentials';
  setCurrentPage: (page: 'chat' | 'transactions' | 'payments' | 'identity' | 'newEns' | 'credentials') => void;
  isConnected: boolean;
  account: string | null;
}

const Sidebar = ({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  currentPage, 
  setCurrentPage, 
  isConnected, 
  account 
}: SidebarProps) => {
  const { address, chain } = useAccount();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoadingEns, setIsLoadingEns] = useState(false);

  // ENS resolution using your ENS agent service
  useEffect(() => {
    const resolveENSName = async () => {
      if (!address || !isConnected) {
        setEnsName(null);
        return;
      }

      console.log('Wallet connected! Resolving ENS for address:', address);
      setIsLoadingEns(true);
      try {
        const response = await fetch(`/api/ens/address/${address}/resolve`);
        const result = await response.json();
        
        console.log('ENS resolution result:', result);
        
        if (result.success && result.data?.name) {
          setEnsName(result.data.name);
          console.log('ENS name resolved:', result.data.name);
        } else {
          setEnsName(null);
          console.log('No ENS name found for address');
        }
      } catch (error) {
        console.error('Failed to resolve ENS name:', error);
        setEnsName(null);
      } finally {
        setIsLoadingEns(false);
      }
    };

    // Only resolve when wallet is connected
    if (isConnected && address) {
      resolveENSName();
    } else {
      setEnsName(null);
    }
  }, [address, isConnected]);

  // Get display name - show address when connected, ENS name if available
  const displayName = isConnected && address 
    ? (ensName || `${address.slice(0, 6)}...${address.slice(-4)}`)
    : 'Not Connected';
  const avatarFallback = isConnected && address ? address.slice(2, 3).toUpperCase() : 'U';
  return (
    <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out max-md:hidden`}>
      {/* Header with Logo and Collapse Button */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 mb-2 rounded-lg flex items-center justify-center flex-shrink-0 relative group cursor-pointer"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <PanelLeftOpen className="w-4 h-4 text-white" />
                </div>
              ) : (
                <span className="text-white font-bold text-lg">E</span>
              )}
            </div>
          </div>
          {!isSidebarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          {!isSidebarCollapsed ? (
            <>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search"
                className="pl-10 bg-muted/50"
              />
            </>
          ) : (
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 mx-auto hover:bg-muted/50">
              <Search className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-2">
        <Button 
          variant="ghost" 
          className={`${isSidebarCollapsed ? 'w-8 h-8 p-0 mx-auto' : 'w-full'} justify-start hover:bg-muted/50`}
          onClick={() => setCurrentPage('chat')}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isSidebarCollapsed ? 'mr-3' : ''} ${currentPage === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Bot className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && <span>AI Chat</span>}
        </Button>
        <Button 
          variant="ghost" 
          className={`${isSidebarCollapsed ? 'w-8 h-8 p-0 mx-auto' : 'w-full'} justify-start hover:bg-muted/50`}
          onClick={() => setCurrentPage('transactions')}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isSidebarCollapsed ? 'mr-3' : ''} ${currentPage === 'transactions' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <FileText className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && <span>Transactions</span>}
        </Button>
        <Button 
          variant="ghost" 
          className={`${isSidebarCollapsed ? 'w-8 h-8 p-0 mx-auto' : 'w-full'} justify-start hover:bg-muted/50`}
          onClick={() => setCurrentPage('payments')}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isSidebarCollapsed ? 'mr-3' : ''} ${currentPage === 'payments' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <CreditCard className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && <span>Payments</span>}
        </Button>
        <Button 
          variant="ghost" 
          className={`${isSidebarCollapsed ? 'w-8 h-8 p-0 mx-auto' : 'w-full'} justify-start hover:bg-muted/50`}
          onClick={() => setCurrentPage('newEns')}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isSidebarCollapsed ? 'mr-3' : ''} ${currentPage === 'newEns' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Plus className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && <span>New ENS</span>}
        </Button>
        <Button 
          variant="ghost" 
          className={`${isSidebarCollapsed ? 'w-8 h-8 p-0 mx-auto' : 'w-full'} justify-start hover:bg-muted/50`}
          onClick={() => setCurrentPage('credentials')}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isSidebarCollapsed ? 'mr-3' : ''} ${currentPage === 'credentials' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <CheckCircle className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && <span>Credentials</span>}
        </Button>
        <Button 
          variant="ghost" 
          className={`${isSidebarCollapsed ? 'w-8 h-8 p-0 mx-auto' : 'w-full'} justify-start hover:bg-muted/50`}
          onClick={() => setCurrentPage('identity')}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isSidebarCollapsed ? 'mr-3' : ''} ${currentPage === 'identity' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <User className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && <span>Identity</span>}
        </Button>
      </nav>

      {/* User Profile */}
      <div className="p-2 md:p-4 bg-card">
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src="/api/placeholder/32/32" />
            <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-white">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>

          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {isLoadingEns ? 'Resolving...' : displayName}
              </p>
              {isConnected && chain && (
                <p className="text-xs text-muted-foreground truncate">
                  {chain.name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
