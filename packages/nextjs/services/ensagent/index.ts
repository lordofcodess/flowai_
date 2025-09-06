// ENS Agent Service - Main Export
export { ENSAgent } from './agent';
export { ENSContractManager } from './contracts';
export { ENSOperations } from './operations';
export { ENSIntegration, ensIntegration } from './integration';

// Types
export type {
  ENSName,
  ENSRecord,
  ENSRegistration,
  ENSCommitment,
  ENSPrice,
  ENSOperation,
  ENSTransaction,
  ENSAgentConfig,
  ENSAgentResponse,
  ChatMessage,
  ENSAgentCapabilities,
  ENSNameInfo,
  ENSBatchOperation,
  ENSAgentStats
} from './types';

// Utilities
export {
  validateENSName,
  nameToNode,
  nodeToName,
  generateSecret,
  createCommitment,
  calculatePrice,
  daysToSeconds,
  formatDuration,
  isValidAddress,
  normalizeName,
  isSubdomain,
  getParentDomain,
  isValidRecordType,
  encodeRecordValue,
  decodeRecordValue,
  createBatchOperation,
  estimateGas,
  formatETH,
  parseETH,
  generateOperationId,
  validateOperation
} from './utils';

// API Endpoints
export {
  POST_Chat,
  GET_ChatHistory,
  DELETE_ChatHistory,
  GET_NameInfo,
  GET_NameAvailable,
  GET_NameResolve,
  GET_AddressResolve,
  GET_NameRecord,
  POST_NameRecord,
  POST_NameRegister,
  POST_NameRenew,
  POST_NameTransfer,
  GET_AgentStatus,
  GET_AgentHelp,
  GET_AgentSuggestions,
  GET_AgentStats
} from './endpoints';

// Default ENS Agent instance
import { ENSAgent } from './agent';
import { SEPOLIA_NETWORK } from '../../abis/constants';

// Create a default instance for easy use
export const createENSAgent = (config?: Partial<import('./types').ENSAgentConfig>) => {
  return new ENSAgent(config);
};

// Default agent instance
export const ensAgent = createENSAgent();

// Agent info
export const agentInfo = {
  name: 'ENS Agent',
  version: '1.0.0',
  description: 'AI-powered ENS management agent with natural language interface',
  capabilities: [
    'Name registration and renewal',
    'Record management (text, address, custom)',
    'Name resolution and reverse lookup',
    'Natural language processing',
    'Batch operations',
    'Transaction management'
  ],
  supportedNetworks: ['Sepolia Testnet'],
  supportedTLDs: ['.eth', '.test']
};