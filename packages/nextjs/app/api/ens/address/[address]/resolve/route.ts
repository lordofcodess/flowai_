import { NextRequest, NextResponse } from 'next/server';
import { ENSAgent } from '@/services/ensagent/agent';
import { ethers } from 'ethers';

const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Create provider and agent
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const agent = new ENSAgent();
    await agent.initialize(provider);

    // Resolve address to ENS name
    const result = await agent.resolveAddress(address);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Address resolve error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve address' },
      { status: 500 }
    );
  }
}
