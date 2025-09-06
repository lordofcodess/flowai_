// ENS Agent API Endpoints
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { ENSAgent } from './agent';
import { SEPOLIA_NETWORK } from '../../abis/constants';
import { ENSAgentResponse, ChatMessage } from './types';

// Global instances (in production, these should be properly managed)
let ensAgent: ENSAgent | null = null;

// Initialize the ENS agent
function initializeAgent() {
  if (!ensAgent) {
    ensAgent = new ENSAgent();
  }
}

// Helper to get user address from request
function getUserAddress(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In a real implementation, you'd verify the JWT and extract the address
    return authHeader.substring(7);
  }
  return undefined;
}

// Helper to create error response
function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

// Helper to create success response
function createSuccessResponse(data: any, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}

/**
 * POST /api/ens/chat
 * Process a chat message
 */
export async function POST_Chat(request: NextRequest): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const body = await request.json();
    const { message, userAddress } = body;

    if (!message || typeof message !== 'string') {
      return createErrorResponse('Message is required');
    }

    const address = userAddress || getUserAddress(request);
    const result = await ensAgent.processMessage(message, address);

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Chat processing failed: ${error}`, 500);
  }
}

/**
 * GET /api/ens/chat/history
 * Get chat history
 */
export async function GET_ChatHistory(request: NextRequest): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const history = ensAgent.getChatHistory();
    return createSuccessResponse(history);
  } catch (error) {
    return createErrorResponse(`Failed to get chat history: ${error}`, 500);
  }
}

/**
 * DELETE /api/ens/chat/history
 * Clear chat history
 */
export async function DELETE_ChatHistory(request: NextRequest): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    ensAgent.clearChatHistory();
    return createSuccessResponse(null, 'Chat history cleared');
  } catch (error) {
    return createErrorResponse(`Failed to clear chat history: ${error}`, 500);
  }
}

/**
 * GET /api/ens/name/{name}
 * Get comprehensive name information
 */
export async function GET_NameInfo(request: NextRequest, { params }: { params: { name: string } }): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const { name } = params;
    const result = await ensAgent.getNameInfo(name);

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Failed to get name info: ${error}`, 500);
  }
}

/**
 * GET /api/ens/name/{name}/available
 * Check if name is available
 */
export async function GET_NameAvailable(request: NextRequest, { params }: { params: { name: string } }): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const { name } = params;
    const result = await ensAgent.isNameAvailable(name);

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Failed to check availability: ${error}`, 500);
  }
}

/**
 * GET /api/ens/name/{name}/resolve
 * Resolve name to address
 */
export async function GET_NameResolve(request: NextRequest, { params }: { params: { name: string } }): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const { name } = params;
    const result = await ensAgent.resolveName(name);

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Failed to resolve name: ${error}`, 500);
  }
}

/**
 * GET /api/ens/address/{address}/resolve
 * Resolve address to name (reverse lookup)
 */
export async function GET_AddressResolve(request: NextRequest, { params }: { params: { address: string } }): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const { address } = params;
    const result = await ensAgent.resolveAddress(address);

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Failed to resolve address: ${error}`, 500);
  }
}

/**
 * GET /api/ens/name/{name}/records/{key}
 * Get a specific record for a name
 */
export async function GET_NameRecord(request: NextRequest, { params }: { params: { name: string; key: string } }): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const { name, key } = params;
    const result = await ensAgent.getTextRecord(name, key);

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Failed to get record: ${error}`, 500);
  }
}

/**
 * POST /api/ens/name/{name}/records
 * Set a record for a name
 */
export async function POST_NameRecord(request: NextRequest, { params }: { params: { name: string } }): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const userAddress = getUserAddress(request);
    if (!userAddress) {
      return createErrorResponse('User authentication required', 401);
    }

    // Set the signer for the contract manager
    const provider = new ethers.JsonRpcProvider(SEPOLIA_NETWORK.rpcUrl);
    const wallet = new ethers.Wallet(userAddress, provider); // In production, use proper wallet management
    ensAgent.setSigner(wallet);

    const { name } = params;
    const body = await request.json();
    const { key, value, coinType } = body;

    let result: ENSAgentResponse;

    if (key && value) {
      // Text record
      result = await ensAgent.setTextRecord(name, key, value);
    } else if (coinType !== undefined && value) {
      // Address record
      result = await ensAgent.setAddressRecord(name, value, coinType);
    } else {
      return createErrorResponse('Invalid record data');
    }

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Failed to set record: ${error}`, 500);
  }
}

/**
 * POST /api/ens/name/{name}/register
 * Register a name
 */
export async function POST_NameRegister(request: NextRequest, { params }: { params: { name: string } }): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const userAddress = getUserAddress(request);
    if (!userAddress) {
      return createErrorResponse('User authentication required', 401);
    }

    // Set the signer for the contract manager
    const provider = new ethers.JsonRpcProvider(SEPOLIA_NETWORK.rpcUrl);
    const wallet = new ethers.Wallet(userAddress, provider); // In production, use proper wallet management
    ensAgent.setSigner(wallet);

    const { name } = params;
    const body = await request.json();
    const { duration = 365 * 24 * 60 * 60, secret } = body;

    const result = await ensAgent.registerName(name, userAddress, duration, secret);

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Failed to register name: ${error}`, 500);
  }
}

/**
 * POST /api/ens/name/{name}/renew
 * Renew a name
 */
export async function POST_NameRenew(request: NextRequest, { params }: { params: { name: string } }): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const userAddress = getUserAddress(request);
    if (!userAddress) {
      return createErrorResponse('User authentication required', 401);
    }

    // Set the signer for the contract manager
    const provider = new ethers.JsonRpcProvider(SEPOLIA_NETWORK.rpcUrl);
    const wallet = new ethers.Wallet(userAddress, provider); // In production, use proper wallet management
    ensAgent.setSigner(wallet);

    const { name } = params;
    const body = await request.json();
    const { duration = 365 * 24 * 60 * 60 } = body;

    const result = await ensAgent.renewName(name, duration);

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Failed to renew name: ${error}`, 500);
  }
}

/**
 * POST /api/ens/name/{name}/transfer
 * Transfer a name
 */
export async function POST_NameTransfer(request: NextRequest, { params }: { params: { name: string } }): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const userAddress = getUserAddress(request);
    if (!userAddress) {
      return createErrorResponse('User authentication required', 401);
    }

    // Set the signer for the contract manager
    const provider = new ethers.JsonRpcProvider(SEPOLIA_NETWORK.rpcUrl);
    const wallet = new ethers.Wallet(userAddress, provider); // In production, use proper wallet management
    ensAgent.setSigner(wallet);

    const { name } = params;
    const body = await request.json();
    const { newOwner } = body;

    if (!newOwner) {
      return createErrorResponse('New owner address is required');
    }

    const result = await ensAgent.transferName(name, newOwner);

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(`Failed to transfer name: ${error}`, 500);
  }
}

/**
 * GET /api/ens/agent/status
 * Get agent status and capabilities
 */
export async function GET_AgentStatus(request: NextRequest): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const status = ensAgent.getAIStatus();
    return createSuccessResponse(status);
  } catch (error) {
    return createErrorResponse(`Failed to get agent status: ${error}`, 500);
  }
}

/**
 * GET /api/ens/agent/help
 * Get help information
 */
export async function GET_AgentHelp(request: NextRequest): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const help = ensAgent.getHelpMessage();
    return createSuccessResponse({ help });
  } catch (error) {
    return createErrorResponse(`Failed to get help: ${error}`, 500);
  }
}

/**
 * GET /api/ens/agent/suggestions
 * Get suggested operations
 */
export async function GET_AgentSuggestions(request: NextRequest): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const suggestions = await ensAgent.getSuggestedOperations(name || undefined);

    return createSuccessResponse({ suggestions });
  } catch (error) {
    return createErrorResponse(`Failed to get suggestions: ${error}`, 500);
  }
}

/**
 * GET /api/ens/agent/stats
 * Get agent statistics
 */
export async function GET_AgentStats(request: NextRequest): Promise<NextResponse> {
  try {
    initializeAgent();
    
    if (!ensAgent) {
      return createErrorResponse('ENS Agent not initialized', 500);
    }

    const stats = ensAgent.getAIStats();
    return createSuccessResponse(stats);
  } catch (error) {
    return createErrorResponse(`Failed to get agent stats: ${error}`, 500);
  }
}
