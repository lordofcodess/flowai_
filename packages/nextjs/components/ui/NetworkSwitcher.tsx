import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNetworkSwitch, SUPPORTED_NETWORKS } from '@/hooks/useNetworkSwitch';
import { 
  ChevronDown, 
  Check, 
  AlertCircle, 
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';

interface NetworkSwitcherProps {
  showLabel?: boolean;
  variant?: 'default' | 'compact' | 'full';
  onNetworkChange?: (networkId: number) => void;
}

export function NetworkSwitcher({ 
  showLabel = true, 
  variant = 'default',
  onNetworkChange 
}: NetworkSwitcherProps) {
  const { 
    currentNetwork, 
    isConnected, 
    isSwitching, 
    switchToNetwork,
    supportsENS,
    isBaseNetwork,
    isEthereumNetwork
  } = useNetworkSwitch();

  const [isOpen, setIsOpen] = useState(false);

  const handleNetworkSwitch = async (networkId: number) => {
    try {
      await switchToNetwork(networkId);
      setIsOpen(false);
      onNetworkChange?.(networkId);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Not Connected</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isSwitching}>
            {isSwitching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="mr-2">{currentNetwork?.icon}</span>
                <span className="mr-1">{currentNetwork?.name}</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {SUPPORTED_NETWORKS.map((network) => (
            <DropdownMenuItem
              key={network.id}
              onClick={() => handleNetworkSwitch(network.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <span>{network.icon}</span>
                <span>{network.name}</span>
              </div>
              {currentNetwork?.id === network.id && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'full') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="w-5 h-5" />
            <span>Network Settings</span>
          </CardTitle>
          <CardDescription>
            Switch between networks for different operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {SUPPORTED_NETWORKS.map((network) => (
              <div
                key={network.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  currentNetwork?.id === network.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleNetworkSwitch(network.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{network.icon}</span>
                    <div>
                      <div className="font-medium">{network.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {network.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentNetwork?.id === network.id && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                    {isSwitching && currentNetwork?.id === network.id && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {network.useCase}
                  </Badge>
                  {network.id === 1 && (
                    <Badge variant="secondary" className="text-xs">
                      ENS Support
                    </Badge>
                  )}
                  {network.id === 11155111 && (
                    <Badge variant="secondary" className="text-xs">
                      ENS Testnet
                    </Badge>
                  )}
                  {network.id === 8453 && (
                    <Badge variant="secondary" className="text-xs">
                      Fast & Cheap
                    </Badge>
                  )}
                  {network.id === 84532 && (
                    <Badge variant="secondary" className="text-xs">
                      Base Testnet
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 mb-2">
                <span>Current Network:</span>
                <Badge variant="outline">
                  {currentNetwork?.name} ({currentNetwork?.symbol})
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {supportsENS() ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                  )}
                  <span>ENS Support: {supportsENS() ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isBaseNetwork() ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                  )}
                  <span>Base Network: {isBaseNetwork() ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className="flex items-center space-x-2">
      {showLabel && (
        <span className="text-sm font-medium">Network:</span>
      )}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isSwitching}>
            {isSwitching ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <span className="mr-2">{currentNetwork?.icon}</span>
            )}
            <span className="mr-1">{currentNetwork?.name}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {SUPPORTED_NETWORKS.map((network) => (
            <DropdownMenuItem
              key={network.id}
              onClick={() => handleNetworkSwitch(network.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <span>{network.icon}</span>
                <div>
                  <div className="font-medium">{network.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {network.description}
                  </div>
                </div>
              </div>
              {currentNetwork?.id === network.id && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            💡 Use Base for payments, Ethereum for ENS
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
