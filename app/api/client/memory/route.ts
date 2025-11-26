
import { NextRequest, NextResponse } from 'next/server';
import { memoryManager } from '@/lib/user-memory';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  
  if (!clientId) {
    return NextResponse.json({ error: 'ClientId required' }, { status: 400 });
  }
  
  const memory = memoryManager.getUserMemory(clientId);
  
  return NextResponse.json({ memory });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, updates } = body;
    
    if (!clientId) {
      return NextResponse.json({ error: 'ClientId required' }, { status: 400 });
    }
    
    memoryManager.updateUserInfo(clientId, updates);
    const memory = memoryManager.getUserMemory(clientId);
    
    return NextResponse.json({ success: true, memory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
