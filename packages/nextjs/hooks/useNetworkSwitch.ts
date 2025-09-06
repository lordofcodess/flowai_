import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { base, baseSepolia, mainnet, sepolia } from 'wagmi/chains';

export interface NetworkConfig {
  id: number;
  name: string;
  symbol: string;
  icon: string;
  description: string;
  useCase: string;
  color: string;
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: baseSepolia.id,
    name: 'Base Sepolia',
    symbol: 'BASE-SEP',
    icon: '🔵',
    description: 'Base testnet for development',
    useCase: 'Payments, DeFi, Testing',
    color: 'blue'
  },
  {
    id: sepolia.id,
    name: 'Ethereum Sepolia',
    symbol: 'ETH-SEP',
    icon: '💎',
    description: 'Ethereum testnet for ENS testing',
    useCase: 'ENS, NFTs, Testing',
    color: 'purple'
  },
  {
    id: mainnet.id,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    icon: '💎',
    description: 'Main Ethereum network',
    useCase: 'ENS, NFTs, Production',
    color: 'purple'
  },
  {
    id: base.id,
    name: 'Base Mainnet',
    symbol: 'BASE',
    icon: '🔵',
    description: 'Base mainnet for production',
    useCase: 'Payments, DeFi, Production',
    color: 'blue'
  }
];

export function useNetworkSwitch() {
  const { isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const chainId = useChainId();
  
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current network info
  useEffect(() => {
    const network = SUPPORTED_NETWORKS.find(n => n.id === chainId);
    setCurrentNetwork(network || null);
  }, [chainId]);

  // Switch to a specific network
  const switchToNetwork = async (networkId: number) => {
    if (!isConnected) {
      throw new Error('Please connect your wallet first');
    }

    if (chainId === networkId) {
      return; // Already on the correct network
    }

    setIsLoading(true);
    try {
      await switchChain({ chainId: networkId });
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to Base Sepolia network
  const switchToBase = () => switchToNetwork(baseSepolia.id);

  // Switch to Ethereum Sepolia testnet
  const switchToEthereum = () => switchToNetwork(sepolia.id);

  // Switch to Ethereum mainnet
  const switchToMainnet = () => switchToNetwork(mainnet.id);

  // Switch to Base mainnet
  const switchToBaseMainnet = () => switchToNetwork(base.id);

  // Get network by ID
  const getNetworkById = (id: number) => SUPPORTED_NETWORKS.find(n => n.id === id);

  // Check if current network supports ENS
  const supportsENS = () => {
    return chainId === mainnet.id || chainId === sepolia.id;
  };

  // Check if current network is Base (Sepolia or Mainnet)
  const isBaseNetwork = () => {
    return chainId === base.id || chainId === baseSepolia.id;
  };

  // Check if current network is Base Sepolia
  const isBaseSepolia = () => {
    return chainId === baseSepolia.id;
  };

  // Check if current network is Ethereum Sepolia
  const isEthereumSepolia = () => {
    return chainId === sepolia.id;
  };

  // Check if current network is Ethereum mainnet
  const isEthereumNetwork = () => {
    return chainId === mainnet.id;
  };

  // Get recommended network for a specific operation
  const getRecommendedNetwork = (operation: 'payment' | 'ens' | 'defi' | 'nft') => {
    switch (operation) {
      case 'payment':
        return baseSepolia; // Base Sepolia for payments (testnet)
      case 'ens':
        return sepolia; // Ethereum Sepolia for ENS testing
      case 'defi':
        return baseSepolia; // Base Sepolia for DeFi testing
      case 'nft':
        return sepolia; // Ethereum Sepolia for NFT testing
      default:
        return baseSepolia;
    }
  };

  return {
    currentNetwork,
    supportedNetworks: SUPPORTED_NETWORKS,
    isConnected,
    isSwitching: isSwitching || isLoading,
    switchToNetwork,
    switchToBase,
    switchToEthereum,
    switchToMainnet,
    switchToBaseMainnet,
    getNetworkById,
    supportsENS,
    isBaseNetwork,
    isBaseSepolia,
    isEthereumSepolia,
    isEthereumNetwork,
    getRecommendedNetwork,
    chainId
  };
}
