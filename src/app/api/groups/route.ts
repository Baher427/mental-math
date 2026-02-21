import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const levelId = searchParams.get('levelId');

    const where: Record<string, string> = {};
    if (locationId) where.locationId = locationId;
    if (levelId) where.levelId = levelId;

    const groups = await db.group.findMany({
      where,
      include: {
        location: true,
        level: true,
        _count: {
          select: { students: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المجموعات' },
      { status: 500 }
    );
  }
}

// Create new group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, locationId, levelId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'اسم المجموعة مطلوب' },
        { status: 400 }
      );
    }

    if (!locationId || !levelId) {
      return NextResponse.json(
        { error: 'المكان والمستوى مطلوبان' },
        { status: 400 }
      );
    }

    const group = await db.group.create({
      data: {
        name: name.trim(),
        locationId,
        levelId,
      },
      include: {
        location: true,
        level: true,
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المجموعة' },
      { status: 500 }
    );
  }
}
