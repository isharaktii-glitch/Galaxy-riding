import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Full Register (Driver or Passenger)
    if (action === 'register') {
      const { firstName, lastName, email, password, role } = body;
      const user = await prisma.user.create({
        data: { firstName, lastName, email, password, role },
      });
      return NextResponse.json({ success: true, user });
    }

    // 2. Login
    if (action === 'login') {
      const { email, password } = body;
      const user = await prisma.user.findFirst({
        where: { email, password },
      });
      if (!user) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
      return NextResponse.json({ success: true, user });
    }

    // 3. KYC Verification (Submit Phone & WhatsApp No)
    if (action === 'verifyKYC') {
      const { userId, phone, whatsapp } = body;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { phone, whatsapp, kycVerified: true },
      });
      return NextResponse.json({ success: true, user: updatedUser });
    }

    // 4. Update Passenger Profile (Education, Phone etc)
    if (action === 'updateProfile') {
      const { userId, education, phone } = body;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { education, phone },
      });
      return NextResponse.json({ success: true, user: updatedUser });
    }

    // 5. Real-time Live GPS Location Sync (Driver/Passenger Vehicle Movement)
    if (action === 'updateLocation') {
      const { userId, lat, lng } = body;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { currentLat: lat, currentLng: lng },
      });
      return NextResponse.json({ success: true, user: updatedUser });
    }

    // 6. Get Driver's Real-time Location for Passenger Map
    if (action === 'getDriverLocation') {
      const { driverId } = body;
      const driver = await prisma.user.findUnique({
        where: { id: driverId },
        select: { currentLat: true, currentLng: true, firstName: true, phone: true },
      });
      return NextResponse.json({ success: true, driver });
    }

    return NextResponse.json({ success: false, message: 'Invalid Action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
