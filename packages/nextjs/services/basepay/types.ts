// Payment service types and interfaces
export interface PaymentAgentConfig {
  chainId: number;
  rpcUrl: string;
  contracts: {
    USDC: string;
    paymaster?: string;
  };
  settings: {
    defaultToken: 'ETH' | 'USDC';
    maxAmount: string;
    minAmount: string;
    gaslessEnabled: boolean;
    confirmationRequired: boolean;
  };
}

export interface PaymentRequest {
  to: `0x${string}`;
  amount: string;
  token: 'ETH' | 'USDC';
  message?: string;
  gasless?: boolean;
  ensName?: string; // Original ENS name for display purposes
}

export interface PaymentResult {
  hash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  amount: string;
  token: string;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: bigint;
  blockNumber?: bigint;
  timestamp?: string;
}

export interface BatchPaymentRequest {
  payments: Array<{
    to: `0x${string}`;
    amount: string;
    token: 'ETH' | 'USDC';
    message?: string;
  }>;
  gasless?: boolean;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address: string;
  formatted: string;
}

export interface PaymentAgentResponse {
  success: boolean;
  data?: {
    message: string;
    type: 'payment' | 'balance' | 'transaction' | 'batch_payment' | 'ai_response' | 'fallback_response' | 'ens_registration' | 'ens_availability' | 'ens_resolution';
    payment?: PaymentResult;
    balance?: TokenBalance[];
    transaction?: {
      type: 'send' | 'batch_send' | 'check_balance';
      amount?: string;
      token?: string;
      recipient?: string;
      recipients?: string[];
      status: 'pending' | 'completed' | 'failed';
      hash?: string;
      cost?: string;
    };
    timestamp: string;
    needsConfirmation?: boolean;
  };
  message?: string;
  error?: string;
  transaction?: {
    type: 'send' | 'batch_send' | 'check_balance';
    amount?: string;
    token?: string;
    recipient?: string;
    recipients?: string[];
    status: 'pending' | 'completed' | 'failed';
    hash?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  operation?: {
    type: 'send' | 'batch_send' | 'check_balance';
    amount?: string;
    token?: string;
    recipient?: string;
    data?: any;
  };
  transaction?: {
    type: 'send' | 'batch_send' | 'check_balance';
    amount?: string;
    token?: string;
    recipient?: string;
    recipients?: string[];
    status: 'pending' | 'completed' | 'failed';
    hash?: string;
  };
}

export interface PaymentOperation {
  type: 'send' | 'batch_send' | 'check_balance' | 'get_balance' | 'send_eth' | 'send_usdc';
  name: string;
  description: string;
  parameters?: any;
  timestamp: Date;
}

export interface AccountInfo {
  address: `0x${string}`;
  balance: string;
  nonce: number;
  exists: boolean;
  chainId: number;
  chainName: string;
  tokens: TokenBalance[];
}

// Network configurations
export const BASE_SEPOLIA_NETWORK = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  contracts: {
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
  },
  settings: {
    defaultToken: 'ETH' as const,
    maxAmount: '10', // 10 ETH max for safety
    minAmount: '0.001', // 0.001 ETH minimum
    gaslessEnabled: true,
    confirmationRequired: true
  }
};

export const BASE_MAINNET_NETWORK = {
  chainId: 8453,
  name: 'Base Mainnet',
  rpcUrl: 'https://mainnet.base.org',
  contracts: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet USDC
  },
  settings: {
    defaultToken: 'ETH' as const,
    maxAmount: '1', // 1 ETH max for mainnet safety
    minAmount: '0.001',
    gaslessEnabled: true,
    confirmationRequired: true
  }
};
