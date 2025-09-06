import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccount, useChainId } from "wagmi";
import { useBasePay } from "@/hooks/useBasePay";
import { getTransactionUrl } from "@/abis/contracts/base/constants";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  RefreshCw,
  Loader2
} from "lucide-react";

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

const Transactions = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { getBaseAccountInfo, formatAddress, currentChain, getTestnetETH } = useBasePay();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [baseAccountInfo, setBaseAccountInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.txHash.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'send': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'receive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'swap': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'stake': return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default: return <Wallet className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Fetch transactions from BaseScan API
  const fetchTransactions = async (address: string) => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const isTestnet = chainId === 84532; // Base Sepolia
      const baseScanUrl = isTestnet 
        ? 'https://api-sepolia.basescan.org/api'
        : 'https://api.basescan.org/api';
      
      console.log('Fetching transactions for:', address);
      console.log('Using BaseScan URL:', baseScanUrl);
      console.log('Is testnet:', isTestnet);

      // For testnet, create some mock transactions for demonstration
      if (isTestnet) {
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
        setIsLoading(false);
        return;
      }

      // For mainnet, try to fetch real data
      const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || 'YourApiKeyToken';
      
      console.log('Fetching from BaseScan API...');
      
      // Fetch normal transactions
      const normalTxResponse = await fetch(
        `${baseScanUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${apiKey}`
      );
      
      if (!normalTxResponse.ok) {
        throw new Error(`BaseScan API error: ${normalTxResponse.status}`);
      }

      const normalTxs = await normalTxResponse.json();
      console.log('Normal transactions response:', normalTxs);

      // Fetch internal transactions
      const internalTxResponse = await fetch(
        `${baseScanUrl}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${apiKey}`
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
          isTestnet
        };
      });

      console.log('Formatted transactions:', formattedTxs);
      setTransactions(formattedTxs);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(`Failed to fetch transactions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Base account info
  const loadBaseAccountInfo = async () => {
    if (!isConnected || !address) return;
    
    try {
      const info = await getBaseAccountInfo();
      setBaseAccountInfo(info);
    } catch (error) {
      console.error('Error loading Base account info:', error);
    }
  };

  // Load transactions when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions(address);
      loadBaseAccountInfo();
    }
  }, [isConnected, address, chainId]);

  // Auto-refresh transactions every 30 seconds
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchTransactions(address);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, address]);

  // Refresh transactions
  const refreshTransactions = () => {
    if (address) {
      fetchTransactions(address);
    }
  };

  // Add a new transaction to the list (for real-time updates)
  const addTransaction = (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);
  };

  // Listen for new transactions from the payment system
  useEffect(() => {
    const handleNewTransaction = (event: CustomEvent) => {
      const transaction = event.detail;
      if (transaction) {
        addTransaction(transaction);
      }
    };

    window.addEventListener('newTransaction', handleNewTransaction as EventListener);
    return () => {
      window.removeEventListener('newTransaction', handleNewTransaction as EventListener);
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 bg-card flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">
              {isConnected ? `Viewing transactions for ${formatAddress(address || '')}` : 'Connect wallet to view transactions'}
              {currentChain.isTestnet && ' (Testnet)'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={refreshTransactions}
              disabled={isLoading || !isConnected}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {currentChain.isTestnet && (
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('Adding test transaction...');
                  const testTx = {
                    id: `test-${Date.now()}`,
                    type: 'send' as const,
                    amount: '0.001',
                    currency: 'ETH',
                    from: address || '0x0000000000000000000000000000000000000000',
                    to: '0x742d35Cc6548Bb1067b3B0a1e0e2c7B5d3e8F9c4',
                    status: 'completed' as const,
                    timestamp: new Date(),
                    txHash: `0x${Math.random().toString(16).substr(2, 40)}`,
                    gasFee: '0.000021',
                    blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
                    isTestnet: true
                  };
                  addTransaction(testTx);
                }}
                className="flex items-center space-x-2"
              >
                <Wallet className="w-4 h-4" />
                Add Test TX
              </Button>
            )}
            <Button className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-4 py-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search transactions, addresses, or TX hashes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="send">Send</SelectItem>
              <SelectItem value="receive">Receive</SelectItem>
              <SelectItem value="swap">Swap</SelectItem>
              <SelectItem value="stake">Stake</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="max-w-6xl mx-auto w-full space-y-4">
          {!isConnected ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground text-center">
                  Connect your wallet to view your transaction history
                </p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading Transactions</h3>
                <p className="text-muted-foreground text-center">
                  Fetching your transaction history from BaseScan...
                </p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Transactions</h3>
                <p className="text-muted-foreground text-center mb-4">{error}</p>
                <Button onClick={refreshTransactions} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {currentChain.isTestnet 
                    ? 'No transactions found on Base Sepolia testnet. Try sending a test transaction!'
                    : 'No transactions found for this address.'
                  }
                </p>
                {currentChain.isTestnet && (
                  <Button 
                    onClick={async () => {
                      if (address) {
                        try {
                          await getTestnetETH(address);
                          alert('Testnet ETH requested! Check your wallet in a few minutes.');
                        } catch (error) {
                          console.error('Error getting testnet ETH:', error);
                        }
                      }
                    }}
                    variant="outline"
                  >
                    Get Testnet ETH
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map((tx) => (
            <Card key={tx.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(tx.type)}
                    <div>
                      <CardTitle className="text-lg capitalize">{tx.type}</CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        {formatTime(tx.timestamp)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(tx.status)}>
                      {tx.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {tx.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {tx.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                      {tx.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (tx.txHash) {
                          window.open(getTransactionUrl(tx.txHash, chainId), '_blank');
                        }
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-lg font-semibold">
                      {parseFloat(tx.amount) > 0 ? `${tx.amount} ${tx.currency}` : '0 ETH'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">From</p>
                    <p className="text-sm font-mono">{formatAddress(tx.from)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">To</p>
                    <p className="text-sm font-mono">{formatAddress(tx.to)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      {tx.blockNumber && <span>Block: {tx.blockNumber.toLocaleString()}</span>}
                      <span>Gas: {tx.gasFee} ETH</span>
                      {tx.isTestnet && (
                        <Badge variant="outline" className="text-xs">
                          Testnet
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 p-2 text-primary"
                      onClick={() => {
                        if (tx.txHash) {
                          window.open(getTransactionUrl(tx.txHash, chainId), '_blank');
                        }
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on BaseScan
                    </Button>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-2">
                    {formatAddress(tx.txHash)}
                  </p>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
