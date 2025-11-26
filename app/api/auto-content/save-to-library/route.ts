
import { NextRequest, NextResponse } from 'next/server';
import { autoSaveToLibrary } from '@/lib/content-library-helper';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const result = await autoSaveToLibrary(body);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Auto-save API error:', error);
    return NextResponse.json({
      success: false,
      saved: false,
      duplicate: false,
      message: error.message,
    }, { status: 500 });
  }
}
