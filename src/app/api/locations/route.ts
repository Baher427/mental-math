import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all locations
export async function GET() {
  try {
    const locations = await db.location.findMany({
      include: {
        _count: {
          select: { groups: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الأماكن' },
      { status: 500 }
    );
  }
}

// Create new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'اسم المكان مطلوب' },
        { status: 400 }
      );
    }

    const location = await db.location.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المكان' },
      { status: 500 }
    );
  }
}
