'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Loader2, TrendingUp, TrendingDown, AlertCircle, Award, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  level: { number: number; name: string };
  group: { name: string; location: { name: string } };
}

interface Evaluation {
  id: string;
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

interface AIAnalysis {
  overallTrend: 'improving' | 'declining' | 'stable';
  averageScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
}

export default function AIPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

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

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        setStudents(await response.json());
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedStudentId) {
      toast.error('يرجى اختيار طالب');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        toast.error('حدث خطأ أثناء التحليل');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          studentId: selectedStudentId 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-6 h-6 text-emerald-500" />;
      case 'declining':
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-slate-300" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'تحسن مستمر';
      case 'declining':
        return 'تراجع';
      default:
        return 'ثبات';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                التحليل الذكي
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                تحليل أداء الطلاب باستخدام الذكاء الاصطناعي
              </p>
            </div>

            {/* Student Selection */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-500" />
                  اختيار الطالب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="اختر طالب للتحليل" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} - {student.level?.name || 'غير محدد'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !selectedStudentId}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري التحليل...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 ml-2" />
                        تحليل الأداء
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysis && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Overview */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">نظرة عامة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(analysis.overallTrend)}
                        <div>
                          <p className="font-medium">الاتجاه العام</p>
                          <p className="text-sm text-slate-500">{getTrendText(analysis.overallTrend)}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-emerald-500">{analysis.averageScore}%</p>
                        <p className="text-sm text-slate-500">المتوسط</p>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{analysis.summary}</p>
                  </CardContent>
                </Card>

                {/* Strengths & Weaknesses */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">نقاط القوة والضعف</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <p className="font-medium text-emerald-600">نقاط القوة</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.strengths.map((s, i) => (
                          <Badge key={i} variant="secondary" className="bg-emerald-100 text-emerald-700">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <p className="font-medium text-amber-600">يحتاج تحسين</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.weaknesses.map((w, i) => (
                          <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-700">
                            {w}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="border-0 shadow-sm md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      التوصيات
                    </CardTitle>
                    <CardDescription>اقتراحات لتحسين أداء الطالب</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Chat */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-500" />
                  المساعد الذكي
                </CardTitle>
                <CardDescription>اسأل أي سؤال عن أداء الطلاب</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat History */}
                  {chatHistory.length > 0 && (
                    <div className="h-64 overflow-y-auto space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      {chatHistory.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white dark:bg-slate-700 shadow-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="اكتب سؤالك هنا..."
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <Button
                      onClick={handleChat}
                      disabled={!chatMessage.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6">
          <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
            <p>منصة تقييم الحساب الذهني © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
