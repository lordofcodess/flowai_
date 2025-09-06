// Sepolia Testnet Configuration
export const SEPOLIA_NETWORK = {
  chainId: 11155111,
  name: 'Ethereum Sepolia Testnet',
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/__krcmuK9Ex84Kfc9l765YL9ljhsIYmJ',
  blockExplorer: 'https://sepolia.etherscan.io',
  ensContracts: {
    ENSRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    BaseRegistrar: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
    ETHRegistrarController: '0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968',
    DNSRegistrar: '0x5a07C75Ae469Bf3ee2657B588e8E6ABAC6741b4f',
    ReverseRegistrar: '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6',
    NameWrapper: '0x0635513f179D50A207757E05759CbD106d7dFcE8',
    PublicResolver: '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5',
    UniversalResolver: '0x3c85752a5d47DD09D677C645Ff2A938B38fbFEbA',
    OffchainDNSResolver: '0x179be112b24ad4cfc392ef8924dfa08c20ad8583'
  }
};

// Default network
export const DEFAULT_NETWORK = SEPOLIA_NETWORK;

// ENS settings for Sepolia
export const ENS_SETTINGS = {
  defaultResolver: '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5', // Public Resolver
  supportedTLDs: ['.eth', '.test'],
  maxNameLength: 50,
  registrationPrice: '0.01', // ETH for .eth registration
  minCommitmentAge: 60, // seconds
  minRegistrationDuration: 28 * 24 * 60 * 60 // 28 days in seconds
};

// Gas settings optimized for Sepolia
export const GAS_SETTINGS = {
  defaultGasLimit: 500000,
  maxGasPrice: '20000000000', // 20 gwei
  gasMultiplier: 1.1
};

// Error messages
export const ERROR_MESSAGES = {
  INSUFFICIENT_BALANCE: 'Insufficient balance for transaction',
  TRANSACTION_FAILED: 'Transaction failed',
  NETWORK_ERROR: 'Network connection error',
  CONTRACT_ERROR: 'Smart contract error',
  USER_REJECTED: 'User rejected transaction',
  INVALID_ADDRESS: 'Invalid address format',
  INVALID_AMOUNT: 'Invalid amount',
  ENS_NAME_NOT_AVAILABLE: 'ENS name is not available',
  ENS_NAME_INVALID: 'Invalid ENS name format',
  ENS_COMMITMENT_NOT_READY: 'Commitment not ready, please wait',
  ENS_REGISTRATION_EXPIRED: 'ENS registration has expired'
};

// Success messages
export const SUCCESS_MESSAGES = {
  TRANSACTION_SUCCESS: 'Transaction completed successfully',
  AGENT_CREATED: 'AI Agent created successfully',
  CREDENTIAL_ISSUED: 'Credential issued successfully',
  PAYMENT_SENT: 'Payment sent successfully',
  PROPOSAL_CREATED: 'Proposal created successfully',
  VOTE_CAST: 'Vote cast successfully',
  ENS_NAME_REGISTERED: 'ENS name registered successfully',
  ENS_NAME_COMMITTED: 'ENS name commitment created successfully',
  ENS_RESOLVER_SET: 'ENS resolver set successfully'
};