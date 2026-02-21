'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Users, Plus, Trash2, GraduationCap, MapPin, Loader2 } from 'lucide-react';
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
  _count?: { students: number };
}

export default function GroupsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    locationId: '',
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

  const fetchData = async () => {
    try {
      const [groupsRes, locationsRes, levelsRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/locations'),
        fetch('/api/levels'),
      ]);

      if (groupsRes.ok) setGroups(await groupsRes.json());
      if (locationsRes.ok) setLocations(await locationsRes.json());
      if (levelsRes.ok) setLevels(await levelsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroup.name.trim() || !newGroup.locationId || !newGroup.levelId) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      });

      if (response.ok) {
        const created = await response.json();
        setGroups([created, ...groups]);
        setNewGroup({ name: '', locationId: '', levelId: '' });
        setIsDialogOpen(false);
        toast.success('تم إضافة المجموعة بنجاح');
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

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المجموعة؟')) return;

    try {
      const response = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== id));
        toast.success('تم الحذف بنجاح');
      } else {
        toast.error('حدث خطأ');
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  إدارة المجموعات
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  إضافة وإدارة مجموعات الطلاب
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مجموعة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مجموعة جديدة</DialogTitle>
                    <DialogDescription>أدخل بيانات المجموعة</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>اسم المجموعة</Label>
                      <Input
                        placeholder="مثال: مجموعة الأسبوع صباحي"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المكان</Label>
                      <Select
                        value={newGroup.locationId}
                        onValueChange={(value) => setNewGroup({ ...newGroup, locationId: value })}
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
                      <Label>المستوى</Label>
                      <Select
                        value={newGroup.levelId}
                        onValueChange={(value) => setNewGroup({ ...newGroup, levelId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستوى" />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAddGroup}
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

            {/* Groups Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg">لا توجد مجموعات بعد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <Card key={group.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {group.level.name}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{group.location.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          <span>{group._count?.students || 0} طالب</span>
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
