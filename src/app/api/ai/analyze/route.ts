import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: 'معرف الطالب مطلوب' },
        { status: 400 }
      );
    }

    // Get student data
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        level: true,
        group: {
          include: { location: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    // Get evaluations
    const evaluations = await db.evaluation.findMany({
      where: { 
        studentId,
        isPresent: true 
      },
      include: {
        session: true,
      },
      orderBy: { session: { date: 'asc' } },
    });

    if (evaluations.length === 0) {
      return NextResponse.json({
        analysis: {
          overallTrend: 'stable',
          averageScore: 0,
          strengths: [],
          weaknesses: ['لا توجد بيانات تقييم'],
          recommendations: ['قم بتقييم الطالب في الحصص أولاً'],
          summary: `${student.name} لم يتم تقييمه في أي حصة بعد. ابدأ بتسجيل الحضور والتقييم.`,
        },
      });
    }

    // Calculate averages
    const presentEvals = evaluations.filter((e) => e.isPresent);

    const calcAvg = (field: keyof typeof evaluations[0]) => {
      const values = presentEvals
        .map((e) => e[field])
        .filter((v): v is number => typeof v === 'number' && v !== null);
      return values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;
    };

    const averages = {
      behavior: calcAvg('behavior'),
      focus: calcAvg('focus'),
      speed: calcAvg('speed'),
      imaginationWrite: calcAvg('imaginationWrite'),
      imaginationVerbal: calcAvg('imaginationVerbal'),
      abacus: calcAvg('abacus'),
    };

    const overallAvg = Math.round(
      Object.values(averages).reduce((a, b) => a + b, 0) / 6
    );

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (presentEvals.length >= 2) {
      const recentEvals = presentEvals.slice(-3);
      const olderEvals = presentEvals.slice(0, -3);

      if (recentEvals.length > 0 && olderEvals.length > 0) {
        const calcAvgForEvals = (evals: typeof presentEvals) => {
          return evals.reduce((sum, e) => {
            const scores = [
              e.behavior,
              e.focus,
              e.speed,
              e.imaginationWrite,
              e.imaginationVerbal,
              e.abacus,
            ].filter((v): v is number => v !== null);
            return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
          }, 0) / evals.length;
        };

        const recentAvg = calcAvgForEvals(recentEvals);
        const olderAvg = calcAvgForEvals(olderEvals);

        if (recentAvg > olderAvg + 5) trend = 'improving';
        else if (recentAvg < olderAvg - 5) trend = 'declining';
      }
    }

    // Determine strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const labels: Record<string, string> = {
      behavior: 'السلوك',
      focus: 'التركيز',
      speed: 'السرعة',
      imaginationWrite: 'التخيل الكتابي',
      imaginationVerbal: 'التخيل اللفظي',
      abacus: 'المعداد',
    };

    Object.entries(averages).forEach(([key, value]) => {
      const label = labels[key];
      if (value >= 86) {
        strengths.push(`${label} (${value}%)`);
      } else if (value <= 70) {
        weaknesses.push(`${label} (${value}%)`);
      }
    });

    // Generate recommendations
    const recommendations: string[] = [];
    if (averages.imaginationVerbal < 70) {
      recommendations.push('زيادة تمارين التخيل اللفظي');
    }
    if (averages.imaginationWrite < 70) {
      recommendations.push('تدريب أكثر على التخيل الكتابي');
    }
    if (averages.focus < 70) {
      recommendations.push('تمارين لتحسين التركيز والانتباه');
    }
    if (averages.speed < 70) {
      recommendations.push('تدريبات سرعة إضافية على المعداد');
    }
    if (averages.behavior < 70) {
      recommendations.push('التركيز على تحسين السلوك والانضباط');
    }
    if (recommendations.length === 0) {
      recommendations.push('الاستمرار على نفس الوتيرة');
      recommendations.push('تشجيع الطالب على الأداء المتميز');
    }

    // Generate summary
    const trendText = trend === 'improving' ? 'في تحسن مستمر' : trend === 'declining' ? 'يحتاج متابعة' : 'مستقر';
    const levelText = overallAvg >= 86 ? 'ممتاز' : overallAvg >= 71 ? 'جيد' : overallAvg >= 41 ? 'متوسط' : 'ضعيف';

    const summary = `${student.name} في ${student.level.name} - ${student.group.location.name}. الأداء العام ${levelText} بمتوسط ${overallAvg}%، واتجاه الأداء ${trendText}. حضر ${presentEvals.length} حصص.`;

    return NextResponse.json({
      analysis: {
        overallTrend: trend,
        averageScore: overallAvg,
        strengths,
        weaknesses,
        recommendations,
        summary,
        attendanceCount: presentEvals.length,
        details: averages,
      },
    });
  } catch (error) {
    console.error('Error analyzing student:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحليل: ' + (error instanceof Error ? error.message : 'خطأ غير معروف') },
      { status: 500 }
    );
  }
}
