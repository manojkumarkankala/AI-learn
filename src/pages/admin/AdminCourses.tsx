import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import { slugify } from '@/lib/utils';
import type { Career, RoadmapStep, Course } from '@/types/database';

export function AdminCourses() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedStep, setSelectedStep] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', difficulty: 'Beginner', estimated_time: 60, course_order: 0, published: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('careers').select('*').order('name').then(({ data }) => {
      if (data) { setCareers(data as Career[]); if (data.length > 0) setSelectedCareer(data[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!selectedCareer) return;
    supabase.from('roadmaps').select('id').eq('career_id', selectedCareer).maybeSingle().then(({ data: rm }) => {
      if (rm) supabase.from('roadmap_steps').select('*').eq('roadmap_id', rm.id).order('step_order').then(({ data: s }) => {
        setSteps(s as RoadmapStep[]);
        if (s && s.length > 0) setSelectedStep(s[0].id);
      });
    });
  }, [selectedCareer]);

  useEffect(() => { if (selectedStep) loadCourses(); }, [selectedStep]);

  const loadCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*').eq('roadmap_step_id', selectedStep).order('course_order');
    setCourses(data as Course[]);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', slug: '', description: '', difficulty: 'Beginner', estimated_time: 60, course_order: courses.length, published: true }); setShowForm(true); };
  const openEdit = (c: Course) => { setEditing(c); setForm({ title: c.title, slug: c.slug, description: c.description, difficulty: c.difficulty, estimated_time: c.estimated_time, course_order: c.course_order, published: c.published }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.title), career_id: selectedCareer, roadmap_step_id: selectedStep };
    if (editing) await supabase.from('courses').update(payload).eq('id', editing.id);
    else await supabase.from('courses').insert(payload);
    setSaving(false); setShowForm(false); loadCourses();
  };

  const handleDelete = async (id: string) => { if (confirm('Delete this course?')) { await supabase.from('courses').delete().eq('id', id); loadCourses(); } };

  if (loading && !selectedCareer) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Course Management</h1>
        {selectedStep && <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> New Course</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div><label className="label">Career</label><select className="input" value={selectedCareer} onChange={(e) => setSelectedCareer(e.target.value)}>{careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label">Roadmap Step</label><select className="input" value={selectedStep} onChange={(e) => setSelectedStep(e.target.value)}>{steps.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
      </div>

      {!selectedStep ? (
        <EmptyState icon={Plus} title="Select a step" description="Choose a roadmap step to manage its courses." />
      ) : courses.length === 0 ? (
        <EmptyState icon={Plus} title="No courses" description="Create the first course for this step." action={<button onClick={openCreate} className="btn-primary">Create Course</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <span className={`badge ${c.published ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'}`}>{c.published ? 'Published' : 'Draft'}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit className="h-4 w-4 text-slate-500" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="h-4 w-4 text-error-500" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{c.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mt-1">{c.description}</p>
              <div className="flex gap-2 mt-3"><span className="badge bg-primary-50 text-primary-700">{c.difficulty}</span><span className="text-xs text-slate-500">{c.estimated_time} min</span></div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editing ? 'Edit Course' : 'New Course'}</h2>
            <div className="space-y-4">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} /></div>
              <div><label className="label">Description</label><textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Difficulty</label><select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                <div><label className="label">Est. Minutes</label><input type="number" className="input" value={form.estimated_time} onChange={(e) => setForm({ ...form, estimated_time: parseInt(e.target.value) || 0 })} /></div>
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
