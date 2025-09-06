import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccount, useSignMessage, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { SEPOLIA_NETWORK } from "@/abis/constants";
import { CONTRACT_ABIS } from "@/abis/contracts";
import { useActivities } from "@/hooks/useActivities";
import { 
  Globe, 
  CheckCircle, 
  ArrowRight, 
  Copy, 
  ExternalLink,
  Search,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  Info
} from "lucide-react";

interface EnsRegistration {
  domainName: string;
  duration: number; // in years
  isAvailable: boolean | null;
  price: string;
  gasEstimate: string;
  error: string | null;
}

interface PriceData {
  base: string;
  premium: string;
  total: string;
}

const NewEns = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();
  const { addActivity } = useActivities();
  
  const [formData, setFormData] = useState<EnsRegistration>({
    domainName: '',
    duration: 1,
    isAvailable: null,
    price: '0',
    gasEstimate: '0',
    error: null
  });

  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  const handleInputChange = (field: keyof EnsRegistration, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckAvailability = async () => {
    if (!formData.domainName) return;
    
    setIsChecking(true);
    setFormData(prev => ({ ...prev, error: null }));
    
    try {
      const fullDomainName = `${formData.domainName}.eth`;
      
      // Check availability
      const availabilityResponse = await fetch(`/api/ens/name/${encodeURIComponent(fullDomainName)}/available`);
      const availabilityResult = await availabilityResponse.json();
      
      if (!availabilityResult.success) {
        throw new Error(availabilityResult.error || 'Failed to check availability');
      }
      
      const isAvailable = availabilityResult.data?.available || false;
      
      if (isAvailable) {
        // Get price from API (more reliable than direct contract calls)
        try {
          const priceResponse = await fetch(`/api/ens/name/${encodeURIComponent(fullDomainName)}/price?duration=${formData.duration}`);
          const priceResult = await priceResponse.json();
          
          if (priceResult.success && priceResult.data) {
            const priceInfo = priceResult.data;
            setPriceData(priceInfo);
            setFormData(prev => ({
              ...prev,
              isAvailable,
              price: priceInfo.total || '0',
              gasEstimate: '0.002' // Estimated gas fee
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              isAvailable,
              price: '0.01', // Fallback price
              gasEstimate: '0.002'
            }));
          }
        } catch (apiError) {
          console.error('Error getting price from API:', apiError);
          setFormData(prev => ({
            ...prev,
            isAvailable,
            price: '0.01', // Fallback price
            gasEstimate: '0.002'
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          isAvailable: false,
          price: '0',
          gasEstimate: '0'
        }));
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setFormData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check availability',
        isAvailable: null
      }));
    } finally {
      setIsChecking(false);
    }
  };


  const handleRegister = async () => {
    if (!formData.isAvailable || !address || !isConnected || !walletClient) return;
    
    setIsRegistering(true);
    setFormData(prev => ({ ...prev, error: null }));
    
    try {
      const fullDomainName = `${formData.domainName}.eth`;
      const durationInSeconds = formData.duration * 365 * 24 * 60 * 60;
      
      // Create provider and signer from wallet client
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      
      // Create contract instance
      const controller = new ethers.Contract(
        SEPOLIA_NETWORK.ensContracts.ETHRegistrarController,
        CONTRACT_ABIS.ETHRegistrarController,
        signer
      );
      
      const label = formData.domainName;
      
      // Calculate price - use the price from form data or calculate a reasonable estimate
      let totalPrice;
      if (priceData && priceData.total) {
        // Use the price we already calculated
        totalPrice = ethers.parseEther(priceData.total);
      } else {
        // Fallback: calculate a reasonable price estimate
        // Base price is typically around 0.01 ETH per year
        const basePricePerYear = ethers.parseEther('0.01');
        totalPrice = basePricePerYear * BigInt(formData.duration);
      }
      
      console.log('Using total price for registration:', ethers.formatEther(totalPrice));
      
      // Register the name directly
      const tx = await controller.register(
        label,
        address,
        durationInSeconds,
        ethers.randomBytes(32), // Generate random secret
        [], // Empty data array
        true, // reverseRecord
        {
          value: totalPrice
        }
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      const result = {
        success: true,
        data: {
          name: fullDomainName,
          owner: address,
          duration: durationInSeconds,
          txHash: tx.hash
        },
        message: `Successfully registered ${fullDomainName}`,
        transaction: {
          hash: tx.hash,
          operation: { type: 'register', name: fullDomainName, data: { owner: address, duration: durationInSeconds } },
          status: 'confirmed',
          timestamp: new Date()
        }
      };
      
      setRegistrationResult(result);
      console.log('ENS Registration successful:', result);

      // Add activity for successful registration
      addActivity({
        title: `ENS Registration: ${fullDomainName}`,
        description: `Successfully registered ${fullDomainName} for ${formData.duration} year${formData.duration > 1 ? 's' : ''}`,
        type: 'ens_registration',
        ensName: fullDomainName,
        txHash: tx.hash,
        status: 'completed',
        metadata: {
          duration: formData.duration,
          price: totalPrice.toString(),
        }
      });
      
    } catch (error) {
      console.error('Error registering ENS:', error);
      
      let errorMessage = 'Registration failed';
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient ETH balance for registration';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (error.message.includes('execution reverted')) {
          errorMessage = 'Transaction failed - domain may not be available';
        } else {
          errorMessage = error.message;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        error: errorMessage
      }));
    } finally {
      setIsRegistering(false);
    }
  };

  const formatDomain = (domain: string) => {
    if (!domain) return '';
    return domain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  };

  // Update price when duration changes
  useEffect(() => {
    if (formData.isAvailable && formData.domainName) {
      handleCheckAvailability();
    }
  }, [formData.duration]);

  // Reset form when domain name changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      isAvailable: null,
      price: '0',
      gasEstimate: '0',
      error: null
    }));
    setPriceData(null);
    setRegistrationResult(null);
  }, [formData.domainName]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 bg-card flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Register ENS Domain</h1>
            <p className="text-muted-foreground">Create your Web3 identity with a custom ENS name on Sepolia testnet</p>
            {!isConnected && (
              <div className="flex items-center space-x-2 mt-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Please connect your wallet to register a domain</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Globe className="w-3 h-3" />
              <span>Ethereum Sepolia</span>
            </Badge>
            <Button variant="outline" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              View My Domains
            </Button>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="flex-1 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="max-w-2xl mx-auto w-full space-y-6">
          
          {/* Domain Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Domain Search</span>
              </CardTitle>
              <CardDescription>Enter your desired ENS domain name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domainName">Domain Name</Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="domainName"
                      placeholder="myawesome"
                      className="pl-10 pr-20"
                      value={formData.domainName}
                      onChange={(e) => handleInputChange('domainName', formatDomain(e.target.value))}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      .eth
                    </div>
                  </div>
                  <Button 
                    onClick={handleCheckAvailability}
                    disabled={!formData.domainName || isChecking}
                    className="px-6"
                  >
                    {isChecking ? 'Checking...' : 'Check'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens are allowed
                </p>
              </div>

              {/* Error Display */}
              {formData.error && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 font-medium">Error</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{formData.error}</p>
                </div>
              )}

              {/* Availability Status */}
              {formData.isAvailable !== null && !formData.error && (
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    {formData.isAvailable ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-700 font-medium">Available!</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {formData.domainName}.eth
                        </Badge>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 font-medium">Not Available</span>
                        <Badge variant="destructive">
                          {formData.domainName}.eth
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Registration Success */}
              {registrationResult && (
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700 font-medium">Registration Successful!</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">
                    Your domain {formData.domainName}.eth has been registered successfully.
                  </p>
                  {registrationResult.transaction && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600">
                        Transaction: {registrationResult.transaction.hash}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Details */}
          {formData.isAvailable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Registration Details</span>
                </CardTitle>
                <CardDescription>Configure your domain registration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Registration Duration</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 5].map((years) => (
                      <Button
                        key={years}
                        variant={formData.duration === years ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleInputChange('duration', years)}
                        className="flex flex-col h-auto py-3"
                      >
                        <span className="font-medium">{years} year{years > 1 ? 's' : ''}</span>
                        <span className="text-xs text-muted-foreground">
                          ${(parseFloat(formData.price) * years).toFixed(3)}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  {priceData ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Base Price ({formData.duration} year{formData.duration > 1 ? 's' : ''})</span>
                        <span>{parseFloat(priceData.base).toFixed(6)} ETH</span>
                      </div>
                      {parseFloat(priceData.premium) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Premium</span>
                          <span>{parseFloat(priceData.premium).toFixed(6)} ETH</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Gas Fee (estimated)</span>
                        <span>{formData.gasEstimate} ETH</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-medium">
                        <span>Total</span>
                        <span>{(parseFloat(priceData.total) + parseFloat(formData.gasEstimate)).toFixed(6)} ETH</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>Registration Fee ({formData.duration} year{formData.duration > 1 ? 's' : ''})</span>
                      <span>{formData.price} ETH</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}


          {/* Registration Button */}
          {formData.isAvailable && (
            <div className="flex justify-end space-x-3">
              <Button variant="outline" className="flex items-center space-x-2">
                <Copy className="w-4 h-4" />
                <span>Copy Address</span>
              </Button>
              
              <Button 
                size="lg" 
                className="flex items-center space-x-2"
                onClick={handleRegister}
                disabled={isRegistering || !isConnected || !address || !walletClient}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : !isConnected ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </>
                ) : !walletClient ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Wallet Not Ready</span>
                  </>
                ) : (
                  <>
                    <span>Register Domain</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewEns;
