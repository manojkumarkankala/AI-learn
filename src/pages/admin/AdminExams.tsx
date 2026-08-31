import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import type { Career, Course, Exam } from '@/types/database';

export function AdminExams() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState({ title: '', description: '', exam_type: 'course', num_questions: 10, time_limit_minutes: 30, passing_score: 60, max_attempts: 3, published: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('careers').select('*').order('name').then(({ data }) => {
      if (data) { setCareers(data as Career[]); if (data.length > 0) setSelectedCareer(data[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!selectedCareer) return;
    supabase.from('courses').select('*').eq('career_id', selectedCareer).eq('published', true).order('course_order').then(({ data }) => {
      setCourses(data as Course[]); if (data && data.length > 0) setSelectedCourse(data[0].id);
    });
  }, [selectedCareer]);

  useEffect(() => { loadExams(); }, [selectedCareer, selectedCourse]);

  const loadExams = async () => {
    setLoading(true);
    let query = supabase.from('exams').select('*').order('created_at', { ascending: false });
    if (selectedCourse) query = query.eq('course_id', selectedCourse);
    else if (selectedCareer) query = query.eq('career_id', selectedCareer);
    const { data } = await query;
    setExams(data as Exam[]); setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', exam_type: 'course', num_questions: 10, time_limit_minutes: 30, passing_score: 60, max_attempts: 3, published: true }); setShowForm(true); };
  const openEdit = (e: Exam) => { setEditing(e); setForm({ title: e.title, description: e.description, exam_type: e.exam_type, num_questions: e.num_questions, time_limit_minutes: e.time_limit_minutes, passing_score: e.passing_score, max_attempts: e.max_attempts, published: e.published }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, career_id: selectedCareer, course_id: selectedCourse || null };
    if (editing) await supabase.from('exams').update(payload).eq('id', editing.id);
    else await supabase.from('exams').insert(payload);
    setSaving(false); setShowForm(false); loadExams();
  };

  const handleDelete = async (id: string) => { if (confirm('Delete this exam?')) { await supabase.from('exams').delete().eq('id', id); loadExams(); } };

  if (loading && !selectedCareer) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Exam Management</h1>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> New Exam</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div><label className="label">Career</label><select className="input" value={selectedCareer} onChange={(e) => setSelectedCareer(e.target.value)}>{careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label">Course (optional)</label><select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}><option value="">All courses</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      </div>

      {exams.length === 0 ? (
        <EmptyState icon={Brain} title="No exams" description="Create the first exam." action={<button onClick={openCreate} className="btn-primary">Create Exam</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <span className="badge bg-primary-50 text-primary-700">{e.exam_type}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit className="h-4 w-4 text-slate-500" /></button>
                  <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="h-4 w-4 text-error-500" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{e.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mt-1">{e.description}</p>
              <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500">
                <span>{e.num_questions} Q</span><span>{e.time_limit_minutes} min</span><span>Pass: {e.passing_score}%</span><span>{e.max_attempts} attempts</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editing ? 'Edit Exam' : 'New Exam'}</h2>
            <div className="space-y-4">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="label">Description</label><textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="label">Exam Type</label><select className="input" value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })}><option value="course">Course Exam</option><option value="lesson">Lesson Exam</option><option value="topic">Topic Exam</option><option value="revision">Revision Test</option><option value="final">Final Exam</option></select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Questions</label><input type="number" className="input" value={form.num_questions} onChange={(e) => setForm({ ...form, num_questions: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">Time (min)</label><input type="number" className="input" value={form.time_limit_minutes} onChange={(e) => setForm({ ...form, time_limit_minutes: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">Pass Score</label><input type="number" className="input" value={form.passing_score} onChange={(e) => setForm({ ...form, passing_score: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">Max Attempts</label><input type="number" className="input" value={form.max_attempts} onChange={(e) => setForm({ ...form, max_attempts: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /><span className="text-sm">Published</span></label>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button><button onClick={handleSave} disabled={saving || !form.title} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
