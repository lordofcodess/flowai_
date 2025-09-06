import { base, baseSepolia } from 'viem/chains';

// Base network contract addresses
export const BASE_CONTRACT_ADDRESSES = {
  // USDC contract addresses
  USDC: {
    [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet USDC
    [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Base Sepolia USDC
  },
  
  // Account Factory addresses
  ACCOUNT_FACTORY: {
    [base.id]: '0x9406Cc6185a346906296840746125a0E44976454', // Base Mainnet
    [baseSepolia.id]: '0x9406Cc6185a346906296840746125a0E44976454' // Base Sepolia (same address)
  },
  
  // EntryPoint addresses
  ENTRY_POINT: {
    [base.id]: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Base Mainnet
    [baseSepolia.id]: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' // Base Sepolia (same address)
  }
} as const;

// RPC URLs for Base networks
export const BASE_RPC_URLS = {
  [base.id]: 'https://mainnet.base.org',
  [baseSepolia.id]: 'https://sepolia.base.org'
} as const;

// Helper function to get contract address by chain ID
export function getContractAddress(contract: keyof typeof BASE_CONTRACT_ADDRESSES, chainId: number): `0x${string}` | undefined {
  return BASE_CONTRACT_ADDRESSES[contract][chainId as keyof typeof BASE_CONTRACT_ADDRESSES[typeof contract]];
}

// Helper function to get RPC URL by chain ID
export function getRpcUrl(chainId: number): string | undefined {
  return BASE_RPC_URLS[chainId as keyof typeof BASE_RPC_URLS];
}

// Helper function to get BaseScan URL by chain ID
export function getBaseScanUrl(chainId: number): string {
  return chainId === baseSepolia.id 
    ? 'https://sepolia.basescan.org'
    : 'https://basescan.org';
}

// Helper function to get transaction URL
export function getTransactionUrl(txHash: string, chainId: number): string {
  return `${getBaseScanUrl(chainId)}/tx/${txHash}`;
}
