import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    engine: 'Next.js App Router (TypeScript)',
    timestamp: new Date().toISOString(),
    golangMigrationReady: true,
  });
}
