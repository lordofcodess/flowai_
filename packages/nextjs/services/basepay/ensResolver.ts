import { ethers } from 'ethers';

export interface ENSResolutionData {
  address?: string;
  name: string;
  owner?: string;
  resolver?: string;
  expires?: number;
  textRecords?: {
    [key: string]: string;
  };
  contentHash?: string;
  avatar?: string;
  email?: string;
  url?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  description?: string;
}

export interface ENSResolutionResponse {
  success: boolean;
  data?: ENSResolutionData;
  error?: string;
}

// ENS Resolution for Payment System
export class PaymentENSResolver {
  private provider: ethers.Provider;
  private ensContracts: {
    ENSRegistry: string;
    PublicResolver: string;
    UniversalResolver: string;
    BaseRegistrar: string;
  };

  constructor() {
    // Use Sepolia for ENS resolution (same as your existing ENS system)
    this.provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/__krcmuK9Ex84Kfc9l765YL9ljhsIYmJ');
    this.ensContracts = {
      ENSRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      PublicResolver: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD', // Sepolia PublicResolver
      UniversalResolver: '0x3c85752a5d47DD09D677C645Ff2A938B38fbFEbA',
      BaseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85' // Sepolia BaseRegistrar
    };
  }

  /**
   * Resolve ENS name to address
   */
  async resolveENSName(name: string): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      if (!this.isValidENSName(name)) {
        return {
          success: false,
          error: `Invalid ENS name format: ${name}`
        };
      }

      console.log(`Resolving ENS name: ${name}`);

      // Try Universal Resolver first
      try {
        const universalResolverABI = [
          'function resolve(bytes calldata name, bytes calldata data) external view returns (bytes memory, address)'
        ];
        
        const universalResolver = new ethers.Contract(
          this.ensContracts.UniversalResolver,
          universalResolverABI,
          this.provider
        );

        // Encode the name
        const encodedName = ethers.dnsEncode(name);
        // Encode the addr(bytes32) function call
        const addrSelector = ethers.id('addr(bytes32)').slice(0, 10);
        const node = ethers.namehash(name);
        const data = addrSelector + node.slice(2);

        const [result] = await universalResolver.resolve(encodedName, data);
        
        if (result && result !== '0x') {
          // Decode the address from the result
          const address = ethers.getAddress('0x' + result.slice(-40));
          
          if (address && address !== '0x0000000000000000000000000000000000000000') {
            console.log(`ENS resolved ${name} -> ${address} (Universal Resolver)`);
            return {
              success: true,
              address
            };
          }
        }
      } catch (universalError) {
        console.log('Universal resolver failed, trying standard resolver:', universalError);
      }

      // Fallback to standard resolver
      const publicResolverABI = [
        'function addr(bytes32 node) external view returns (address)'
      ];
      
      const publicResolver = new ethers.Contract(
        this.ensContracts.PublicResolver,
        publicResolverABI,
        this.provider
      );

      const node = ethers.namehash(name);
      const address = await publicResolver.addr(node);
      
      if (address && address !== '0x0000000000000000000000000000000000000000') {
        console.log(`ENS resolved ${name} -> ${address} (Standard Resolver)`);
        return {
          success: true,
          address
        };
      }

      return {
        success: false,
        error: `ENS name ${name} does not resolve to an address`
      };

    } catch (error) {
      console.error('ENS resolution error:', error);
      return {
        success: false,
        error: `Failed to resolve ENS name: ${error}`
      };
    }
  }

  /**
   * Get comprehensive ENS information including text records
   */
  async resolveENSDetails(name: string): Promise<ENSResolutionResponse> {
    try {
      if (!this.isValidENSName(name)) {
        return {
          success: false,
          error: `Invalid ENS name format: ${name}`
        };
      }

      console.log(`Getting detailed ENS info for: ${name}`);

      const data: ENSResolutionData = {
        name
      };

      // First resolve the address
      const addressResolution = await this.resolveENSName(name);
      if (addressResolution.success && addressResolution.address) {
        data.address = addressResolution.address;
      }

      // Get the resolver
      const node = ethers.namehash(name);
      const ensRegistryABI = [
        'function resolver(bytes32 node) external view returns (address)',
        'function owner(bytes32 node) external view returns (address)'
      ];
      
      const ensRegistry = new ethers.Contract(
        this.ensContracts.ENSRegistry,
        ensRegistryABI,
        this.provider
      );

      try {
        data.resolver = await ensRegistry.resolver(node);
        data.owner = await ensRegistry.owner(node);
      } catch (error) {
        console.log('Error getting resolver/owner:', error);
      }

      // If we have a resolver, get text records
      if (data.resolver && data.resolver !== '0x0000000000000000000000000000000000000000') {
        const textRecords = await this.getTextRecords(name, data.resolver);
        data.textRecords = textRecords;
        
        // Extract common text records
        data.avatar = textRecords['avatar'] || undefined;
        data.email = textRecords['email'] || undefined;
        data.url = textRecords['url'] || undefined;
        data.twitter = textRecords['com.twitter'] || textRecords['twitter'] || undefined;
        data.github = textRecords['com.github'] || textRecords['github'] || undefined;
        data.discord = textRecords['com.discord'] || textRecords['discord'] || undefined;
        data.telegram = textRecords['org.telegram'] || textRecords['telegram'] || undefined;
        data.description = textRecords['description'] || undefined;
        
        // Get content hash if available
        try {
          const contentHash = await this.getContentHash(name, data.resolver);
          if (contentHash) {
            data.contentHash = contentHash;
          }
        } catch (error) {
          console.log('Error getting content hash:', error);
        }
      }

      // Get expiry info for .eth names
      if (name.endsWith('.eth')) {
        try {
          const label = name.replace('.eth', '');
          const labelHash = ethers.id(label);
          const tokenId = ethers.toBigInt(labelHash);
          
          const baseRegistrarABI = [
            'function nameExpires(uint256 id) external view returns (uint256)',
            'function ownerOf(uint256 tokenId) external view returns (address)'
          ];
          
          const baseRegistrar = new ethers.Contract(
            this.ensContracts.BaseRegistrar,
            baseRegistrarABI,
            this.provider
          );

          data.expires = Number(await baseRegistrar.nameExpires(tokenId));
          
          // Get the actual NFT owner (might be different from ENS owner)
          try {
            const nftOwner = await baseRegistrar.ownerOf(tokenId);
            if (nftOwner !== data.owner) {
              data.owner = nftOwner;
            }
          } catch (error) {
            console.log('Error getting NFT owner:', error);
          }
        } catch (error) {
          console.log('Error getting expiry info:', error);
        }
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Error getting ENS details:', error);
      return {
        success: false,
        error: `Failed to get ENS details: ${error}`
      };
    }
  }

  /**
   * Get text records for an ENS name
   */
  private async getTextRecords(name: string, resolverAddress: string): Promise<{[key: string]: string}> {
    const textKeys = [
      'avatar', 'description', 'display', 'email', 'keywords', 'mail', 'notice', 'location', 'phone', 'url',
      'com.github', 'com.peepeth', 'com.linkedin', 'com.twitter', 'com.discord', 'org.telegram'
    ];

    const resolverABI = [
      'function text(bytes32 node, string calldata key) external view returns (string memory)'
    ];

    const resolver = new ethers.Contract(resolverAddress, resolverABI, this.provider);
    const node = ethers.namehash(name);
    const records: {[key: string]: string} = {};

    // Get all text records in parallel
    const promises = textKeys.map(async (key) => {
      try {
        const value = await resolver.text(node, key);
        if (value && value.trim() !== '') {
          records[key] = value;
        }
      } catch (error) {
        // Ignore errors for individual keys
        console.log(`No text record for ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    return records;
  }

  /**
   * Get content hash for an ENS name
   */
  private async getContentHash(name: string, resolverAddress: string): Promise<string | null> {
    try {
      const resolverABI = [
        'function contenthash(bytes32 node) external view returns (bytes memory)'
      ];

      const resolver = new ethers.Contract(resolverAddress, resolverABI, this.provider);
      const node = ethers.namehash(name);
      const contentHash = await resolver.contenthash(node);

      if (contentHash && contentHash !== '0x') {
        return contentHash;
      }
      return null;
    } catch (error) {
      console.log('Error getting content hash:', error);
      return null;
    }
  }

  /**
   * Check if a string is a valid ENS name
   */
  private isValidENSName(name: string): boolean {
    // Basic ENS name validation
    return /^[a-z0-9-]+\.eth$/i.test(name) || /^[a-z0-9-]+\.test$/i.test(name);
  }

  /**
   * Check if a string looks like an ENS name (for detection)
   */
  static isENSName(input: string): boolean {
    return /^[a-z0-9-]+\.(eth|test)$/i.test(input);
  }

  /**
   * Extract ENS name from a message
   */
  static extractENSName(message: string): string | null {
    // Look for ENS names in the message
    const ensPattern = /([a-z0-9-]+\.(eth|test))/gi;
    const match = message.match(ensPattern);
    return match ? match[0].toLowerCase() : null;
  }
}

// Create singleton instance
export const paymentENSResolver = new PaymentENSResolver();
