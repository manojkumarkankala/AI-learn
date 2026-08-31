import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Video as VideoIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import type { Career, Course, Lesson, Video } from '@/types/database';

export function AdminVideos() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState({ title: '', video_url: '', thumbnail_url: '', duration_minutes: 10, description: '', video_order: 0, published: true });
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

  useEffect(() => { if (selectedLesson) loadVideos(); }, [selectedLesson]);

  const loadVideos = async () => {
    setLoading(true);
    const { data } = await supabase.from('videos').select('*').eq('lesson_id', selectedLesson).order('video_order');
    setVideos(data as Video[]); setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', video_url: '', thumbnail_url: '', duration_minutes: 10, description: '', video_order: videos.length, published: true }); setShowForm(true); };
  const openEdit = (v: Video) => { setEditing(v); setForm({ title: v.title, video_url: v.video_url, thumbnail_url: v.thumbnail_url || '', duration_minutes: v.duration_minutes, description: v.description, video_order: v.video_order, published: v.published }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await supabase.from('videos').update(form).eq('id', editing.id);
    else await supabase.from('videos').insert({ ...form, lesson_id: selectedLesson, course_id: selectedCourse });
    setSaving(false); setShowForm(false); loadVideos();
  };

  const handleDelete = async (id: string) => { if (confirm('Delete this video?')) { await supabase.from('videos').delete().eq('id', id); loadVideos(); } };

  if (loading && !selectedCareer) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Video Management</h1>
        {selectedLesson && <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> New Video</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div><label className="label">Career</label><select className="input" value={selectedCareer} onChange={(e) => setSelectedCareer(e.target.value)}>{careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label">Course</label><select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
        <div><label className="label">Lesson</label><select className="input" value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)}>{lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
      </div>

      {!selectedLesson ? (
        <EmptyState icon={VideoIcon} title="Select a lesson" description="Choose a lesson to manage its videos." />
      ) : videos.length === 0 ? (
        <EmptyState icon={Plus} title="No videos" description="Add the first video for this lesson." action={<button onClick={openCreate} className="btn-primary">Add Video</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <span className={`badge ${v.published ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'}`}>{v.published ? 'Published' : 'Draft'}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit className="h-4 w-4 text-slate-500" /></button>
                  <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="h-4 w-4 text-error-500" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{v.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mt-1">{v.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">{v.duration_minutes} min</span>
                {v.duration_minutes > 40 && <span className="badge bg-warning-50 text-warning-700 text-xs"><AlertCircle className="h-3 w-3" /> Long</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editing ? 'Edit Video' : 'New Video'}</h2>
            <div className="space-y-4">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="label">Video URL (YouTube or direct link)</label><input className="input" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></div>
              <div><label className="label">Thumbnail URL (optional)</label><input className="input" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} /></div>
              <div><label className="label">Duration (minutes)</label><input type="number" className="input" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })} /></div>
              <div><label className="label">Description</label><textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /><span className="text-sm">Published</span></label>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button><button onClick={handleSave} disabled={saving || !form.title || !form.video_url} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
