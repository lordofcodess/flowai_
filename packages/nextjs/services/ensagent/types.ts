// ENS Agent Types and Interfaces
export interface ENSName {
  name: string;
  node: string;
  isAvailable?: boolean;
  isRegistered?: boolean;
  owner?: string;
  resolver?: string;
  ttl?: number;
}

export interface ENSRecord {
  name: string;
  node: string;
  recordType: string;
  value: string;
  ttl?: number;
}

export interface ENSRegistration {
  name: string;
  owner: string;
  resolver: string;
  ttl: number;
  registrationDate: Date;
  expirationDate: Date;
  isExpired: boolean;
}

export interface ENSCommitment {
  name: string;
  commitment: string;
  secret: string;
  commitmentTime: Date;
  canRegister: boolean;
}

export interface ENSPrice {
  name: string;
  price: string;
  duration: number;
  available: boolean;
}

export interface ENSOperation {
  type: 'register' | 'renew' | 'setResolver' | 'setRecord' | 'transfer' | 'resolve' | 'commit' | 'reveal';
  name: string;
  data?: any;
  gasEstimate?: string;
  value?: string;
}

export interface ENSTransaction {
  hash?: string;
  operation?: ENSOperation;
  status?: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  timestamp?: Date;
  type?: string;
  ensName?: string;
  duration?: number;
  cost?: string;
  owner?: string;
  recipientAddress?: string;
  record?: {
    type: string;
    value: string;
  };
}

export interface ENSAgentConfig {
  network: {
    chainId: number;
    name: string;
    rpcUrl: string;
    blockExplorer: string;
  };
  contracts: {
    ENSRegistry: string;
    BaseRegistrar: string;
    ETHRegistrarController: string;
    DNSRegistrar: string;
    ReverseRegistrar: string;
    NameWrapper: string;
    PublicResolver: string;
    UniversalResolver: string;
    OffchainDNSResolver: string;
  };
  settings: {
    defaultResolver: string;
    supportedTLDs: string[];
    maxNameLength: number;
    registrationPrice: string;
    minCommitmentAge: number;
    minRegistrationDuration: number;
  };
}

export interface ENSAgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  transaction?: ENSTransaction;
  message?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  operation?: ENSOperation;
  transaction?: ENSTransaction;
}

export interface ENSAgentCapabilities {
  canRegister: boolean;
  canRenew: boolean;
  canSetResolver: boolean;
  canSetRecords: boolean;
  canTransfer: boolean;
  canResolve: boolean;
  canCommit: boolean;
  canReveal: boolean;
}

export interface ENSNameInfo {
  name: string;
  node: string;
  owner: string;
  resolver: string;
  ttl: number;
  records: ENSRecord[];
  isAvailable: boolean;
  isRegistered: boolean;
  registrationDate?: Date;
  expirationDate?: Date;
  price?: string;
}

export interface ENSBatchOperation {
  operations: ENSOperation[];
  gasEstimate: string;
  totalValue: string;
  canExecute: boolean;
}

export interface ENSAgentStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalGasUsed: string;
  totalValueTransferred: string;
  lastActivity: Date;
}
