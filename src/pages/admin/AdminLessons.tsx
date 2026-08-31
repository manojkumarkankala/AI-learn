import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import type { Career, Course, Lesson } from '@/types/database';

export function AdminLessons() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState({ title: '', description: '', content: '', lesson_order: 0, estimated_minutes: 30, published: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('careers').select('*').order('name').then(({ data }) => {
      if (data) { setCareers(data as Career[]); if (data.length > 0) setSelectedCareer(data[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!selectedCareer) return;
    supabase.from('courses').select('*').eq('career_id', selectedCareer).eq('published', true).order('course_order').then(({ data }) => {
      setCourses(data as Course[]);
      if (data && data.length > 0) setSelectedCourse(data[0].id);
    });
  }, [selectedCareer]);

  useEffect(() => { if (selectedCourse) loadLessons(); }, [selectedCourse]);

  const loadLessons = async () => {
    setLoading(true);
    const { data } = await supabase.from('lessons').select('*').eq('course_id', selectedCourse).order('lesson_order');
    setLessons(data as Lesson[]);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', content: '', lesson_order: lessons.length, estimated_minutes: 30, published: true }); setShowForm(true); };
  const openEdit = (l: Lesson) => { setEditing(l); setForm({ title: l.title, description: l.description, content: l.content, lesson_order: l.lesson_order, estimated_minutes: l.estimated_minutes, published: l.published }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await supabase.from('lessons').update(form).eq('id', editing.id);
    else await supabase.from('lessons').insert({ ...form, course_id: selectedCourse });
    setSaving(false); setShowForm(false); loadLessons();
  };

  const handleDelete = async (id: string) => { if (confirm('Delete this lesson?')) { await supabase.from('lessons').delete().eq('id', id); loadLessons(); } };

  if (loading && !selectedCareer) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Lesson Management</h1>
        {selectedCourse && <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> New Lesson</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div><label className="label">Career</label><select className="input" value={selectedCareer} onChange={(e) => setSelectedCareer(e.target.value)}>{careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label">Course</label><select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      </div>

      {!selectedCourse ? (
        <EmptyState icon={Plus} title="Select a course" description="Choose a course to manage its lessons." />
      ) : lessons.length === 0 ? (
        <EmptyState icon={Plus} title="No lessons" description="Create the first lesson for this course." action={<button onClick={openCreate} className="btn-primary">Create Lesson</button>} />
      ) : (
        <div className="space-y-3">
          {lessons.map((l, i) => (
            <div key={l.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-sm font-bold text-primary-600">{i + 1}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{l.title}</div>
                <div className="text-sm text-slate-500">{l.description}</div>
                <div className="flex gap-2 mt-1"><span className="text-xs text-slate-500">{l.estimated_minutes} min</span><span className={`badge ${l.published ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'}`}>{l.published ? 'Published' : 'Draft'}</span></div>
              </div>
              <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit className="h-4 w-4 text-slate-500" /></button>
              <button onClick={() => handleDelete(l.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="h-4 w-4 text-error-500" /></button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editing ? 'Edit Lesson' : 'New Lesson'}</h2>
            <div className="space-y-4">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="label">Description</label><textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="label">Content</label><textarea className="input min-h-[120px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Est. Minutes</label><input type="number" className="input" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">Order</label><input type="number" className="input" value={form.lesson_order} onChange={(e) => setForm({ ...form, lesson_order: parseInt(e.target.value) || 0 })} /></div>
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
