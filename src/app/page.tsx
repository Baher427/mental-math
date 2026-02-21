'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  MapPin,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Award,
  Calendar,
} from 'lucide-react';

interface Stats {
  totalStudents: number;
  totalLocations: number;
  totalGroups: number;
  excellentStudents: number;
  needsAttention: number;
}

interface TopStudent {
  id: string;
  name: string;
  avgScore: number;
  level: number;
}

interface AlertStudent {
  id: string;
  name: string;
  trend: string;
  level: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalLocations: 0,
    totalGroups: 0,
    excellentStudents: 0,
    needsAttention: 0,
  });
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [alertStudents, setAlertStudents] = useState<AlertStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      fetchStats();
    }
  }, [_hasHydrated, isAuthenticated]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setTopStudents(data.topStudents || []);
        setAlertStudents(data.alertStudents || []);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!isAuthenticated) {
    return null;
  }

  const statCards = [
    {
      title: 'إجمالي الطلاب',
      value: stats.totalStudents,
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'الأماكن',
      value: stats.totalLocations,
      icon: MapPin,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'المجموعات',
      value: stats.totalGroups,
      icon: GraduationCap,
      color: 'from-purple-500 to-violet-600',
    },
    {
      title: 'الطلاب المتميزون',
      value: stats.excellentStudents,
      icon: Award,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                مرحباً، {user?.name} 👋
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                إليك نظرة عامة على أداء الطلاب
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                      >
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Top Students */}
              <Card className="lg:col-span-2 border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    أفضل الطلاب أداءً
                  </CardTitle>
                  <CardDescription>الطلاب المتميزون خلال آخر شهر</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : topStudents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد بيانات طلاب بعد</p>
                      <p className="text-sm mt-1">قم بإضافة طلاب لبدء التقييم</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topStudents.map((student, index) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                index === 0
                                  ? 'bg-amber-500'
                                  : index === 1
                                  ? 'bg-slate-400'
                                  : 'bg-orange-400'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                              <p className="text-sm text-slate-500">المستوى {student.level}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-emerald-600">{student.avgScore}%</p>
                            <p className="text-xs text-slate-500">متوسط الأداء</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Students Needing Attention */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    يحتاجون متابعة
                  </CardTitle>
                  <CardDescription>الطلاب الذين تراجع مستواهم</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : alertStudents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                      <p>ممتاز!</p>
                      <p className="text-sm mt-1">لا يوجد طلاب بحاجة متابعة</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alertStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20"
                        >
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                            <p className="text-sm text-slate-500">المستوى {student.level}</p>
                          </div>
                          <div className="flex items-center gap-1 text-red-500">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-sm font-medium">تراجع</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <a
                    href="/students"
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <GraduationCap className="w-8 h-8 text-emerald-500 mb-2" />
                    <span className="text-sm font-medium">إضافة طالب</span>
                  </a>
                  <a
                    href="/sessions"
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Calendar className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-sm font-medium">تقييم حصة</span>
                  </a>
                  <a
                    href="/analytics"
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <TrendingUp className="w-8 h-8 text-purple-500 mb-2" />
                    <span className="text-sm font-medium">التحليلات</span>
                  </a>
                  <a
                    href="/ai"
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <MapPin className="w-8 h-8 text-amber-500 mb-2" />
                    <span className="text-sm font-medium">تحليل AI</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6">
          <div className="max-w-7xl mx-auto text-center text-sm text-slate-500">
            <p>منصة تقييم الحساب الذهني © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
