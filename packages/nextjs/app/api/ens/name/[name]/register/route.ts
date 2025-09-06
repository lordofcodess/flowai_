import { NextRequest, NextResponse } from 'next/server';
import { ENSAgent } from '@/services/ensagent/agent';
import { ethers } from 'ethers';

const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com';

export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;
    const body = await request.json();
    const { duration = 365 * 24 * 60 * 60, userAddress, secret } = body; // duration in seconds

    if (!name || !name.endsWith('.eth')) {
      return NextResponse.json(
        { success: false, error: 'Invalid ENS name format' },
        { status: 400 }
      );
    }

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address is required' },
        { status: 400 }
      );
    }

    // Create provider and agent
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const agent = new ENSAgent();
    await agent.initialize(provider);

    // Register the name
    const result = await agent.registerName(name, userAddress, duration, secret);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Name registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register name' },
      { status: 500 }
    );
  }
}
