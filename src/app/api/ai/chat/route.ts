import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, studentId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'الرسالة مطلوبة' },
        { status: 400 }
      );
    }

    // Gather context about students
    let context = '';
    
    if (studentId) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          level: true,
          group: { include: { location: true } },
        },
      });
      
      if (student) {
        const evaluations = await db.evaluation.findMany({
          where: { studentId, isPresent: true },
          orderBy: { session: { date: 'desc' } },
          take: 10,
        });
        
        context = `
الطالب الحالي: ${student.name}
المستوى: ${student.level.name}
المكان: ${student.group.location.name}
المجموعة: ${student.group.name}
عدد التقييمات: ${evaluations.length}
`;
      }
    } else {
      // Get general stats
      const [totalStudents, totalGroups, totalLocations] = await Promise.all([
        db.student.count({ where: { isActive: true, isArchived: false } }),
        db.group.count(),
        db.location.count(),
      ]);
      
      context = `
إحصائيات عامة:
- إجمالي الطلاب: ${totalStudents}
- إجمالي المجموعات: ${totalGroups}
- إجمالي الأماكن: ${totalLocations}
`;
    }

    const zai = await ZAI.create();
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `أنت مساعد ذكي لمنصة تقييم الحساب الذهني. تساعد في متابعة أداء الطلاب وتقديم التوصيات.

${context}

أجب باللغة العربية بطريقة مختصرة ومفيدة.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      thinking: { type: 'disabled' }
    });

    const response = completion.choices[0]?.message?.content || 'عذراً، لم أتمكن من فهم سؤالك.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الرسالة' },
      { status: 500 }
    );
  }
}
