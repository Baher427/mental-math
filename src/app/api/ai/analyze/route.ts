import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

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
      where: { studentId },
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
          weaknesses: [],
          recommendations: ['لا توجد بيانات كافية للتحليل'],
          summary: 'لم يتم تسجيل أي تقييمات لهذا الطالب بعد.',
        },
      });
    }

    // Calculate averages
    const presentEvals = evaluations.filter(e => e.isPresent);
    
    const calculateAvg = (field: keyof typeof evaluations[0]) => {
      const values = presentEvals
        .map(e => e[field])
        .filter((v): v is number => typeof v === 'number' && v !== null);
      return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    };

    const averages = {
      behavior: calculateAvg('behavior'),
      focus: calculateAvg('focus'),
      speed: calculateAvg('speed'),
      imaginationWrite: calculateAvg('imaginationWrite'),
      imaginationVerbal: calculateAvg('imaginationVerbal'),
      abacus: calculateAvg('abacus'),
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
        const recentAvg = recentEvals.reduce((sum, e) => {
          const scores = [e.behavior, e.focus, e.speed, e.imaginationWrite, e.imaginationVerbal, e.abacus]
            .filter((v): v is number => v !== null);
          return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
        }, 0) / recentEvals.length;

        const olderAvg = olderEvals.reduce((sum, e) => {
          const scores = [e.behavior, e.focus, e.speed, e.imaginationWrite, e.imaginationVerbal, e.abacus]
            .filter((v): v is number => v !== null);
          return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
        }, 0) / olderEvals.length;

        if (recentAvg > olderAvg + 5) trend = 'improving';
        else if (recentAvg < olderAvg - 5) trend = 'declining';
      }
    }

    // Use AI to generate detailed analysis
    const zai = await ZAI.create();
    
    const prompt = `قم بتحليل أداء طالب في الحساب الذهني بناءً على البيانات التالية:

اسم الطالب: ${student.name}
المستوى: ${student.level.name}
عدد الحصص المحضورة: ${presentEvals.length}
عدد الحصص الغائبة: ${evaluations.length - presentEvals.length}

متوسط العناصر:
- السلوك: ${averages.behavior}%
- التركيز: ${averages.focus}%
- السرعة: ${averages.speed}%
- التخيل الكتابي: ${averages.imaginationWrite}%
- التخيل اللفظي: ${averages.imaginationVerbal}%
- المعداد: ${averages.abacus}%

المتوسط العام: ${overallAvg}%
الاتجاه: ${trend === 'improving' ? 'تحسن' : trend === 'declining' ? 'تراجع' : 'ثبات'}

قم بإنشاء تحليل JSON بالتنسيق التالي:
{
  "summary": "ملخص قصير عن أداء الطالب",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "weaknesses": ["نقطة ضعف 1"],
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"]
}

أجب بـ JSON فقط بدون أي نص إضافي.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'أنت خبير في تحليل أداء الطلاب في الحساب الذهني. قدم تحليلاً مهنياً ومفيداً باللغة العربية.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    let aiAnalysis = {
      summary: `الطالب ${student.name} حقق متوسط أداء ${overallAvg}%`,
      strengths: [] as string[],
      weaknesses: [] as string[],
      recommendations: [] as string[],
    };

    try {
      const responseText = completion.choices[0]?.message?.content || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }

    // Determine strengths and weaknesses from scores
    if (aiAnalysis.strengths.length === 0) {
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      Object.entries(averages).forEach(([key, value]) => {
        const labels: Record<string, string> = {
          behavior: 'السلوك',
          focus: 'التركيز',
          speed: 'السرعة',
          imaginationWrite: 'التخيل الكتابي',
          imaginationVerbal: 'التخيل اللفظي',
          abacus: 'المعداد',
        };
        
        if (value >= 86) strengths.push(labels[key]);
        else if (value <= 70) weaknesses.push(labels[key]);
      });
      
      aiAnalysis.strengths = strengths;
      aiAnalysis.weaknesses = weaknesses;
    }

    if (aiAnalysis.recommendations.length === 0) {
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
      if (recommendations.length === 0) {
        recommendations.push('الاستمرار على نفس الوتيرة');
        recommendations.push('تشجيع الطالب على الأداء المتميز');
      }
      
      aiAnalysis.recommendations = recommendations;
    }

    return NextResponse.json({
      analysis: {
        overallTrend: trend,
        averageScore: overallAvg,
        ...aiAnalysis,
      },
    });
  } catch (error) {
    console.error('Error analyzing student:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحليل' },
      { status: 500 }
    );
  }
}
