import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { base, baseSepolia } from 'viem/chains';
import { BasePayService, PaymentRequest, PaymentResult, TokenBalance } from '@/services/basepay/pay';
import { BaseAccountService } from '@/services/basepay/baseaccount';

export interface UseBasePayReturn {
  // Payment functions
  sendPayment: (payment: PaymentRequest) => Promise<PaymentResult>;
  sendETH: (to: `0x${string}`, amount: string, message?: string) => Promise<PaymentResult>;
  sendUSDC: (to: `0x${string}`, amount: string, message?: string) => Promise<PaymentResult>;
  sendBatchPayments: (payments: Array<{ to: `0x${string}`; amount: string; token: 'ETH' | 'USDC' }>) => Promise<PaymentResult>;
  
  // Balance functions
  getETHBalance: () => Promise<string>;
  getUSDCBalance: () => Promise<string>;
  getTokenBalances: () => Promise<TokenBalance[]>;
  refreshBalances: () => Promise<void>;
  
  // Transaction functions
  getTransactionStatus: (hash: `0x${string}`) => Promise<PaymentResult>;
  estimateGas: (payment: PaymentRequest) => Promise<bigint>;
  
  // Base account functions
  getBaseAccountInfo: () => Promise<any>;
  initializeBaseAccount: () => Promise<void>;
  
  // Top-up functions
  topUpBaseAccount: (amount: string) => Promise<PaymentResult>;
  topUpBaseAccountWithUSDC: (amount: string) => Promise<PaymentResult>;
  needsTopUp: (requiredAmount: string, token?: 'ETH' | 'USDC') => Promise<boolean>;
  
  // USDC approval functions
  checkUSDCAllowance: (ownerAddress: `0x${string}`, spenderAddress: `0x${string}`) => Promise<string>;
  approveUSDC: (amount: string) => Promise<PaymentResult>;
  
  // Testnet functions
  getTestnetETH: (address: `0x${string}`) => Promise<boolean>;
  
  // State
  balances: TokenBalance[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isBaseNetwork: boolean;
  currentChain: { id: number; name: string; isTestnet: boolean };
  
  // Utility functions
  formatAddress: (address: string) => string;
  isValidAddress: (address: string) => boolean;
  formatAmount: (amount: string, decimals?: number) => string;
}

export function useBasePay(): UseBasePayReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  
  const [payService, setPayService] = useState<BasePayService | null>(null);
  const [accountService, setAccountService] = useState<BaseAccountService | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current network is Base
  const isBaseNetwork = chainId === base.id || chainId === baseSepolia.id;

  // Initialize services
  useEffect(() => {
    if (isBaseNetwork && address && walletClient) {
      const service = new BasePayService(chainId, walletClient);
      const accountSvc = new BaseAccountService(chainId);
      setPayService(service);
      setAccountService(accountSvc);
    } else {
      setPayService(null);
      setAccountService(null);
    }
  }, [chainId, address, isBaseNetwork, walletClient]);




  // Initialize Base account
  const initializeBaseAccount = useCallback(async () => {
    if (!payService || !address) return;

    try {
      setIsLoading(true);
      await payService.initializeBaseAccount(address as `0x${string}`);
    } catch (error) {
      console.error('Error initializing Base account:', error);
      setError('Failed to initialize Base account');
    } finally {
      setIsLoading(false);
    }
  }, [payService, address]);

  // Load token balances
  const loadBalances = useCallback(async () => {
    if (!payService || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const tokenBalances = await payService.getTokenBalances(address as `0x${string}`);
      setBalances(tokenBalances);
    } catch (err) {
      console.error('Error loading balances:', err);
      setError('Failed to load balances');
    } finally {
      setIsLoading(false);
    }
  }, [payService, address]);

  // Initialize Base account when connected
  useEffect(() => {
    if (payService && address && isConnected) {
      initializeBaseAccount();
    }
  }, [payService, address, isConnected, initializeBaseAccount]);

  // Load balances after Base account is initialized
  useEffect(() => {
    if (payService && address && isConnected) {
      loadBalances();
    }
  }, [payService, address, isConnected, loadBalances]);

  // Send payment
  const sendPayment = useCallback(async (payment: PaymentRequest): Promise<PaymentResult> => {
    if (!payService) {
      throw new Error('Payment service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await payService.sendPayment(payment);
      // Refresh balances after successful payment
      await loadBalances();
      return result;
    } catch (err) {
      console.error('Error sending payment:', err);
      setError('Failed to send payment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [payService, loadBalances]);

  // Send ETH
  const sendETH = useCallback(async (to: `0x${string}`, amount: string, message?: string): Promise<PaymentResult> => {
    return sendPayment({
      to,
      amount,
      token: 'ETH',
      message
    });
  }, [sendPayment]);

  // Send USDC
  const sendUSDC = useCallback(async (to: `0x${string}`, amount: string, message?: string): Promise<PaymentResult> => {
    return sendPayment({
      to,
      amount,
      token: 'USDC',
      message
    });
  }, [sendPayment]);

  // Send batch payments (seamless)
  const sendBatchPayments = useCallback(async (payments: Array<{ to: `0x${string}`; amount: string; token: 'ETH' | 'USDC' }>): Promise<PaymentResult> => {
    if (!payService) {
      throw new Error('Payment service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await payService.sendBatchPayments(payments);
      // Refresh balances after successful payment
      await loadBalances();
      return result;
    } catch (err) {
      console.error('Error sending batch payments:', err);
      setError('Failed to send batch payments');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [payService, loadBalances]);

  // Get ETH balance
  const getETHBalance = useCallback(async (): Promise<string> => {
    if (!payService || !address) return '0';
    return payService.getETHBalance(address as `0x${string}`);
  }, [payService, address]);

  // Get USDC balance
  const getUSDCBalance = useCallback(async (): Promise<string> => {
    if (!payService || !address) return '0';
    return payService.getUSDCBalance(address as `0x${string}`);
  }, [payService, address]);

  // Get token balances
  const getTokenBalances = useCallback(async (): Promise<TokenBalance[]> => {
    if (!payService || !address) return [];
    return payService.getTokenBalances(address as `0x${string}`);
  }, [payService, address]);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    await loadBalances();
  }, [loadBalances]);

  // Get transaction status
  const getTransactionStatus = useCallback(async (hash: `0x${string}`): Promise<PaymentResult> => {
    if (!payService) {
      throw new Error('Payment service not available');
    }
    return payService.getTransactionStatus(hash);
  }, [payService]);

  // Estimate gas
  const estimateGas = useCallback(async (payment: PaymentRequest): Promise<bigint> => {
    if (!payService) {
      throw new Error('Payment service not available');
    }
    return payService.estimateGas(payment);
  }, [payService]);

  // Utility functions
  const formatAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const isValidAddress = useCallback((address: string): address is `0x${string}` => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }, []);

  const formatAmount = useCallback((amount: string, decimals: number = 4) => {
    const num = parseFloat(amount);
    return num.toFixed(decimals);
  }, []);

  // Get Base account info
  const getBaseAccountInfo = useCallback(async () => {
    if (!payService || !address) return null;
    return payService.getBaseAccountInfo(address as `0x${string}`);
  }, [payService, address]);

  // Top-up functions
  const topUpBaseAccount = useCallback(async (amount: string) => {
    if (!payService) {
      throw new Error('Payment service not available');
    }
    return payService.topUpBaseAccount(amount);
  }, [payService]);

  const topUpBaseAccountWithUSDC = useCallback(async (amount: string) => {
    if (!payService) {
      throw new Error('Payment service not available');
    }
    return payService.topUpBaseAccountWithUSDC(amount);
  }, [payService]);

  const needsTopUp = useCallback(async (requiredAmount: string, token: 'ETH' | 'USDC' = 'ETH') => {
    if (!payService) {
      return true; // Assume needs top-up if service not available
    }
    return payService.needsTopUp(requiredAmount, token);
  }, [payService]);

  // USDC approval functions
  const checkUSDCAllowance = useCallback(async (ownerAddress: `0x${string}`, spenderAddress: `0x${string}`) => {
    if (!payService) {
      return '0';
    }
    return payService.checkUSDCAllowance(ownerAddress, spenderAddress);
  }, [payService]);

  const approveUSDC = useCallback(async (amount: string) => {
    if (!payService) {
      throw new Error('Payment service not available');
    }
    return payService.approveUSDC(amount);
  }, [payService]);

  // Get testnet ETH from faucet
  const getTestnetETH = useCallback(async (address: `0x${string}`): Promise<boolean> => {
    if (!payService) {
      throw new Error('Payment service not available');
    }
    return payService.getTestnetETH(address);
  }, [payService]);

  // Get current chain info
  const currentChain = payService ? payService.getCurrentChain() : {
    id: chainId,
    name: chainId === base.id ? 'Base Mainnet' : chainId === baseSepolia.id ? 'Base Sepolia' : 'Unknown',
    isTestnet: chainId === baseSepolia.id
  };

  return {
    // Payment functions
    sendPayment,
    sendETH,
    sendUSDC,
    sendBatchPayments,
    
    // Balance functions
    getETHBalance,
    getUSDCBalance,
    getTokenBalances,
    refreshBalances,
    
    // Transaction functions
    getTransactionStatus,
    estimateGas,
    
    // Base account functions
    getBaseAccountInfo,
    initializeBaseAccount,
    
    // Top-up functions
    topUpBaseAccount,
    topUpBaseAccountWithUSDC,
    needsTopUp,
    
    // USDC approval functions
    checkUSDCAllowance,
    approveUSDC,
    
    // Testnet functions
    getTestnetETH,
    
    // State
    balances,
    isLoading,
    error,
    isConnected,
    isBaseNetwork,
    currentChain,
    
    // Utility functions
    formatAddress,
    isValidAddress,
    formatAmount
  };
}

// Hook for payment history
export function usePaymentHistory() {
  const [payments, setPayments] = useState<PaymentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPayment = useCallback((payment: PaymentResult) => {
    setPayments(prev => [payment, ...prev]);
  }, []);

  const updatePayment = useCallback((hash: `0x${string}`, updates: Partial<PaymentResult>) => {
    setPayments(prev => 
      prev.map(payment => 
        payment.hash === hash ? { ...payment, ...updates } : payment
      )
    );
  }, []);

  const clearPayments = useCallback(() => {
    setPayments([]);
  }, []);

  return {
    payments,
    isLoading,
    error,
    addPayment,
    updatePayment,
    clearPayments
  };
}
