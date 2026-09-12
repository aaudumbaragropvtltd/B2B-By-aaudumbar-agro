import { NextResponse } from 'next/server';
import { STATIC_SECTORS } from '@/constants/sectors';

export async function GET() {
  try {
    return NextResponse.json({ sectors: STATIC_SECTORS });
  } catch (error) {
    console.error('Error in sectors API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
