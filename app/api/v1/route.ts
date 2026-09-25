import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Natural Language / Route Search
    if (action === 'searchRides') {
      const { query } = body;
      const rides = await prisma.ride.findMany({
        where: { available: true },
      });

      // If DB is empty, return initial fallback seed options
      if (rides.length === 0) {
        return NextResponse.json({
          success: true,
          rides: [
            { id: '1', title: 'Galaxy Economy', price: 4500, driverName: 'Saman Perera', fromLocation: 'Colombo', toLocation: 'Kandy', driverLat: 6.9271, driverLng: 79.8612, passengerLat: 7.2906, passengerLng: 80.6337 },
            { id: '2', title: 'Galaxy Comfort VIP', price: 6500, driverName: 'Kamal Silva', fromLocation: 'Colombo', toLocation: 'Kandy', driverLat: 6.9300, driverLng: 79.8650, passengerLat: 7.2906, passengerLng: 80.6337 }
          ]
        });
      }
      return NextResponse.json({ success: true, rides });
    }

    // 2. Passenger Booking Submission + Slip Upload
    if (action === 'createBooking') {
      const { rideId, slipData, passengerEmail } = body;
      
      const newBooking = await prisma.booking.create({
        data: {
          rideId: rideId || '1',
          paymentSlip: slipData || 'Receipt_Uploaded_Placeholder',
          status: 'PENDING_APPROVAL',
        },
      });

      return NextResponse.json({ success: true, booking: newBooking });
    }

    // 3. Admin: Fetch All Bookings
    if (action === 'getAdminBookings') {
      const bookings = await prisma.booking.findMany({
        include: { ride: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, bookings });
    }

    // 4. Admin: Approve or Reject Booking Slip
    if (action === 'updateBookingStatus') {
      const { bookingId, status } = body; // status = 'APPROVED' | 'REJECTED'
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    return NextResponse.json({ success: false, message: 'Invalid Action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
