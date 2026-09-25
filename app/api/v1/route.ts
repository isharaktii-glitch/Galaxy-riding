import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { action, payload } = await req.json();

  try {
    // 1. Post a New Ride (Driver)
    if (action === 'CREATE_RIDE') {
      const ride = await prisma.ride.create({
        data: payload
      });
      return NextResponse.json({ success: true, data: ride });
    }

    // 2. AI Assistant Matching Query
    if (action === 'AI_SEARCH_RIDES') {
      const { from, to } = payload;
      const rides = await prisma.ride.findMany({
        where: {
          fromLocation: { contains: from, mode: 'insensitive' },
          toLocation: { contains: to, mode: 'insensitive' },
          availableSeats: { gt: 0 },
          status: 'ACTIVE'
        },
        include: { driver: true }
      });
      return NextResponse.json({ success: true, count: rides.length, data: rides });
    }

    // 3. Confirm / Reject Booking (Admin Flow)
    if (action === 'UPDATE_BOOKING_STATUS') {
      const { bookingId, status } = payload; // APPROVED or REJECTED
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
        include: { ride: { include: { driver: true } } }
      });

      // If approved, reduce available seats
      if (status === 'APPROVED') {
        await prisma.ride.update({
          where: { id: updatedBooking.rideId },
          data: { availableSeats: { decrement: updatedBooking.seatsBooked } }
        });
      }

      return NextResponse.json({ success: true, data: updatedBooking });
    }

    return NextResponse.json({ success: false, error: "Invalid Action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
