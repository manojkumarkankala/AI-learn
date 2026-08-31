import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';

interface ResultAttempt {
  id: string;
  percentage: number;
  passed: boolean;
  time_taken_seconds: number;
  completed_at: string;
  status: string;
  user?: { full_name: string };
  exam?: { title: string };
}

export function AdminResults() {
  const [attempts, setAttempts] = useState<ResultAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => { loadResults(); }, [page]);

  const loadResults = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exam_attempts')
      .select(`
        id, percentage, passed, time_taken_seconds, completed_at, status,
        user:profiles!exam_attempts_user_id_fkey(full_name),
        exam:exams!exam_attempts_exam_id_fkey(title)
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    setAttempts((data || []) as unknown as ResultAttempt[]);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Exam Results</h1>

      {attempts.length === 0 ? (
        <EmptyState icon={BarChart3} title="No exam results" description="No students have completed exams yet." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Exam</th>
                  <th className="text-left px-4 py-3 font-medium">Score</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Time</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{a.user?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-slate-500">{a.exam?.title || 'Unknown'}</td>
                    <td className="px-4 py-3"><span className="font-bold text-slate-900">{Math.round(a.percentage)}%</span></td>
                    <td className="px-4 py-3">
                      <span className={`badge ${a.passed ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
                        {a.passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {a.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{Math.floor(a.time_taken_seconds / 60)}m {a.time_taken_seconds % 60}s</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {page + 1}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(page + 1)} disabled={attempts.length < pageSize} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
