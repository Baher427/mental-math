import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get evaluations for a student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');

    if (!studentId && !groupId) {
      return NextResponse.json(
        { error: 'معرف الطالب أو المجموعة مطلوب' },
        { status: 400 }
      );
    }

    const where: Record<string, string> = {};
    if (studentId) where.studentId = studentId;

    let evaluations;

    if (studentId) {
      evaluations = await db.evaluation.findMany({
        where: { studentId },
        include: {
          session: {
            include: {
              group: {
                include: { level: true, location: true },
              },
            },
          },
          student: true,
        },
        orderBy: { session: { date: 'asc' } },
      });
    } else if (groupId) {
      const sessions = await db.session.findMany({
        where: { groupId },
        include: {
          evaluations: {
            include: {
              student: true,
            },
          },
        },
        orderBy: { date: 'asc' },
      });
      evaluations = sessions;
    }

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب التقييمات' },
      { status: 500 }
    );
  }
}
