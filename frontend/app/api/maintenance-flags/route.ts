import { NextRequest, NextResponse } from 'next/server';

interface MaintenanceFlag {
  id: string;
  componentId: string;
  sensor: string;
  timestamp: string;
  createdAt: number;
}

// In-memory store — resets on server restart (acceptable for this prototype)
const flags: MaintenanceFlag[] = [];

export async function GET() {
  return NextResponse.json({ flags });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Partial<MaintenanceFlag>;
  const flag: MaintenanceFlag = {
    id: `flag-${Date.now()}`,
    componentId: body.componentId ?? '',
    sensor: body.sensor ?? '',
    timestamp: body.timestamp ?? new Date().toISOString(),
    createdAt: Date.now(),
  };
  flags.push(flag);
  return NextResponse.json({ success: true, flag });
}
