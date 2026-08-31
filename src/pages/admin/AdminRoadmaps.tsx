import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import type { Career, Roadmap, RoadmapStep } from '@/types/database';

export function AdminRoadmaps() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<string>('');
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStep, setEditingStep] = useState<RoadmapStep | null>(null);
  const [form, setForm] = useState({ title: '', description: '', step_order: 0, icon: 'Circle' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('careers').select('*').order('name').then(({ data }) => {
      if (data) { setCareers(data as Career[]); if (data.length > 0) setSelectedCareer(data[0].id); }
    });
  }, []);

  useEffect(() => { if (selectedCareer) loadRoadmap(); }, [selectedCareer]);

  const loadRoadmap = async () => {
    setLoading(true);
    const { data: rm } = await supabase.from('roadmaps').select('*').eq('career_id', selectedCareer).maybeSingle();
    setRoadmap(rm as Roadmap | null);
    if (rm) {
      const { data: s } = await supabase.from('roadmap_steps').select('*').eq('roadmap_id', rm.id).order('step_order');
      setSteps(s as RoadmapStep[]);
    } else { setSteps([]); }
    setLoading(false);
  };

  const ensureRoadmap = async (): Promise<string> => {
    if (roadmap) return roadmap.id;
    const { data } = await supabase.from('roadmaps').insert({ career_id: selectedCareer, title: 'Main Roadmap' }).select().maybeSingle();
    if (data) { setRoadmap(data as Roadmap); return data.id; }
    return '';
  };

  const openCreate = () => { setEditingStep(null); setForm({ title: '', description: '', step_order: steps.length, icon: 'Circle' }); setShowForm(true); };
  const openEdit = (step: RoadmapStep) => { setEditingStep(step); setForm({ title: step.title, description: step.description, step_order: step.step_order, icon: step.icon }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    const rmId = await ensureRoadmap();
    if (!rmId) { setSaving(false); return; }
    if (editingStep) {
      await supabase.from('roadmap_steps').update({ ...form, roadmap_id: rmId }).eq('id', editingStep.id);
    } else {
      await supabase.from('roadmap_steps').insert({ ...form, roadmap_id: rmId });
    }
    setSaving(false); setShowForm(false); loadRoadmap();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this step?')) return;
    await supabase.from('roadmap_steps').delete().eq('id', id);
    loadRoadmap();
  };

  const moveStep = async (step: RoadmapStep, dir: -1 | 1) => {
    const idx = steps.indexOf(step);
    const target = steps[idx + dir];
    if (!target) return;
    await supabase.from('roadmap_steps').update({ step_order: target.step_order }).eq('id', step.id);
    await supabase.from('roadmap_steps').update({ step_order: step.step_order }).eq('id', target.id);
    loadRoadmap();
  };

  if (loading && !selectedCareer) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Roadmap Builder</h1>
        {selectedCareer && <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add Step</button>}
      </div>

      <div className="mb-6">
        <label className="label">Select Career</label>
        <select className="input max-w-xs" value={selectedCareer} onChange={(e) => setSelectedCareer(e.target.value)}>
          {careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedCareer ? (
        <EmptyState icon={Plus} title="Select a career" description="Choose a career to manage its roadmap." />
      ) : steps.length === 0 ? (
        <EmptyState icon={Plus} title="No roadmap steps" description="Add the first step to this career's roadmap." action={<button onClick={openCreate} className="btn-primary">Add Step</button>} />
      ) : (
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={step.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveStep(step, -1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                <button onClick={() => moveStep(step, 1)} disabled={i === steps.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-sm font-bold text-primary-600">{i + 1}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{step.title}</div>
                <div className="text-sm text-slate-500">{step.description}</div>
              </div>
              <button onClick={() => openEdit(step)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit className="h-4 w-4 text-slate-500" /></button>
              <button onClick={() => handleDelete(step.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="h-4 w-4 text-error-500" /></button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editingStep ? 'Edit Step' : 'Add Step'}</h2>
            <div className="space-y-4">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="label">Description</label><textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="label">Order</label><input type="number" className="input" value={form.step_order} onChange={(e) => setForm({ ...form, step_order: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
