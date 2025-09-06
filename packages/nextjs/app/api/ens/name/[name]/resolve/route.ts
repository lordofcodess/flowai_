import { NextRequest, NextResponse } from 'next/server';
import { ENSAgent } from '@/services/ensagent/agent';
import { ethers } from 'ethers';

const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;

    if (!name || !name.endsWith('.eth')) {
      return NextResponse.json(
        { success: false, error: 'Invalid ENS name format' },
        { status: 400 }
      );
    }

    // Create provider and agent
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const agent = new ENSAgent();
    await agent.initialize(provider);

    // Resolve name to address
    const result = await agent.resolveName(name);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Name resolve error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve name' },
      { status: 500 }
    );
  }
}
