// ENS Agent Utility Functions
import { ethers } from 'ethers';
import { ENSName, ENSRecord, ENSOperation } from './types';

/**
 * Validates ENS name format
 */
export function validateENSName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name must be a non-empty string' };
  }

  // Check if name ends with .eth
  if (!name.endsWith('.eth')) {
    return { valid: false, error: 'Name must end with .eth' };
  }

  // Remove .eth suffix for validation
  const label = name.slice(0, -4);
  
  // Check length
  if (label.length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (label.length > 50) {
    return { valid: false, error: 'Name cannot exceed 50 characters' };
  }

  // Check for valid characters (alphanumeric and hyphens, but not starting/ending with hyphen)
  const validPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!validPattern.test(label)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Converts ENS name to node hash
 */
export function nameToNode(name: string): string {
  try {
    return ethers.namehash(name);
  } catch (error) {
    throw new Error(`Invalid ENS name: ${name}`);
  }
}

/**
 * Converts node hash to ENS name (reverse lookup)
 */
export function nodeToName(node: string): string | null {
  // This is a simplified implementation
  // In practice, you'd need to maintain a mapping or use a service
  return null;
}

/**
 * Generates a random secret for commitment
 */
export function generateSecret(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Creates a commitment hash for name registration
 */
export function createCommitment(name: string, owner: string, secret: string): string {
  const label = name.split('.')[0];
  const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
  const commitment = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'address', 'bytes32'],
      [labelHash, owner, secret]
    )
  );
  return commitment;
}

/**
 * Calculates registration price for a name
 */
export function calculatePrice(name: string, duration: number): string {
  // This is a simplified calculation
  // In practice, you'd query the price oracle
  const basePrice = ethers.parseEther('0.01'); // Base price for .eth
  const length = name.split('.')[0].length;
  
  // Shorter names cost more
  const multiplier = length <= 3 ? 10 : length <= 6 ? 5 : 1;
  
  return (BigInt(basePrice) * BigInt(multiplier) * BigInt(duration)).toString();
}

/**
 * Formats duration in days to seconds
 */
export function daysToSeconds(days: number): number {
  return days * 24 * 60 * 60;
}

/**
 * Formats seconds to human readable duration
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

/**
 * Validates Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Normalizes ENS name (lowercase, trim)
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Checks if name is a subdomain
 */
export function isSubdomain(name: string): boolean {
  return name.split('.').length > 2;
}

/**
 * Gets parent domain of a subdomain
 */
export function getParentDomain(name: string): string {
  const parts = name.split('.');
  if (parts.length <= 2) return name;
  return parts.slice(1).join('.');
}

/**
 * Validates record type
 */
export function isValidRecordType(recordType: string): boolean {
  const validTypes = [
    'A', 'AAAA', 'CNAME', 'TXT', 'SRV', 'MX', 'NS',
    'ETH', 'BTC', 'LTC', 'DOGE', 'XRP', 'ADA', 'DOT',
    'email', 'url', 'avatar', 'description', 'notice',
    'keywords', 'com.twitter', 'com.github', 'com.reddit'
  ];
  return validTypes.includes(recordType);
}

/**
 * Encodes record value based on type
 */
export function encodeRecordValue(recordType: string, value: string): string {
  switch (recordType) {
    case 'A':
    case 'AAAA':
      return ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [value]);
    case 'TXT':
      return ethers.AbiCoder.defaultAbiCoder().encode(['string'], [value]);
    case 'ETH':
      return value; // Already an address
    default:
      return value;
  }
}

/**
 * Decodes record value based on type
 */
export function decodeRecordValue(recordType: string, value: string): string {
  try {
    switch (recordType) {
      case 'A':
      case 'AAAA':
        return ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], value)[0].toString();
      case 'TXT':
        return ethers.AbiCoder.defaultAbiCoder().decode(['string'], value)[0];
      default:
        return value;
    }
  } catch {
    return value;
  }
}

/**
 * Creates a batch operation
 */
export function createBatchOperation(operations: ENSOperation[]): ENSOperation {
  return {
    type: 'setRecord', // This would be a custom batch type
    name: 'batch',
    data: { operations }
  };
}

/**
 * Estimates gas for an operation
 */
export function estimateGas(operation: ENSOperation): string {
  // This is a simplified gas estimation
  // In practice, you'd call the contract to estimate gas
  const baseGas = 100000;
  const gasByType: Record<string, number> = {
    register: 200000,
    renew: 150000,
    setResolver: 100000,
    setRecord: 120000,
    transfer: 100000,
    resolve: 50000,
    commit: 80000,
    reveal: 150000
  };
  
  return (baseGas + (gasByType[operation.type] || 100000)).toString();
}

/**
 * Formats wei to ETH
 */
export function formatETH(wei: string): string {
  return ethers.formatEther(wei);
}

/**
 * Formats ETH to wei
 */
export function parseETH(eth: string): string {
  return ethers.parseEther(eth).toString();
}

/**
 * Generates a unique operation ID
 */
export function generateOperationId(): string {
  return ethers.hexlify(ethers.randomBytes(16));
}

/**
 * Validates operation data
 */
export function validateOperation(operation: ENSOperation): { valid: boolean; error?: string } {
  if (!operation.type || !operation.name) {
    return { valid: false, error: 'Operation must have type and name' };
  }

  const nameValidation = validateENSName(operation.name);
  if (!nameValidation.valid) {
    return nameValidation;
  }

  return { valid: true };
}
