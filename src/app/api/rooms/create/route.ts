import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/room';
import { Location } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location } = body as { location: Location };

    if (!location || !location.lat || !location.lng || !location.name) {
      return NextResponse.json(
        { error: 'Invalid location data' },
        { status: 400 }
      );
    }

    const room = createRoom(location);

    return NextResponse.json({
      roomId: room.id,
      code: room.code,
    });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
