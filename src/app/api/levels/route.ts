import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all levels
export async function GET() {
  try {
    // Create default levels if they don't exist
    const existingLevels = await db.level.findMany();
    
    if (existingLevels.length === 0) {
      const levelNames = [
        'المستوى الأول',
        'المستوى الثاني',
        'المستوى الثالث',
        'المستوى الرابع',
        'المستوى الخامس',
        'المستوى السادس',
        'المستوى السابع',
        'المستوى الثامن',
        'المستوى التاسع',
        'المستوى العاشر',
      ];

      await db.level.createMany({
        data: levelNames.map((name, index) => ({
          number: index + 1,
          name,
          monthsCount: 3,
        })),
      });
    }

    const levels = await db.level.findMany({
      include: {
        _count: {
          select: { students: true, groups: true },
        },
      },
      orderBy: { number: 'asc' },
    });

    return NextResponse.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المستويات' },
      { status: 500 }
    );
  }
}
