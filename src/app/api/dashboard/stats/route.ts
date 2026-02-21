import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get total counts
    const [students, locations, groups, evaluations] = await Promise.all([
      db.student.count({ where: { isActive: true, isArchived: false } }),
      db.location.count(),
      db.group.count(),
      db.evaluation.findMany({
        where: { isPresent: true },
        select: {
          studentId: true,
          behavior: true,
          focus: true,
          speed: true,
          imaginationWrite: true,
          imaginationVerbal: true,
          abacus: true,
        },
      }),
    ]);

    // Calculate average scores per student
    const studentScores = new Map<string, { total: number; count: number }>();
    
    evaluations.forEach((eval_) => {
      const scores = [
        eval_.behavior,
        eval_.focus,
        eval_.speed,
        eval_.imaginationWrite,
        eval_.imaginationVerbal,
        eval_.abacus,
      ].filter((s): s is number => s !== null);
      
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const existing = studentScores.get(eval_.studentId) || { total: 0, count: 0 };
        studentScores.set(eval_.studentId, {
          total: existing.total + avg,
          count: existing.count + 1,
        });
      }
    });

    // Get top students
    const topStudentsData = Array.from(studentScores.entries())
      .map(([studentId, data]) => ({
        studentId,
        avgScore: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    const topStudents = await Promise.all(
      topStudentsData.map(async (item) => {
        const student = await db.student.findUnique({
          where: { id: item.studentId },
          include: { level: true },
        });
        return {
          id: item.studentId,
          name: student?.name || '',
          avgScore: item.avgScore,
          level: student?.level?.number || 0,
        };
      })
    );

    // Count excellent students (avg >= 86%)
    const excellentStudents = Array.from(studentScores.values()).filter(
      (data) => data.total / data.count >= 86
    ).length;

    return NextResponse.json({
      stats: {
        totalStudents: students,
        totalLocations: locations,
        totalGroups: groups,
        excellentStudents,
        needsAttention: 0,
      },
      topStudents,
      alertStudents: [],
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    );
  }
}
