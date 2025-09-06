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
    const { searchParams } = new URL(request.url);
    const duration = parseInt(searchParams.get('duration') || '365') * 24 * 60 * 60; // Convert years to seconds

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

    // Get price for the name
    const result = await agent.getPrice(name, duration);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Price calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate price' },
      { status: 500 }
    );
  }
}
