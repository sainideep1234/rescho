import { NextRequest, NextResponse } from 'next/server';
import { getRoomByCode, addUserToRoom } from '@/lib/room';
import { isValidRoomCode } from '@/lib/room/codeGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body as { code: string; userId: string };

    if (!code || !isValidRoomCode(code)) {
      return NextResponse.json(
        { error: 'Invalid room code format' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const room = getRoomByCode(code.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (room.users.length >= 2 && !room.users.some(u => u.id === userId)) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 400 }
      );
    }

    const success = addUserToRoom(room.id, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      roomId: room.id,
      location: room.location,
    });
  } catch (error) {
    console.error('Failed to join room:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
