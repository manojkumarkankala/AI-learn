import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import type { Career, Course, Lesson, Note } from '@/types/database';

export function AdminNotes() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: '', content: '', file_url: '', file_type: '', note_order: 0, published: true });
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

  useEffect(() => {
    if (!selectedCourse) return;
    supabase.from('lessons').select('*').eq('course_id', selectedCourse).eq('published', true).order('lesson_order').then(({ data }) => {
      setLessons(data as Lesson[]); if (data && data.length > 0) setSelectedLesson(data[0].id);
    });
  }, [selectedCourse]);

  useEffect(() => { if (selectedLesson) loadNotes(); }, [selectedLesson]);

  const loadNotes = async () => {
    setLoading(true);
    const { data } = await supabase.from('notes').select('*').eq('lesson_id', selectedLesson).order('note_order');
    setNotes(data as Note[]); setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', content: '', file_url: '', file_type: '', note_order: notes.length, published: true }); setShowForm(true); };
  const openEdit = (n: Note) => { setEditing(n); setForm({ title: n.title, content: n.content, file_url: n.file_url || '', file_type: n.file_type || '', note_order: n.note_order, published: n.published }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await supabase.from('notes').update(form).eq('id', editing.id);
    else await supabase.from('notes').insert({ ...form, lesson_id: selectedLesson, course_id: selectedCourse });
    setSaving(false); setShowForm(false); loadNotes();
  };

  const handleDelete = async (id: string) => { if (confirm('Delete this note?')) { await supabase.from('notes').delete().eq('id', id); loadNotes(); } };

  if (loading && !selectedCareer) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notes Management</h1>
        {selectedLesson && <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> New Note</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div><label className="label">Career</label><select className="input" value={selectedCareer} onChange={(e) => setSelectedCareer(e.target.value)}>{careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label">Course</label><select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
        <div><label className="label">Lesson</label><select className="input" value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)}>{lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
      </div>

      {!selectedLesson ? (
        <EmptyState icon={FileText} title="Select a lesson" description="Choose a lesson to manage its notes." />
      ) : notes.length === 0 ? (
        <EmptyState icon={Plus} title="No notes" description="Add the first note for this lesson." action={<button onClick={openCreate} className="btn-primary">Add Note</button>} />
      ) : (
        <div className="space-y-3">
          {notes.map((n, i) => (
            <div key={n.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">{String(i + 1).padStart(2, '0')}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{n.title}</div>
                <div className="text-sm text-slate-500 line-clamp-1">{n.content}</div>
                {n.file_url && <div className="text-xs text-primary-600 mt-1">📎 {n.file_type || 'File'} attached</div>}
              </div>
              <span className={`badge ${n.published ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'}`}>{n.published ? 'Published' : 'Draft'}</span>
              <button onClick={() => openEdit(n)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit className="h-4 w-4 text-slate-500" /></button>
              <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="h-4 w-4 text-error-500" /></button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editing ? 'Edit Note' : 'New Note'}</h2>
            <div className="space-y-4">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="label">Content</label><textarea className="input min-h-[160px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <div><label className="label">File URL (optional)</label><input className="input" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." /></div>
              <div><label className="label">File Type</label><input className="input" value={form.file_type} onChange={(e) => setForm({ ...form, file_type: e.target.value })} placeholder="pdf, doc, etc." /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /><span className="text-sm">Published</span></label>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button><button onClick={handleSave} disabled={saving || !form.title} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
