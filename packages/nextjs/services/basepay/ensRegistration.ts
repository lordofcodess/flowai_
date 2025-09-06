import { ethers } from 'ethers';
import { WalletClient } from 'viem';
import { paymentENSResolver } from './ensResolver';

export interface ENSRegistrationRequest {
  label: string; // The name without .eth (e.g., "alice" for "alice.eth")
  owner: string; // The address that will own the domain
  duration: number; // Duration in seconds (minimum 28 days)
  resolver?: string; // Optional resolver address
  data?: string[]; // Optional resolver data
  reverseRecord?: boolean; // Whether to set reverse record
  secret?: string; // Secret for commitment (auto-generated if not provided)
}

export interface ENSRegistrationResponse {
  success: boolean;
  data?: {
    commitmentHash?: string;
    commitmentTimestamp?: number;
    registrationTx?: string;
    expires?: number;
    totalCost?: string;
    waitTime?: number; // Time to wait before registration in seconds
  };
  error?: string;
  message?: string;
}

export interface ENSAvailabilityResponse {
  success: boolean;
  available?: boolean;
  data?: {
    name: string;
    valid: boolean;
    available: boolean;
    expires?: number;
    owner?: string;
    price?: {
      base: string;
      premium: string;
      total: string;
    };
  };
  error?: string;
}

export class ENSRegistrationService {
  private provider: ethers.Provider;
  private registrarController: ethers.Contract;
  private baseRegistrar: ethers.Contract;
  private priceOracle: ethers.Contract;
  
  // Contract addresses for Sepolia testnet
  private contracts = {
    ETHRegistrarController: '0x114D4603199df73e7D157787f8778E21fCd13066', // Sepolia
    BaseRegistrarImplementation: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85', // Sepolia
    PublicResolver: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD', // Sepolia
    StablePriceOracle: '0x1612A1927B96B2B1a7c5b1F3e3C2C2A8C4C4C4C4' // Placeholder
  };

  // ABIs for the contracts
  private registrarControllerABI = [
    'function available(string calldata label) external view returns (bool)',
    'function rentPrice(string calldata label, uint256 duration) external view returns (tuple(uint256 base, uint256 premium))',
    'function makeCommitment(tuple(string label, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, uint8 reverseRecord, bytes32 referrer) registration) external pure returns (bytes32)',
    'function commit(bytes32 commitment) external',
    'function register(tuple(string label, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, uint8 reverseRecord, bytes32 referrer) registration) external payable',
    'function valid(string calldata label) external pure returns (bool)',
    'function minCommitmentAge() external view returns (uint256)',
    'function maxCommitmentAge() external view returns (uint256)',
    'function commitments(bytes32) external view returns (uint256)',
    'event NameRegistered(string indexed label, bytes32 indexed labelhash, address indexed owner, uint256 baseCost, uint256 premium, uint256 expires, bytes32 referrer)'
  ];

  private baseRegistrarABI = [
    'function available(uint256 id) external view returns (bool)',
    'function nameExpires(uint256 id) external view returns (uint256)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function exists(uint256 tokenId) external view returns (bool)'
  ];

  constructor() {
    // Use Sepolia for ENS operations
    this.provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/__krcmuK9Ex84Kfc9l765YL9ljhsIYmJ');
    
    this.registrarController = new ethers.Contract(
      this.contracts.ETHRegistrarController,
      this.registrarControllerABI,
      this.provider
    );

    this.baseRegistrar = new ethers.Contract(
      this.contracts.BaseRegistrarImplementation,
      this.baseRegistrarABI,
      this.provider
    );
  }

  /**
   * Check if an ENS name is available for registration
   */
  async checkAvailability(name: string): Promise<ENSAvailabilityResponse> {
    try {
      // Remove .eth suffix if present
      const label = name.replace(/\.eth$/, '');
      
      console.log(`Checking availability for: ${label}.eth`);

      // Check if the name is valid (minimum 3 characters)
      const isValid = await this.registrarController.valid(label);
      
      if (!isValid) {
        return {
          success: true,
          available: false,
          data: {
            name: `${label}.eth`,
            valid: false,
            available: false
          }
        };
      }

      // Check if available
      const isAvailable = await this.registrarController.available(label);
      
      // Get additional info if not available
      let owner: string | undefined;
      let expires: number | undefined;
      
      if (!isAvailable) {
        try {
          const labelHash = ethers.id(label);
          const tokenId = ethers.toBigInt(labelHash);
          
          // Check if it exists and get owner
          const exists = await this.baseRegistrar.exists(tokenId);
          if (exists) {
            owner = await this.baseRegistrar.ownerOf(tokenId);
            expires = Number(await this.baseRegistrar.nameExpires(tokenId));
          }
        } catch (error) {
          console.log('Error getting owner/expires info:', error);
        }
      }

      // Get price if available
      let price;
      if (isAvailable) {
        try {
          const duration = 365 * 24 * 60 * 60; // 1 year in seconds
          const priceData = await this.registrarController.rentPrice(label, duration);
          price = {
            base: ethers.formatEther(priceData.base),
            premium: ethers.formatEther(priceData.premium),
            total: ethers.formatEther(priceData.base + priceData.premium)
          };
        } catch (error) {
          console.log('Error getting price:', error);
        }
      }

      return {
        success: true,
        available: isAvailable,
        data: {
          name: `${label}.eth`,
          valid: isValid,
          available: isAvailable,
          owner,
          expires,
          price
        }
      };

    } catch (error) {
      console.error('Error checking ENS availability:', error);
      return {
        success: false,
        error: `Failed to check availability: ${error}`
      };
    }
  }

  /**
   * Register an ENS name (commit-reveal process)
   */
  async registerName(
    request: ENSRegistrationRequest,
    walletClient?: WalletClient
  ): Promise<ENSRegistrationResponse> {
    try {
      if (!walletClient) {
        return {
          success: false,
          error: 'Wallet client required for ENS registration'
        };
      }

      // Validate input
      const label = request.label.replace(/\.eth$/, '');
      
      if (label.length < 3) {
        return {
          success: false,
          error: 'ENS name must be at least 3 characters long'
        };
      }

      // Check if name is available
      const availability = await this.checkAvailability(label);
      if (!availability.success || !availability.available) {
        return {
          success: false,
          error: `Name ${label}.eth is not available for registration`
        };
      }

      // Set minimum duration (28 days)
      const MIN_DURATION = 28 * 24 * 60 * 60; // 28 days in seconds
      const duration = Math.max(request.duration, MIN_DURATION);

      // Generate secret if not provided
      const secret = request.secret ? ethers.id(request.secret) : ethers.randomBytes(32);
      
      // Set default resolver if not provided
      const resolver = request.resolver || this.contracts.PublicResolver;

      // Create registration object
      const registration = {
        label,
        owner: request.owner,
        duration,
        secret,
        resolver,
        data: request.data || [],
        reverseRecord: request.reverseRecord ? 1 : 0,
        referrer: ethers.ZeroHash
      };

      // Step 1: Make commitment
      const commitmentHash = await this.registrarController.makeCommitment(registration);
      
      // Get commitment ages
      const minCommitmentAge = await this.registrarController.minCommitmentAge();
      const waitTime = Number(minCommitmentAge);

      // Check if commitment already exists
      const existingCommitment = await this.registrarController.commitments(commitmentHash);
      if (existingCommitment > 0) {
        const timeSinceCommitment = Math.floor(Date.now() / 1000) - Number(existingCommitment);
        if (timeSinceCommitment >= waitTime) {
          // Commitment is ready, proceed to registration
          return await this.executeRegistration(registration, walletClient);
        } else {
          return {
            success: true,
            data: {
              commitmentHash: commitmentHash,
              commitmentTimestamp: Number(existingCommitment),
              waitTime: waitTime - timeSinceCommitment
            },
            message: `Commitment exists. Wait ${waitTime - timeSinceCommitment} seconds before registration.`
          };
        }
      }

      // Create signer from wallet client
      const account = walletClient.account;
      if (!account) {
        return {
          success: false,
          error: 'No account found in wallet client'
        };
      }

      // Step 2: Submit commitment
      const signer = new ethers.BrowserProvider((walletClient as any).transport).getSigner();
      const registrarWithSigner = this.registrarController.connect(await signer);

      try {
        const commitTx = await registrarWithSigner.commit(commitmentHash);
        await commitTx.wait();

        return {
          success: true,
          data: {
            commitmentHash: commitmentHash,
            commitmentTimestamp: Math.floor(Date.now() / 1000),
            waitTime: waitTime
          },
          message: `Commitment submitted! Wait ${waitTime} seconds (${Math.ceil(waitTime / 60)} minutes) before registration.`
        };

      } catch (error) {
        console.error('Error submitting commitment:', error);
        return {
          success: false,
          error: `Failed to submit commitment: ${error}`
        };
      }

    } catch (error) {
      console.error('Error in ENS registration:', error);
      return {
        success: false,
        error: `Registration failed: ${error}`
      };
    }
  }

  /**
   * Execute the actual registration (after commitment wait time)
   */
  private async executeRegistration(
    registration: any,
    walletClient: WalletClient
  ): Promise<ENSRegistrationResponse> {
    try {
      // Get price for registration
      const priceData = await this.registrarController.rentPrice(
        registration.label,
        registration.duration
      );
      const totalPrice = priceData.base + priceData.premium;

      // Create signer
      const signer = new ethers.BrowserProvider((walletClient as any).transport).getSigner();
      const registrarWithSigner = this.registrarController.connect(await signer);

      // Execute registration
      const registerTx = await registrarWithSigner.register(registration, {
        value: totalPrice
      });

      const receipt = await registerTx.wait();
      
      // Calculate expiry
      const expires = Math.floor(Date.now() / 1000) + registration.duration;

      return {
        success: true,
        data: {
          registrationTx: registerTx.hash,
          expires,
          totalCost: ethers.formatEther(totalPrice)
        },
        message: `Successfully registered ${registration.label}.eth!`
      };

    } catch (error) {
      console.error('Error executing registration:', error);
      return {
        success: false,
        error: `Registration execution failed: ${error}`
      };
    }
  }

  /**
   * Get registration price for a name
   */
  async getRegistrationPrice(label: string, durationInYears: number = 1): Promise<{
    success: boolean;
    price?: { base: string; premium: string; total: string };
    error?: string;
  }> {
    try {
      const cleanLabel = label.replace(/\.eth$/, '');
      const duration = durationInYears * 365 * 24 * 60 * 60; // Convert years to seconds

      const priceData = await this.registrarController.rentPrice(cleanLabel, duration);
      
      return {
        success: true,
        price: {
          base: ethers.formatEther(priceData.base),
          premium: ethers.formatEther(priceData.premium),
          total: ethers.formatEther(priceData.base + priceData.premium)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get price: ${error}`
      };
    }
  }
}

// Create singleton instance
export const ensRegistrationService = new ENSRegistrationService();
