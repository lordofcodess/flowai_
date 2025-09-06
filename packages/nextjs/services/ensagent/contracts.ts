// ENS Contract Interaction Module
import { ethers } from 'ethers';
import { CONTRACT_ABIS } from '../../abis/contracts';
import { SEPOLIA_NETWORK } from '../../abis/constants';
import { ENSAgentConfig, ENSOperation, ENSAgentResponse } from './types';

export class ENSContractManager {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;
  private config: ENSAgentConfig;

  constructor(provider: ethers.Provider, config?: Partial<ENSAgentConfig>) {
    this.provider = provider;
    this.config = {
      network: SEPOLIA_NETWORK,
      contracts: SEPOLIA_NETWORK.ensContracts,
      settings: {
        defaultResolver: SEPOLIA_NETWORK.ensContracts.PublicResolver,
        supportedTLDs: ['.eth', '.test'],
        maxNameLength: 50,
        registrationPrice: '0.01',
        minCommitmentAge: 60,
        minRegistrationDuration: 28 * 24 * 60 * 60
      },
      ...config
          };
    console.log(`ENS Contract Manager initialized with RPC: ${this.config.network.rpcUrl}`);
  }

  setSigner(signer: ethers.Signer) {
    this.signer = signer;
  }

  // ENS Registry Contract
  private getENSRegistry() {
    console.log(`Creating ENS Registry contract with address: ${this.config.contracts.ENSRegistry}`);
    console.log(`Provider: ${this.provider}`);
    console.log(`Signer: ${this.signer}`);
    return new ethers.Contract(
      this.config.contracts.ENSRegistry,
      CONTRACT_ABIS.ENSRegistry,
      this.signer || this.provider
    );
  }

  // Base Registrar Contract
  private getBaseRegistrar() {
    return new ethers.Contract(
      this.config.contracts.BaseRegistrar,
      CONTRACT_ABIS.BaseRegistrar,
      this.signer || this.provider
    );
  }

  // ETH Registrar Controller Contract
  private getETHRegistrarController() {
    return new ethers.Contract(
      this.config.contracts.ETHRegistrarController,
      CONTRACT_ABIS.ETHRegistrarController,
      this.signer || this.provider
    );
  }

  // Public Resolver Contract
  private getPublicResolver() {
    return new ethers.Contract(
      this.config.contracts.PublicResolver,
      CONTRACT_ABIS.PublicResolver,
      this.signer || this.provider
    );
  }

  // Reverse Registrar Contract
  private getReverseRegistrar() {
    return new ethers.Contract(
      this.config.contracts.ReverseRegistrar,
      CONTRACT_ABIS.ReverseRegistrar,
      this.signer || this.provider
    );
  }

  // Universal Resolver Contract
  private getUniversalResolver() {
    return new ethers.Contract(
      this.config.contracts.UniversalResolver,
      CONTRACT_ABIS.UniversalResolver,
      this.signer || this.provider
    );
  }

  /**
   * Check if a name is available for registration
   */
  async isNameAvailable(name: string): Promise<ENSAgentResponse> {
    try {
      const controller = this.getETHRegistrarController();
      const label = name.split('.')[0];
      const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
      
      const available = await controller.available(label);
      
      return {
        success: true,
        data: { available },
        message: available ? 'Name is available' : 'Name is not available'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check name availability: ${error}`
      };
    }
  }

  /**
   * Get the owner of a name
   */
  async getOwner(name: string): Promise<ENSAgentResponse> {
    try {
      console.log(`Getting owner for: ${name}`);
      const registry = this.getENSRegistry();
      const node = ethers.namehash(name);
      console.log(`Node hash: ${node}`);
      console.log(`Registry address: ${this.config.contracts.ENSRegistry}`);
      const owner = await registry.owner(node);
      console.log(`Owner: ${owner}`);
      
      return {
        success: true,
        data: { owner },
        message: `Owner: ${owner}`
      };
    } catch (error) {
      console.error(`Failed to get owner for ${name}:`, error);
      return {
        success: false,
        error: `Failed to get owner: ${error}`
      };
    }
  }

  /**
   * Get the resolver for a name
   */
  async getResolver(name: string): Promise<ENSAgentResponse> {
    try {
      const registry = this.getENSRegistry();
      const node = ethers.namehash(name);
      const resolver = await registry.resolver(node);
      
      return {
        success: true,
        data: { resolver },
        message: `Resolver: ${resolver}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get resolver: ${error}`
      };
    }
  }

  /**
   * Resolve a name to an address
   */
  async resolveName(name: string): Promise<ENSAgentResponse> {
    try {
      // Try Universal Resolver first
      try {
        const universalResolver = this.getUniversalResolver();
        const address = await universalResolver.resolve(name);
        
        if (address && address !== '0x0000000000000000000000000000000000000000') {
          return {
            success: true,
            data: { address },
            message: `${name} resolves to ${address}`
          };
        }
      } catch (universalError) {
        console.log('Universal resolver failed, trying standard resolver:', universalError);
      }

      // Fallback to standard resolver
      const resolver = this.getPublicResolver();
      const node = ethers.namehash(name);
      const address = await resolver.addr(node);
      
      return {
        success: true,
        data: { address },
        message: `${name} resolves to ${address}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to resolve name: ${error}`
      };
    }
  }

  /**
   * Resolve an address to a name (reverse lookup)
   */
  async resolveAddress(address: string): Promise<ENSAgentResponse> {
    try {
      const reverseRegistrar = this.getReverseRegistrar();
      const name = await reverseRegistrar.defaultReverseResolver(address);
      
      return {
        success: true,
        data: { name },
        message: `${address} resolves to ${name || 'No reverse record'}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to resolve address: ${error}`
      };
    }
  }

  /**
   * Get a text record for a name
   */
  async getTextRecord(name: string, key: string): Promise<ENSAgentResponse> {
    try {
      const resolver = this.getPublicResolver();
      const node = ethers.namehash(name);
      const value = await resolver.text(node, key);
      
      return {
        success: true,
        data: { key, value },
        message: `${key}: ${value}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get text record: ${error}`
      };
    }
  }

  /**
   * Get an address record for a name
   */
  async getAddressRecord(name: string, coinType: number = 60): Promise<ENSAgentResponse> {
    try {
      const resolver = this.getPublicResolver();
      const node = ethers.namehash(name);
      const address = await resolver.addr(node, coinType);
      
      return {
        success: true,
        data: { coinType, address },
        message: `Address (${coinType}): ${address}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get address record: ${error}`
      };
    }
  }

  /**
   * Set a text record for a name
   */
  async setTextRecord(name: string, key: string, value: string): Promise<ENSAgentResponse> {
    try {
      if (!this.signer) {
        return {
          success: false,
          error: 'Signer required for setting records'
        };
      }

      const resolver = this.getPublicResolver();
      const node = ethers.namehash(name);
      
      const tx = await resolver.setText(node, key, value);
      await tx.wait();
      
      return {
        success: true,
        data: { key, value, txHash: tx.hash },
        message: `Set ${key} to ${value}`,
        transaction: {
          hash: tx.hash,
          operation: { type: 'setRecord', name, data: { key, value } },
          status: 'confirmed',
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set text record: ${error}`
      };
    }
  }

  /**
   * Set an address record for a name
   */
  async setAddressRecord(name: string, address: string, coinType: number = 60): Promise<ENSAgentResponse> {
    try {
      if (!this.signer) {
        return {
          success: false,
          error: 'Signer required for setting records'
        };
      }

      const resolver = this.getPublicResolver();
      const node = ethers.namehash(name);
      
      const tx = await resolver.setAddr(node, coinType, address);
      await tx.wait();
      
      return {
        success: true,
        data: { coinType, address, txHash: tx.hash },
        message: `Set address (${coinType}) to ${address}`,
        transaction: {
          hash: tx.hash,
          operation: { type: 'setRecord', name, data: { coinType, address } },
          status: 'confirmed',
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set address record: ${error}`
      };
    }
  }

  /**
   * Set the resolver for a name
   */
  async setResolver(name: string, resolverAddress: string): Promise<ENSAgentResponse> {
    try {
      if (!this.signer) {
        return {
          success: false,
          error: 'Signer required for setting resolver'
        };
      }

      const registry = this.getENSRegistry();
      const node = ethers.namehash(name);
      
      const tx = await registry.setResolver(node, resolverAddress);
      await tx.wait();
      
      return {
        success: true,
        data: { resolver: resolverAddress, txHash: tx.hash },
        message: `Set resolver to ${resolverAddress}`,
        transaction: {
          hash: tx.hash,
          operation: { type: 'setResolver', name, data: { resolver: resolverAddress } },
          status: 'confirmed',
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set resolver: ${error}`
      };
    }
  }

  /**
   * Create a commitment for name registration
   */
  async createCommitment(name: string, owner: string, secret: string): Promise<ENSAgentResponse> {
    try {
      const controller = this.getETHRegistrarController();
      const label = name.split('.')[0];
      const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
      
      const commitment = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'address', 'bytes32'],
          [labelHash, owner, secret]
        )
      );
      
      return {
        success: true,
        data: { commitment, secret },
        message: 'Commitment created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create commitment: ${error}`
      };
    }
  }

  /**
   * Register a name
   */
  async registerName(name: string, owner: string, duration: number, secret: string): Promise<ENSAgentResponse> {
    try {
      if (!this.signer) {
        return {
          success: false,
          error: 'Signer required for registration'
        };
      }

      const controller = this.getETHRegistrarController();
      const label = name.split('.')[0];
      const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
      
      // Calculate price
      const price = await controller.rentPrice(label, duration);
      
      // Create commitment
      const commitment = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'address', 'bytes32'],
          [labelHash, owner, secret]
        )
      );
      
      const tx = await controller.register(label, owner, duration, secret, [], true, {
        value: price.base + price.premium
      });
      
      await tx.wait();
      
      return {
        success: true,
        data: { name, owner, duration, txHash: tx.hash },
        message: `Registered ${name} for ${owner}`,
        transaction: {
          hash: tx.hash,
          operation: { type: 'register', name, data: { owner, duration } },
          status: 'confirmed',
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to register name: ${error}`
      };
    }
  }

  /**
   * Renew a name
   */
  async renewName(name: string, duration: number): Promise<ENSAgentResponse> {
    try {
      if (!this.signer) {
        return {
          success: false,
          error: 'Signer required for renewal'
        };
      }

      const controller = this.getETHRegistrarController();
      const label = name.split('.')[0];
      const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
      
      const price = await controller.rentPrice(label, duration);
      
      const tx = await controller.renew(label, duration, {
        value: price.base + price.premium
      });
      
      await tx.wait();
      
      return {
        success: true,
        data: { name, duration, txHash: tx.hash },
        message: `Renewed ${name} for ${duration} seconds`,
        transaction: {
          hash: tx.hash,
          operation: { type: 'renew', name, data: { duration } },
          status: 'confirmed',
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to renew name: ${error}`
      };
    }
  }

  /**
   * Get price for a name registration
   */
  async getPrice(name: string, duration: number): Promise<ENSAgentResponse> {
    try {
      const controller = this.getETHRegistrarController();
      const label = name.split('.')[0];
      
      const price = await controller.rentPrice(label, duration);
      
      return {
        success: true,
        data: {
          name,
          duration,
          base: ethers.formatEther(price.base),
          premium: ethers.formatEther(price.premium),
          total: ethers.formatEther(price.base + price.premium)
        },
        message: `Price calculated for ${name}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get price: ${error}`
      };
    }
  }

  /**
   * Transfer ownership of a name
   */
  async transferName(name: string, newOwner: string): Promise<ENSAgentResponse> {
    try {
      if (!this.signer) {
        return {
          success: false,
          error: 'Signer required for transfer'
        };
      }

      const registry = this.getENSRegistry();
      const node = ethers.namehash(name);
      
      const tx = await registry.setOwner(node, newOwner);
      await tx.wait();
      
      return {
        success: true,
        data: { name, newOwner, txHash: tx.hash },
        message: `Transferred ${name} to ${newOwner}`,
        transaction: {
          hash: tx.hash,
          operation: { type: 'transfer', name, data: { newOwner } },
          status: 'confirmed',
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to transfer name: ${error}`
      };
    }
  }

  /**
   * Get comprehensive name information
   */
  async getNameInfo(name: string): Promise<ENSAgentResponse> {
    try {
      console.log(`Getting name info for: ${name}`);
      
      // Test basic connection first
      try {
        const blockNumber = await this.provider.getBlockNumber();
        console.log(`Connected to network, block number: ${blockNumber}`);
      } catch (error) {
        console.error('Failed to connect to network:', error);
        return {
          success: false,
          error: `Network connection failed: ${error}`
        };
      }

      const [ownerRes, resolverRes, availableRes, addressRes] = await Promise.all([
        this.getOwner(name),
        this.getResolver(name),
        this.isNameAvailable(name),
        this.getAddressRecord(name, 60) // Get ETH address
      ]);

      const info: any = {
        name,
        node: ethers.namehash(name),
        owner: ownerRes.data?.owner || '0x0000000000000000000000000000000000000000',
        resolver: resolverRes.data?.resolver || '0x0000000000000000000000000000000000000000',
        available: availableRes.data?.available || false,
        isRegistered: ownerRes.data?.owner !== '0x0000000000000000000000000000000000000000',
        addresses: {},
        textRecords: {}
      };

      // Get ETH address if available
      if (addressRes.success && addressRes.data?.address && addressRes.data.address !== '0x0000000000000000000000000000000000000000') {
        info.addresses['60'] = addressRes.data.address;
      }

      // Get common text records
      const textKeys = ['description', 'url', 'email', 'avatar', 'notice', 'keywords', 'com.twitter', 'com.github'];
      const textPromises = textKeys.map(key => this.getTextRecord(name, key));
      const textResults = await Promise.all(textPromises);

      textResults.forEach((result, index) => {
        if (result.success && result.data?.value && result.data.value !== '') {
          info.textRecords[textKeys[index]] = result.data.value;
        }
      });

      // Get expiration if it's a .eth name
      if (name.endsWith('.eth')) {
        try {
          const baseRegistrar = this.getBaseRegistrar();
          const labelHash = ethers.keccak256(ethers.toUtf8Bytes(name.split('.')[0]));
          const expiry = await baseRegistrar.nameExpires(labelHash);
          if (expiry && expiry > 0) {
            info.expiration = expiry.toString();
          }
        } catch (error) {
          console.log('Could not get expiration:', error);
        }
      }

      return {
        success: true,
        data: info,
        message: `Name info retrieved for ${name}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get name info: ${error}`
      };
    }
  }
}
