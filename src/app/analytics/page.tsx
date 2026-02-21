'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BarChart3, TrendingUp, Users, Loader2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  level: { number: number; name: string };
  group: { name: string; location: { name: string } };
}

interface Evaluation {
  id: string;
  sessionId: string;
  studentId: string;
  isPresent: boolean;
  behavior: number | null;
  focus: number | null;
  speed: number | null;
  imaginationWrite: number | null;
  imaginationVerbal: number | null;
  abacus: number | null;
  notes: string | null;
  session: {
    levelMonth: number;
    sessionNumber: number;
    date: string;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluationsLoading, setIsEvaluationsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchEvaluations(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.filter((s: Student) => !s.level));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvaluations = async (studentId: string) => {
    setIsEvaluationsLoading(true);
    try {
      const response = await fetch(`/api/evaluations?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setIsEvaluationsLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Calculate averages
  const presentEvaluations = evaluations.filter(e => e.isPresent);
  
  const calculateAverage = (field: keyof Evaluation) => {
    const values = presentEvaluations
      .map(e => e[field])
      .filter((v): v is number => v !== null);
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  };

  const averages = {
    behavior: calculateAverage('behavior'),
    focus: calculateAverage('focus'),
    speed: calculateAverage('speed'),
    imaginationWrite: calculateAverage('imaginationWrite'),
    imaginationVerbal: calculateAverage('imaginationVerbal'),
    abacus: calculateAverage('abacus'),
  };

  const overallAvg = presentEvaluations.length > 0
    ? Math.round(
        [averages.behavior, averages.focus, averages.speed, averages.imaginationWrite, averages.imaginationVerbal, averages.abacus]
          .reduce((a, b) => a + b, 0) / 6
      )
    : 0;

  // Progress chart data
  const progressData = presentEvaluations.map(e => {
    const scores = [e.behavior, e.focus, e.speed, e.imaginationWrite, e.imaginationVerbal, e.abacus]
      .filter((v): v is number => v !== null);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      name: `ح${e.session.sessionNumber} ش${e.session.levelMonth}`,
      avg,
    };
  });

  // Radar chart data
  const radarData = [
    { subject: 'السلوك', value: averages.behavior, fullMark: 100 },
    { subject: 'التركيز', value: averages.focus, fullMark: 100 },
    { subject: 'السرعة', value: averages.speed, fullMark: 100 },
    { subject: 'التخيل الكتابي', value: averages.imaginationWrite, fullMark: 100 },
    { subject: 'التخيل اللفظي', value: averages.imaginationVerbal, fullMark: 100 },
    { subject: 'المعداد', value: averages.abacus, fullMark: 100 },
  ];

  // Bar chart data
  const barData = [
    { name: 'السلوك', value: averages.behavior },
    { name: 'التركيز', value: averages.focus },
    { name: 'السرعة', value: averages.speed },
    { name: 'التخيل الكتابي', value: averages.imaginationWrite },
    { name: 'التخيل اللفظي', value: averages.imaginationVerbal },
    { name: 'المعداد', value: averages.abacus },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                التحليلات والتقارير
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                تحليل أداء الطلاب والرسوم البيانية
              </p>
            </div>

            {/* Student Selection */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">اختيار الطالب</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="w-full md:w-96">
                    <SelectValue placeholder="اختر طالب لعرض تحليله" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - {student.level?.name || 'غير محدد'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedStudentId && (
              isEvaluationsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : evaluations.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-16 text-center">
                    <BarChart3 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                      لا توجد تقييمات لهذا الطالب بعد
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-slate-500">المتوسط العام</p>
                          <p className={`text-3xl font-bold mt-2 ${
                            overallAvg <= 40 ? 'text-red-500' :
                            overallAvg <= 70 ? 'text-amber-500' :
                            overallAvg <= 85 ? 'text-emerald-500' : 'text-blue-500'
                          }`}>
                            {overallAvg}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-slate-500">الحصص المحضورة</p>
                          <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">
                            {presentEvaluations.length}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-slate-500">نسبة الحضور</p>
                          <p className="text-3xl font-bold mt-2 text-emerald-500">
                            {evaluations.length > 0
                              ? Math.round((presentEvaluations.length / evaluations.length) * 100)
                              : 0}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-slate-500">الاتجاه</p>
                          <p className="text-3xl font-bold mt-2 text-emerald-500">
                            <TrendingUp className="w-8 h-8 mx-auto" />
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">متوسط العناصر</CardTitle>
                        <CardDescription>متوسط كل عنصر من عناصر التقييم</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" fontSize={12} />
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Radar Chart */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">ملف الأداء</CardTitle>
                        <CardDescription>رسم بياني شامل للأداء</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" fontSize={12} />
                              <PolarRadiusAxis domain={[0, 100]} />
                              <Radar
                                name="الأداء"
                                dataKey="value"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.5}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Progress Chart */}
                  {progressData.length > 1 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">التطور عبر الحصص</CardTitle>
                        <CardDescription>تطور متوسط الأداء مع الوقت</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progressData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" fontSize={12} />
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="avg"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )
            )}
          </div>
        </main>
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6">
          <div className="max-w-7xl mx-auto text-center text-sm text-slate-500">
            <p>منصة تقييم الحساب الذهني © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
