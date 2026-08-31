import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2, X, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import { slugify } from '@/lib/utils';
import type { Career } from '@/types/database';

const iconOptions = ['BookOpen', 'Brain', 'TrendingUp', 'Zap', 'GraduationCap', 'Target', 'Code', 'Database', 'Cloud', 'Shield'];

interface CareerForm {
  name: string;
  slug: string;
  description: string;
  icon: string;
  difficulty: string;
  estimated_hours: number;
  published: boolean;
  image_url: string;
  long_description: string;
  syllabus: string;
}

const emptyForm: CareerForm = {
  name: '',
  slug: '',
  description: '',
  icon: 'BookOpen',
  difficulty: 'Beginner',
  estimated_hours: 100,
  published: true,
  image_url: '',
  long_description: '',
  syllabus: '',
};

export function AdminCareers() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Career | null>(null);
  const [form, setForm] = useState<CareerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<Career | null>(null);

  useEffect(() => { loadCareers(); }, []);

  const loadCareers = async () => {
    setLoading(true);
    const { data } = await supabase.from('careers').select('*').order('name');
    if (data) setCareers(data as Career[]);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (career: Career) => {
    setEditing(career);
    setForm({
      name: career.name,
      slug: career.slug,
      description: career.description,
      icon: career.icon,
      difficulty: career.difficulty,
      estimated_hours: career.estimated_hours,
      published: career.published,
      image_url: career.image_url || '',
      long_description: career.long_description || '',
      syllabus: career.syllabus || '',
    });
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `career-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('career-images')
      .upload(fileName, file, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('career-images')
        .getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    if (editing) {
      await supabase.from('careers').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('careers').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    loadCareers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this career? This will also delete all related content.')) return;
    await supabase.from('careers').delete().eq('id', id);
    loadCareers();
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Career Management</h1>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> New Career</button>
      </div>

      {careers.length === 0 ? (
        <EmptyState icon={Plus} title="No careers yet" description="Create your first career path with notes, lessons, roadmaps, and images." action={<button onClick={openCreate} className="btn-primary">Create Career</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {careers.map((career) => (
            <div key={career.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              {career.image_url ? (
                <div className="h-32 w-full overflow-hidden bg-slate-100">
                  <img src={career.image_url} alt={career.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-slate-300" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`badge ${career.published ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'}`}>
                    {career.published ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => setViewing(career)} className="p-1.5 rounded-lg hover:bg-slate-100" title="View"><Eye className="h-4 w-4 text-slate-500" /></button>
                    <button onClick={() => openEdit(career)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit className="h-4 w-4 text-slate-500" /></button>
                    <button onClick={() => handleDelete(career.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="h-4 w-4 text-error-500" /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900">{career.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{career.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className="badge bg-primary-50 text-primary-700">{career.difficulty}</span>
                  <span className="text-xs text-slate-500">{career.estimated_hours}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{editing ? 'Edit Career' : 'New Career'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="label">Career Image</label>
                <div className="flex items-center gap-4">
                  {form.image_url ? (
                    <div className="relative h-24 w-40 rounded-xl overflow-hidden border border-slate-200">
                      <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                      <button onClick={() => setForm({ ...form, image_url: '' })} className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 w-40 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                      {uploading ? <Loader2 className="h-6 w-6 text-slate-400 animate-spin" /> : <ImageIcon className="h-6 w-6 text-slate-400" />}
                      <span className="text-xs text-slate-500 mt-1">Upload image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                    </label>
                  )}
                  <div className="flex-1">
                    <input className="input" placeholder="Or paste image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                    <p className="text-xs text-slate-400 mt-1">Upload an image or paste a URL</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Career Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <label className="label">Slug</label>
                <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <label className="label">Short Description</label>
                <textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description shown on cards" />
              </div>
              <div>
                <label className="label">Long Description</label>
                <textarea className="input min-h-[100px]" value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} placeholder="Detailed description shown on career detail page" />
              </div>
              <div>
                <label className="label">Syllabus / Topics</label>
                <textarea className="input min-h-[100px]" value={form.syllabus} onChange={(e) => setForm({ ...form, syllabus: e.target.value })} placeholder="One topic per line, e.g.&#10;HTML & CSS&#10;JavaScript Basics&#10;React Framework" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Icon</label>
                  <select className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                    {iconOptions.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Estimated Hours</label>
                <input type="number" className="input" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: parseInt(e.target.value) || 0 })} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                <span className="text-sm text-slate-700">Published (visible to students)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Career'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Career Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {viewing.image_url && (
              <div className="h-48 w-full overflow-hidden rounded-t-2xl">
                <img src={viewing.image_url} alt={viewing.name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">{viewing.name}</h2>
                <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <div className="flex gap-2 mb-4">
                <span className="badge bg-primary-50 text-primary-700">{viewing.difficulty}</span>
                <span className="badge bg-slate-100 text-slate-600">{viewing.estimated_hours}h</span>
                <span className={`badge ${viewing.published ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'}`}>
                  {viewing.published ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-4">{viewing.description}</p>
              {viewing.long_description && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">About</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{viewing.long_description}</p>
                </div>
              )}
              {viewing.syllabus && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Syllabus</h3>
                  <div className="space-y-1">
                    {viewing.syllabus.split('\n').filter(Boolean).map((topic, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">{i + 1}</span>
                        {topic}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setViewing(null)} className="btn-secondary flex-1">Close</button>
                <button onClick={() => { openEdit(viewing); setViewing(null); }} className="btn-primary flex-1"><Edit className="h-4 w-4" /> Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
