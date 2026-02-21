import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Initialize levels if they don't exist
export async function GET(request: NextRequest) {
  try {
    const existingLevels = await db.level.count();
    
    if (existingLevels === 0) {
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

      return NextResponse.json({ 
        message: 'تم إنشاء المستويات بنجاح',
        count: 10 
      });
    }

    return NextResponse.json({ 
      message: 'المستويات موجودة بالفعل',
      count: existingLevels 
    });
  } catch (error) {
    console.error('Error initializing levels:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تهيئة المستويات' },
      { status: 500 }
    );
  }
}
