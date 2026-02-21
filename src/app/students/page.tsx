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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Plus, Trash2, Search, MapPin, Phone, FileText, Loader2, Archive, RotateCcw } from 'lucide-react';
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
}

interface Student {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  startDate: string;
  isArchived: boolean;
  isActive: boolean;
  level: { id: string; number: number; name: string };
  group: { id: string; name: string; location: { name: string } };
}

export default function StudentsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('active');
  const [newStudent, setNewStudent] = useState({
    name: '',
    phone: '',
    notes: '',
    groupId: '',
    levelId: '',
  });

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
    if (newStudent.groupId) {
      const group = groups.find(g => g.id === newStudent.groupId);
      if (group) {
        setNewStudent(prev => ({ ...prev, levelId: group.level.id }));
      }
    }
  }, [newStudent.groupId, groups]);

  const fetchData = async () => {
    try {
      const [studentsRes, locationsRes, levelsRes, groupsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/locations'),
        fetch('/api/levels'),
        fetch('/api/groups'),
      ]);

      if (studentsRes.ok) setStudents(await studentsRes.json());
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
    ? groups.filter(g => g.location.id === selectedLocationId)
    : groups;

  const handleAddStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.groupId || !newStudent.levelId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });

      if (response.ok) {
        const created = await response.json();
        setStudents([created, ...students]);
        setNewStudent({ name: '', phone: '', notes: '', groupId: '', levelId: '' });
        setIsDialogOpen(false);
        toast.success('تم إضافة الطالب بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;

    try {
      const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setStudents(students.filter((s) => s.id !== id));
        toast.success('تم الحذف بنجاح');
      } else {
        toast.error('حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleArchiveStudent = async (id: string, archive: boolean) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: archive }),
      });
      if (response.ok) {
        const updated = await response.json();
        setStudents(students.map(s => s.id === id ? updated : s));
        toast.success(archive ? 'تم أرشفة الطالب' : 'تم استعادة الطالب');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const filteredStudents = students
    .filter(s => activeTab === 'active' ? !s.isArchived : s.isArchived)
    .filter(s => !searchTerm || s.name.includes(searchTerm))
    .filter(s => !selectedLocationId || s.group.location.id === selectedLocationId);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  إدارة الطلاب
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  إضافة وإدارة طلاب الحساب الذهني
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة طالب
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة طالب جديد</DialogTitle>
                    <DialogDescription>أدخل بيانات الطالب</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>اسم الطالب *</Label>
                      <Input
                        placeholder="أحمد محمد علي"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input
                        placeholder="01xxxxxxxxx"
                        value={newStudent.phone}
                        onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المكان</Label>
                      <Select
                        value={selectedLocationId}
                        onValueChange={setSelectedLocationId}
                      >
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
                      <Label>المجموعة *</Label>
                      <Select
                        value={newStudent.groupId}
                        onValueChange={(value) => setNewStudent({ ...newStudent, groupId: value })}
                      >
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
                      <Label>ملاحظات</Label>
                      <Textarea
                        placeholder="ملاحظات إضافية..."
                        value={newStudent.notes}
                        onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <Button
                      onClick={handleAddStudent}
                      disabled={isSaving}
                      className="w-full bg-emerald-500 hover:bg-emerald-600"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        'حفظ'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="البحث عن طالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="كل الأماكن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">كل الأماكن</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active">
                  الطلاب النشطون ({students.filter(s => !s.isArchived).length})
                </TabsTrigger>
                <TabsTrigger value="archived">
                  الأرشيف ({students.filter(s => s.isArchived).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                      <GraduationCap className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 text-lg">
                        {activeTab === 'active' ? 'لا يوجد طلاب' : 'لا يوجد طلاب في الأرشيف'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => (
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
                              {student.isArchived ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleArchiveStudent(student.id, false)}
                                  className="text-emerald-500 hover:bg-emerald-50"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleArchiveStudent(student.id, true)}
                                  className="text-amber-500 hover:bg-amber-50"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{student.group.location.name} - {student.group.name}</span>
                            </div>
                            {student.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{student.phone}</span>
                              </div>
                            )}
                            {student.notes && (
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 mt-0.5" />
                                <span className="line-clamp-2">{student.notes}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
