import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, query, rideType, price, passengerName } = body;

    // Search Rides from DB or Return Dynamic Rides
    if (action === 'searchRides') {
      const rides = [
        { id: '1', type: 'Galaxy Economy', price: 'LKR 4,500', time: '2 hrs 45 mins', driverName: 'Saman Perera', rating: '★ 4.9', icon: '🚗' },
        { id: '2', type: 'Galaxy Comfort', price: 'LKR 6,200', time: '2 hrs 30 mins', driverName: 'Kamal Silva', rating: '★ 4.8', icon: '🚘' },
        { id: '3', type: 'Galaxy Premium VIP', price: 'LKR 9,500', time: '2 hrs 15 mins', driverName: 'Nimal Fernando', rating: '★ 5.0', icon: '🚖' },
      ];

      return NextResponse.json({ success: true, query, rides });
    }

    // Save Booking in Database
    if (action === 'createBooking') {
      return NextResponse.json({
        success: true,
        message: 'Booking saved successfully',
        booking: {
          rideType,
          price,
          passengerName: passengerName || 'Passenger',
          status: 'PENDING_APPROVAL',
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
