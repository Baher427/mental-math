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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Users, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
  sessionTime?: string;
  location: { id: string; name: string };
  level: { id: string; number: number; name: string };
  students: Student[];
}

interface Student {
  id: string;
  name: string;
  phone: string | null;
}

interface StudentAttendance {
  studentId: string;
  name: string;
  isPresent: boolean;
  notes: string;
}

export default function AttendancePage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // Data
  const [locations, setLocations] = useState<Location[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Selection
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [sessionTime, setSessionTime] = useState<string>('');
  const [weekNumber, setWeekNumber] = useState<number>(1);

  // Attendance
  const [studentAttendances, setStudentAttendances] = useState<StudentAttendance[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      fetchData();
    }
  }, [_hasHydrated, isAuthenticated]);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find((g) => g.id === selectedGroupId);
      if (group) {
        // Initialize attendance for all students
        const initialAttendances: StudentAttendance[] = group.students.map((student) => ({
          studentId: student.id,
          name: student.name,
          isPresent: true,
          notes: '',
        }));
        setStudentAttendances(initialAttendances);

        // Set default session time
        if (group.sessionTime) {
          setSessionTime(group.sessionTime);
        }
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
      if (groupsRes.ok) setGroups(await groupsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGroups = selectedLocationId
    ? groups.filter((g) => g.location.id === selectedLocationId)
    : groups;

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const updateAttendance = (studentId: string, field: string, value: unknown) => {
    setStudentAttendances((prev) =>
      prev.map((att) =>
        att.studentId === studentId ? { ...att, [field]: value } : att
      )
    );
  };

  const handleSave = async () => {
    if (!selectedGroupId) {
      toast.error('يرجى اختيار المجموعة');
      return;
    }

    if (!selectedDate) {
      toast.error('يرجى تحديد تاريخ الحصة');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroupId,
          date: selectedDate,
          startTime: startTime ? `${selectedDate}T${startTime}:00` : null,
          endTime: endTime ? `${selectedDate}T${endTime}:00` : null,
          sessionTime,
          weekNumber,
          attendances: studentAttendances.map((att) => ({
            studentId: att.studentId,
            isPresent: att.isPresent,
            notes: att.notes,
          })),
        }),
      });

      if (response.ok) {
        toast.success('تم حفظ الحضور بنجاح');
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

  const presentCount = studentAttendances.filter((a) => a.isPresent).length;
  const absentCount = studentAttendances.length - presentCount;

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                سجل الحضور والغياب
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                تسجيل حضور وغياب الطلاب لكل حصة
              </p>
            </div>

            {/* Selection Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">بيانات الحصة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>المكان</Label>
                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المكان" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
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
                        {filteredGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} - {group.level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الأسبوع</Label>
                    <Select
                      value={weekNumber.toString()}
                      onValueChange={(v) => setWeekNumber(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                          <SelectItem key={w} value={w.toString()}>
                            الأسبوع {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ الحصة</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت بداية الحصة</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت نهاية الحصة</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوقت (للعرض)</Label>
                    <Input
                      type="text"
                      placeholder="مثال: 4:00 - 5:30 مساءً"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance List */}
            {selectedGroup && studentAttendances.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">قائمة الطلاب</CardTitle>
                      <CardDescription>
                        {selectedGroup.level.name} - {selectedGroup.location.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{presentCount} حضر</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-4 h-4" />
                        <span>{absentCount} غاب</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentAttendances.map((att) => (
                      <div
                        key={att.studentId}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          att.isPresent
                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        }`}
                      >
                        <Checkbox
                          checked={att.isPresent}
                          onCheckedChange={(checked) =>
                            updateAttendance(att.studentId, 'isPresent', checked)
                          }
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {att.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {att.isPresent ? '✅ حضر' : '❌ غاب'}
                          </p>
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="ملاحظات..."
                            value={att.notes}
                            onChange={(e) =>
                              updateAttendance(att.studentId, 'notes', e.target.value)
                            }
                            className="bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Save Button */}
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-emerald-500 hover:bg-emerald-600 min-w-[200px]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 ml-2" />
                          حفظ الحضور
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {selectedGroupId && studentAttendances.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    لا يوجد طلاب في هذه المجموعة
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6">
          <div className="max-w-5xl mx-auto text-center text-sm text-slate-500">
            <p>منصة تقييم الحساب الذهني © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
