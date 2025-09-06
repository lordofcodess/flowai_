import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { useBasePay } from "@/hooks/useBasePay";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import { getTransactionUrl } from "@/abis/contracts/base/constants";
import { 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  CreditCard,
  Wallet,
  Wifi,
  Info,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  XCircle
} from "lucide-react";

interface PaymentForm {
  recipient: string;
  amount: string;
  token: string;
  message: string;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'stake' | 'topup';
  amount: string;
  currency: string;
  from: string;
  to: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
  txHash: string;
  gasFee: string;
  blockNumber?: number;
  isTestnet?: boolean;
}


const Payments = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  
  // Use Base pay hooks
  const {
    sendPayment,
    sendETH,
    sendUSDC,
    sendBatchPayments,
    balances,
    isLoading: balancesLoading,
    error: payError,
    isBaseNetwork,
    currentChain,
    formatAddress,
    isValidAddress,
    formatAmount,
    getBaseAccountInfo,
    refreshBalances,
    getTestnetETH
  } = useBasePay();

  const { switchToNetwork, getRecommendedNetwork } = useNetworkSwitch();
  
  const [formData, setFormData] = useState<PaymentForm>({
    recipient: '',
    amount: '',
    token: 'USDC',
    message: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  

  // Base account state
  const [baseAccountInfo, setBaseAccountInfo] = useState<any>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);

  // Transaction state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const handleInputChange = (field: keyof PaymentForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };


  const handleSendPayment = async () => {
    if (!isConnected) {
      setError('Please connect your wallet to send payments');
      return;
    }

    if (!isBaseNetwork) {
      setError('Please switch to Base network to send payments');
      return;
    }

    if (!formData.recipient || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isValidAddress(formData.recipient)) {
      setError('Please enter a valid wallet address');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);

    try {
      const payment = {
        to: formData.recipient as `0x${string}`,
        amount: formData.amount,
        token: formData.token as 'ETH' | 'USDC',
        message: formData.message
      };

      const result = await sendPayment(payment);
      
      setTxHash(result.hash);
      setSuccess(`Successfully sent ${formData.amount} ${formData.token} to ${formatAddress(formData.recipient)}`);
      
      // Emit new transaction event for real-time updates
      const newTransaction = {
        id: result.hash,
        type: 'send' as const,
        amount: formData.amount,
        currency: formData.token,
        from: address,
        to: formData.recipient,
        status: 'completed' as const,
        timestamp: new Date(),
        txHash: result.hash,
        gasFee: '0.000021', // Mock gas fee
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000, // Mock block number
        isTestnet: currentChain.isTestnet
      };
      
      // Dispatch custom event for transaction updates
      window.dispatchEvent(new CustomEvent('newTransaction', { detail: newTransaction }));
      
      // Reset form
      setFormData({
        recipient: '',
        amount: '',
        token: 'USDC',
        message: ''
      });
      
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchToBase = async () => {
    try {
      const baseNetwork = getRecommendedNetwork('payment');
      await switchToNetwork(baseNetwork.id);
    } catch (error) {
      console.error('Failed to switch network:', error);
      setError('Failed to switch to Base network');
    }
  };

  // Load Base account info
  const loadBaseAccountInfo = async () => {
    if (!isConnected || !address) return;
    
    setIsLoadingAccount(true);
    try {
      const info = await getBaseAccountInfo();
      setBaseAccountInfo(info);
    } catch (error) {
      console.error('Error loading Base account info:', error);
    } finally {
      setIsLoadingAccount(false);
    }
  };

  // Fetch real transactions from Base Sepolia testnet
  const fetchTransactions = async (address: string) => {
    if (!address) return;

    setIsLoadingTransactions(true);
    setTransactionError(null);

    try {
      const isTestnet = chainId === 84532; // Base Sepolia
      const baseScanUrl = isTestnet 
        ? 'https://api-sepolia.basescan.org/api'
        : 'https://api.basescan.org/api';
      
      console.log('Fetching transactions for:', address);
      console.log('Using BaseScan URL:', baseScanUrl);
      console.log('Is testnet:', isTestnet);

      // For testnet, try to fetch real data first, fallback to mock if needed
      if (isTestnet) {
        try {
          const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || 'YourApiKeyToken';
          
          console.log('Fetching real testnet transactions from BaseScan API...');
          
          // Fetch normal transactions
          const normalTxResponse = await fetch(
            `${baseScanUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`
          );
          
          if (!normalTxResponse.ok) {
            throw new Error(`BaseScan API error: ${normalTxResponse.status}`);
          }

          const normalTxs = await normalTxResponse.json();
          console.log('Normal transactions response:', normalTxs);

          // Fetch internal transactions
          const internalTxResponse = await fetch(
            `${baseScanUrl}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`
          );

          if (!internalTxResponse.ok) {
            throw new Error(`BaseScan API error: ${internalTxResponse.status}`);
          }

          const internalTxs = await internalTxResponse.json();
          console.log('Internal transactions response:', internalTxs);

          const allTxs = [
            ...(normalTxs.result || []),
            ...(internalTxs.result || [])
          ];

          console.log('Total real transactions found:', allTxs.length);

          if (allTxs.length > 0) {
            // Convert to our transaction format
            const formattedTxs: Transaction[] = allTxs.map((tx: any, index: number) => {
              const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();
              const isOutgoing = tx.from?.toLowerCase() === address.toLowerCase();
              
              let type: 'send' | 'receive' | 'swap' | 'stake' | 'topup' = 'send';
              if (isIncoming && !isOutgoing) type = 'receive';
              else if (isOutgoing && !isIncoming) type = 'send';
              else if (tx.methodId === '0x095ea7b3') type = 'topup'; // approve method
              else if (tx.methodId === '0xa9059cbb') type = 'send'; // transfer method

              return {
                id: tx.hash || `tx-${index}`,
                type,
                amount: tx.value ? (parseFloat(tx.value) / 1e18).toFixed(6) : '0',
                currency: 'ETH',
                from: tx.from || '0x0000000000000000000000000000000000000000',
                to: tx.to || '0x0000000000000000000000000000000000000000',
                status: tx.isError === '1' ? 'failed' : 
                       tx.txreceipt_status === '1' ? 'completed' : 'pending',
                timestamp: new Date(parseInt(tx.timeStamp) * 1000),
                txHash: tx.hash || '',
                gasFee: tx.gasUsed ? (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice) / 1e18).toFixed(6) : '0',
                blockNumber: parseInt(tx.blockNumber),
                isTestnet: true
              };
            });

            console.log('Formatted real transactions:', formattedTxs);
            setTransactions(formattedTxs);
            return;
          }
        } catch (apiError) {
          console.warn('Failed to fetch real transactions, using mock data:', apiError);
        }

        // Fallback to mock data if API fails or no transactions found
        console.log('Creating mock testnet transactions for demonstration');
        const mockTxs: Transaction[] = [
          {
            id: 'mock-1',
            type: 'send',
            amount: '0.005',
            currency: 'ETH',
            from: address,
            to: '0x742d35Cc6548Bb1067b3B0a1e0e2c7B5d3e8F9c4',
            status: 'completed',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            txHash: '0x742d35Cc6548Bb1067b3B0a1e0e2c7B5d3e8F9c4',
            gasFee: '0.000021',
            blockNumber: 1234567,
            isTestnet: true
          },
          {
            id: 'mock-2',
            type: 'receive',
            amount: '0.1',
            currency: 'ETH',
            from: '0x8f9e2d1c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8',
            to: address,
            status: 'completed',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            txHash: '0x8f9e2d1c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8',
            gasFee: '0.000015',
            blockNumber: 1234560,
            isTestnet: true
          },
          {
            id: 'mock-3',
            type: 'topup',
            amount: '0.05',
            currency: 'USDC',
            from: address,
            to: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC contract
            status: 'completed',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
            gasFee: '0.000025',
            blockNumber: 1234500,
            isTestnet: true
          }
        ];
        
        setTransactions(mockTxs);
        return;
      }

      // For mainnet, fetch real data
      const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || 'YourApiKeyToken';
      
      console.log('Fetching from BaseScan API...');
      
      // Fetch normal transactions
      const normalTxResponse = await fetch(
        `${baseScanUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`
      );
      
      if (!normalTxResponse.ok) {
        throw new Error(`BaseScan API error: ${normalTxResponse.status}`);
      }

      const normalTxs = await normalTxResponse.json();
      console.log('Normal transactions response:', normalTxs);

      // Fetch internal transactions
      const internalTxResponse = await fetch(
        `${baseScanUrl}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`
      );

      if (!internalTxResponse.ok) {
        throw new Error(`BaseScan API error: ${internalTxResponse.status}`);
      }

      const internalTxs = await internalTxResponse.json();
      console.log('Internal transactions response:', internalTxs);

      const allTxs = [
        ...(normalTxs.result || []),
        ...(internalTxs.result || [])
      ];

      console.log('Total transactions found:', allTxs.length);

      // Convert to our transaction format
      const formattedTxs: Transaction[] = allTxs.map((tx: any, index: number) => {
        const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();
        const isOutgoing = tx.from?.toLowerCase() === address.toLowerCase();
        
        let type: 'send' | 'receive' | 'swap' | 'stake' | 'topup' = 'send';
        if (isIncoming && !isOutgoing) type = 'receive';
        else if (isOutgoing && !isIncoming) type = 'send';
        else if (tx.methodId === '0x095ea7b3') type = 'topup'; // approve method
        else if (tx.methodId === '0xa9059cbb') type = 'send'; // transfer method

        return {
          id: tx.hash || `tx-${index}`,
          type,
          amount: tx.value ? (parseFloat(tx.value) / 1e18).toFixed(6) : '0',
          currency: 'ETH',
          from: tx.from || '0x0000000000000000000000000000000000000000',
          to: tx.to || '0x0000000000000000000000000000000000000000',
          status: tx.isError === '1' ? 'failed' : 
                 tx.txreceipt_status === '1' ? 'completed' : 'pending',
          timestamp: new Date(parseInt(tx.timeStamp) * 1000),
          txHash: tx.hash || '',
          gasFee: tx.gasUsed ? (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice) / 1e18).toFixed(6) : '0',
          blockNumber: parseInt(tx.blockNumber),
          isTestnet: false
        };
      });

      console.log('Formatted transactions:', formattedTxs);
      setTransactions(formattedTxs);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactionError(`Failed to fetch transactions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Load Base account info when connected
  useEffect(() => {
    if (isConnected && address) {
      loadBaseAccountInfo();
      fetchTransactions(address);
    }
  }, [isConnected, address]);


  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 bg-card flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <CreditCard className="w-6 h-6" />
              <span>Payments</span>
            </h1>
            <p className="text-muted-foreground">
              Send and manage payments using {currentChain.name}
              {currentChain.isTestnet && (
                <span className="ml-2 text-yellow-600 font-medium">(Testnet)</span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isBaseNetwork ? "default" : "destructive"} 
              className="flex items-center space-x-1"
            >
              <Wallet className="w-3 h-3" />
              <span>{currentChain.name}</span>
            </Badge>
            {!isBaseNetwork && (
              <Button size="sm" onClick={handleSwitchToBase}>
                Switch to Base
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex min-h-full">
          {/* Balance Display */}
          <div className="w-80 border-r border-border p-4 bg-muted/20 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4" />
                  <span>Balances</span>
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={refreshBalances}
                  disabled={balancesLoading}
                >
                  <RefreshCw className={`w-3 h-3 ${balancesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balancesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div key={balance.symbol} className="flex items-center justify-between p-2 bg-card rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">{balance.symbol}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatAmount(balance.balance, 4)}
                      </span>
                    </div>
                  ))}
                  {balances.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No balances found
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Base Account Status */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4" />
                  <span>Base Account</span>
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={loadBaseAccountInfo}
                  disabled={isLoadingAccount}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingAccount ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <CardDescription>
                Your smart contract account for seamless payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAccount ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : baseAccountInfo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Account Active</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Smart Account
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Account Address:</span>
                      <span className="font-mono text-xs">
                        {formatAddress(baseAccountInfo.address || '0x...')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Owner:</span>
                      <span className="font-mono text-xs">
                        {formatAddress(baseAccountInfo.owner || address || '0x...')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Features:</span>
                      <div className="flex space-x-1">
                        <Badge variant="outline" className="text-xs">Gasless</Badge>
                        <Badge variant="outline" className="text-xs">Batch</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">Base account will be created automatically when you send your first payment</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Send Payment Form */}
        <div className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Send Payment</span>
              </CardTitle>
              <CardDescription>
                Send payments to ENS addresses or wallet addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">Please connect your wallet to send payments</p>
                  </div>
                </div>
              )}

              {isConnected && !isBaseNetwork && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-800">
                      Please switch to Base network to send payments
                    </p>
                  </div>
                </div>
              )}

              {isConnected && isBaseNetwork && currentChain.isTestnet && (
                <></>
            )}

              {payError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-800">{payError}</p>
                  </div>
                </div>
              )}


              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    placeholder="Enter ENS name or wallet address"
                    value={formData.recipient}
                    onChange={(e) => handleInputChange('recipient', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="token">Token</Label>
                    <Select value={formData.token} onValueChange={(value: string) => handleInputChange('token', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Input
                    id="message"
                    placeholder="Add a note to your payment"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm text-green-800">{success}</p>
                        {txHash && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs text-green-600">Transaction:</span>
                            <a
                              href={getTransactionUrl(txHash, chainId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 flex items-center space-x-1"
                            >
                              <span>{formatAddress(txHash)}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSendPayment}
                  disabled={!isConnected || !isBaseNetwork || isProcessing || !formData.recipient || !formData.amount}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Payment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
