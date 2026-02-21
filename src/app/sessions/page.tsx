'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Users, Save, Loader2, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
}

interface Level {
  id: string;
  number: number;
  name: string;
}

interface Group {
  id: string;
  name: string;
  location: { id: string; name: string };
  level: { id: string; number: number; name: string };
  students: Student[];
}

interface Student {
  id: string;
  name: string;
  phone: string | null;
}

interface EvaluationData {
  studentId: string;
  isPresent: boolean;
  behavior: number;
  focus: number;
  speed: number;
  imaginationWrite: number;
  imaginationVerbal: number;
  abacus: number;
  notes: string;
}

const evaluationLabels: Record<string, string> = {
  behavior: 'السلوك',
  focus: 'التركيز',
  speed: 'السرعة',
  imaginationWrite: 'التخيل الكتابي',
  imaginationVerbal: 'التخيل اللفظي',
  abacus: 'المعداد',
};

export default function SessionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  // Data
  const [locations, setLocations] = useState<Location[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Selection
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  
  // Evaluations
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationData>>({});
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        // Initialize evaluations for all students
        const initialEvals: Record<string, EvaluationData> = {};
        group.students.forEach(student => {
          initialEvals[student.id] = {
            studentId: student.id,
            isPresent: true,
            behavior: 70,
            focus: 70,
            speed: 70,
            imaginationWrite: 70,
            imaginationVerbal: 70,
            abacus: 70,
            notes: '',
          };
        });
        setEvaluations(initialEvals);
      }
    }
  }, [selectedGroupId, groups]);

  const fetchData = async () => {
    try {
      const [locationsRes, levelsRes, groupsRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/levels'),
        fetch('/api/groups'),
      ]);

      if (locationsRes.ok) setLocations(await locationsRes.json());
      if (levelsRes.ok) setLevels(await levelsRes.json());
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGroups = selectedLocationId
    ? groups.filter(g => g.location.id === selectedLocationId)
    : groups;

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const updateEvaluation = (studentId: string, field: string, value: unknown) => {
    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const getScoreColor = (score: number) => {
    if (score <= 40) return 'text-red-500';
    if (score <= 70) return 'text-amber-500';
    if (score <= 85) return 'text-emerald-500';
    return 'text-blue-500';
  };

  const handleSave = async () => {
    if (!selectedGroupId) {
      toast.error('يرجى اختيار المجموعة');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroupId,
          levelMonth: selectedMonth,
          sessionNumber: selectedSession,
          date: sessionDate,
          notes: sessionNotes,
          evaluations: Object.values(evaluations),
        }),
      });

      if (response.ok) {
        toast.success('تم حفظ التقييم بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

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
                التقييم الأسبوعي
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                تسجيل حضور وتقييم الطلاب للحصة
              </p>
            </div>

            {/* Selection Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">اختيار الحصة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>المكان</Label>
                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المكان" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>المجموعة</Label>
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المجموعة" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredGroups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} - {group.level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الشهر</Label>
                    <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3].map(m => (
                          <SelectItem key={m} value={m.toString()}>الشهر {m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الحصة</Label>
                    <Select value={selectedSession.toString()} onValueChange={v => setSelectedSession(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(s => (
                          <SelectItem key={s} value={s.toString()}>الحصة {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      value={sessionDate}
                      onChange={e => setSessionDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Table */}
            {selectedGroup && selectedGroup.students.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        تقييم الطلاب ({selectedGroup.students.length} طالب)
                      </CardTitle>
                      <CardDescription>
                        {selectedGroup.level.name} - {selectedGroup.location.name}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 ml-2" />
                          حفظ التقييم
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Session Notes */}
                    <div className="space-y-2">
                      <Label>ملاحظات عامة للمجموعة</Label>
                      <Textarea
                        placeholder="أي ملاحظات عامة على المجموعة..."
                        value={sessionNotes}
                        onChange={e => setSessionNotes(e.target.value)}
                        rows={2}
                      />
                    </div>

                    {/* Students Table */}
                    <ScrollArea className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800">
                            <TableHead className="sticky right-0 bg-slate-50 dark:bg-slate-800 w-32">الطالب</TableHead>
                            <TableHead className="w-20 text-center">حضر</TableHead>
                            <TableHead className="w-24 text-center">السلوك</TableHead>
                            <TableHead className="w-24 text-center">التركيز</TableHead>
                            <TableHead className="w-24 text-center">السرعة</TableHead>
                            <TableHead className="w-24 text-center">ت.كتابي</TableHead>
                            <TableHead className="w-24 text-center">ت.لفظي</TableHead>
                            <TableHead className="w-24 text-center">المعداد</TableHead>
                            <TableHead className="w-20 text-center">المتوسط</TableHead>
                            <TableHead className="min-w-[200px]">ملاحظات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedGroup.students.map(student => {
                            const eval_ = evaluations[student.id];
                            if (!eval_) return null;
                            
                            const scores = [
                              eval_.behavior,
                              eval_.focus,
                              eval_.speed,
                              eval_.imaginationWrite,
                              eval_.imaginationVerbal,
                              eval_.abacus,
                            ];
                            const avg = eval_.isPresent
                              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                              : 0;

                            return (
                              <TableRow key={student.id} className={!eval_.isPresent ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                <TableCell className="font-medium sticky right-0 bg-white dark:bg-slate-900">
                                  {student.name}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={eval_.isPresent}
                                    onCheckedChange={checked => updateEvaluation(student.id, 'isPresent', checked)}
                                  />
                                </TableCell>
                                {['behavior', 'focus', 'speed', 'imaginationWrite', 'imaginationVerbal', 'abacus'].map(field => (
                                  <TableCell key={field} className="text-center">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={eval_[field as keyof EvaluationData] as number}
                                      onChange={e => updateEvaluation(student.id, field, parseInt(e.target.value) || 0)}
                                      disabled={!eval_.isPresent}
                                      className={`w-20 text-center mx-auto ${!eval_.isPresent ? 'opacity-50' : ''}`}
                                    />
                                  </TableCell>
                                ))}
                                <TableCell className="text-center">
                                  <span className={`font-bold ${getScoreColor(avg)}`}>
                                    {eval_.isPresent ? `${avg}%` : '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="ملاحظات..."
                                    value={eval_.notes}
                                    onChange={e => updateEvaluation(student.id, 'notes', e.target.value)}
                                    disabled={!eval_.isPresent}
                                    className={!eval_.isPresent ? 'opacity-50' : ''}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {selectedGroupId && selectedGroup?.students.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg">لا يوجد طلاب في هذه المجموعة</p>
                </CardContent>
              </Card>
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
