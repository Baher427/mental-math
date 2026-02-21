'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, GraduationCap, RotateCcw, Trash2, Award, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ArchivedStudent {
  id: string;
  name: string;
  phone: string | null;
  startDate: string;
  level: { number: number; name: string };
  group: { name: string; location: { name: string } };
}

export default function ArchivePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [students, setStudents] = useState<ArchivedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchArchivedStudents();
    }
  }, [isAuthenticated]);

  const fetchArchivedStudents = async () => {
    try {
      const response = await fetch('/api/students?archived=true');
      if (response.ok) {
        setStudents(await response.json());
      }
    } catch (error) {
      console.error('Error fetching archived students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      });

      if (response.ok) {
        setStudents(students.filter(s => s.id !== id));
        toast.success('تم استعادة الطالب بنجاح');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب نهائياً؟')) return;

    try {
      const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setStudents(students.filter(s => s.id !== id));
        toast.success('تم حذف الطالب نهائياً');
      }
    } catch (error) {
      toast.error('حدث خطأ');
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
                أرشيف الطلاب
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                الطلاب الذين أنهوا دراستهم أو تم أرشفتهم
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <Archive className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">إجمالي الأرشيف</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {students.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Archived Students */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <Archive className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg">الأرشيف فارغ</p>
                  <p className="text-slate-400 dark:text-slate-500 mt-1">
                    لا يوجد طلاب مؤرشفين حالياً
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <Card key={student.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{student.name}</CardTitle>
                          <Badge variant="secondary" className="mt-2">
                            {student.level.name}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestore(student.id)}
                            className="text-emerald-500 hover:bg-emerald-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(student.id)}
                            className="text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          <span>{student.group.location.name} - {student.group.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>بدأ: {new Date(student.startDate).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
