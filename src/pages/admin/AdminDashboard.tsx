import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, FileText, Video, Brain, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  joined_date: string;
  selected_career?: { name: string };
}

interface Stats {
  totalStudents: number;
  totalCareers: number;
  totalCourses: number;
  totalLessons: number;
  totalVideos: number;
  totalNotes: number;
  totalExams: number;
  totalQuestions: number;
  completedCareers: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const [
      { count: students },
      { count: careers },
      { count: courses },
      { count: lessons },
      { count: videos },
      { count: notes },
      { count: exams },
      { count: questions },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('careers').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase.from('videos').select('*', { count: 'exact', head: true }),
      supabase.from('notes').select('*', { count: 'exact', head: true }),
      supabase.from('exams').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      totalStudents: students || 0,
      totalCareers: careers || 0,
      totalCourses: courses || 0,
      totalLessons: lessons || 0,
      totalVideos: videos || 0,
      totalNotes: notes || 0,
      totalExams: exams || 0,
      totalQuestions: questions || 0,
      completedCareers: 0,
    });

    const { data: recent } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, joined_date, selected_career:careers!selected_career_id(name)')
      .order('joined_date', { ascending: false })
      .limit(5);
    if (recent) setRecentUsers(recent as unknown as RecentUser[]);

    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>;
  }

  const cards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Careers', value: stats?.totalCareers || 0, icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Lessons', value: stats?.totalLessons || 0, icon: FileText, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Videos', value: stats?.totalVideos || 0, icon: Video, color: 'bg-rose-50 text-rose-600' },
    { label: 'Total Notes', value: stats?.totalNotes || 0, icon: FileText, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Total Exams', value: stats?.totalExams || 0, icon: Brain, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Total Questions', value: stats?.totalQuestions || 0, icon: HelpCircle, color: 'bg-teal-50 text-teal-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 p-5"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color} mb-3`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Students</h2>
        {recentUsers.length === 0 ? (
          <p className="text-sm text-slate-400">No students registered yet.</p>
        ) : (
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100">
                  <span className="text-sm font-semibold text-primary-700">
                    {user.full_name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{user.full_name}</div>
                  <div className="text-xs text-slate-500 truncate">{user.email}</div>
                </div>
                <div className="text-xs text-slate-500">
                  {user.selected_career?.name || 'No career'}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(user.joined_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
