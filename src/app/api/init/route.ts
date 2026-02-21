import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
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
      { error: 'حدث خطأ أثناء تهيئة المستويات: ' + (error instanceof Error ? error.message : 'خطأ') },
      { status: 500 }
    );
  }
}
