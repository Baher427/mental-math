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
import { MapPin, Plus, Trash2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  _count?: { groups: number };
}

export default function LocationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLocations();
    }
  }, [isAuthenticated]);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) {
      toast.error('يرجى إدخال اسم المكان');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLocationName }),
      });

      if (response.ok) {
        const newLocation = await response.json();
        setLocations([newLocation, ...locations]);
        setNewLocationName('');
        setIsDialogOpen(false);
        toast.success('تم إضافة المكان بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة المكان');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المكان؟')) return;

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLocations(locations.filter((l) => l.id !== id));
        toast.success('تم حذف المكان بنجاح');
      } else {
        toast.error('حدث خطأ أثناء الحذف');
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
                  إدارة الأماكن
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  إضافة وإدارة الفروع والأماكن
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مكان
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مكان جديد</DialogTitle>
                    <DialogDescription>أدخل اسم المكان أو الفرع</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>اسم المكان</Label>
                      <Input
                        placeholder="مثال: فرع مدينة نصر"
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleAddLocation}
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

            {/* Locations Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : locations.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <MapPin className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg">لا توجد أماكن بعد</p>
                  <p className="text-slate-400 dark:text-slate-500 mt-1">
                    ابدأ بإضافة مكان جديد
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map((location) => (
                  <Card key={location.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{location.name}</CardTitle>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLocation(location.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users className="w-4 h-4" />
                        <span>{location._count?.groups || 0} مجموعات</span>
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
