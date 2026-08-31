import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import type { Exam, Question, QuestionOption } from '@/types/database';

export function AdminQuestions() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [questions, setQuestions] = useState<(Question & { question_options: QuestionOption[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState({ question: '', question_type: 'multiple_choice', correct_answer: '', explanation: '', difficulty: 'Easy', topic: '', points: 1, approved: true });
  const [options, setOptions] = useState<{ option_text: string; is_correct: boolean }[]>([{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('exams').select('*').order('title').then(({ data }) => {
      if (data) { setExams(data as Exam[]); if (data.length > 0) setSelectedExam(data[0].id); }
    });
  }, []);

  useEffect(() => { if (selectedExam) loadQuestions(); }, [selectedExam]);

  const loadQuestions = async () => {
    setLoading(true);
    const { data } = await supabase.from('questions').select('*, question_options(*)').eq('exam_id', selectedExam).order('created_at', { ascending: false });
    setQuestions(data as (Question & { question_options: QuestionOption[] })[]); setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ question: '', question_type: 'multiple_choice', correct_answer: '', explanation: '', difficulty: 'Easy', topic: '', points: 1, approved: true });
    setOptions([{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }]);
    setShowForm(true);
  };

  const openEdit = (q: Question & { question_options: QuestionOption[] }) => {
    setEditing(q);
    setForm({ question: q.question, question_type: q.question_type, correct_answer: q.correct_answer, explanation: q.explanation, difficulty: q.difficulty, topic: q.topic, points: q.points, approved: q.approved });
    setOptions(q.question_options.length > 0 ? q.question_options.map((o) => ({ option_text: o.option_text, is_correct: o.is_correct })) : [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }]);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const validOptions = options.filter((o) => o.option_text.trim());
    const correctOpt = validOptions.find((o) => o.is_correct);
    const payload = { ...form, exam_id: selectedExam, correct_answer: correctOpt ? correctOpt.option_text : form.correct_answer, approved: true };

    if (editing) {
      await supabase.from('questions').update(payload).eq('id', editing.id);
      if (form.question_type === 'multiple_choice' || form.question_type === 'true_false' || form.question_type === 'multiple_select') {
        await supabase.from('question_options').delete().eq('question_id', editing.id);
        if (validOptions.length > 0) {
          await supabase.from('question_options').insert(validOptions.map((o, i) => ({ question_id: editing.id, option_text: o.option_text, is_correct: o.is_correct, option_order: i })));
        }
      }
    } else {
      const { data: newQ } = await supabase.from('questions').insert(payload).select().maybeSingle();
      if (newQ && validOptions.length > 0 && (form.question_type === 'multiple_choice' || form.question_type === 'true_false' || form.question_type === 'multiple_select')) {
        await supabase.from('question_options').insert(validOptions.map((o, i) => ({ question_id: newQ.id, option_text: o.option_text, is_correct: o.is_correct, option_order: i })));
      }
    }
    setSaving(false); setShowForm(false); loadQuestions();
  };

  const handleDelete = async (id: string) => { if (confirm('Delete this question?')) { await supabase.from('questions').delete().eq('id', id); loadQuestions(); } };

  if (loading && !selectedExam) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Question Bank</h1>
        {selectedExam && <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> New Question</button>}
      </div>

      <div className="mb-6">
        <label className="label">Select Exam</label>
        <select className="input max-w-xs" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {!selectedExam ? (
        <EmptyState icon={HelpCircle} title="Select an exam" description="Choose an exam to manage its questions." />
      ) : questions.length === 0 ? (
        <EmptyState icon={Plus} title="No questions" description="Add the first question or use the AI Generator." action={<button onClick={openCreate} className="btn-primary">Add Question</button>} />
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600 flex-shrink-0">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-slate-100 text-slate-600">{q.question_type}</span>
                    <span className="badge bg-primary-50 text-primary-700">{q.difficulty}</span>
                    {q.topic && <span className="text-xs text-slate-500">{q.topic}</span>}
                    {q.approved ? <CheckCircle className="h-4 w-4 text-success-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}
                  </div>
                  <p className="text-sm font-medium text-slate-900">{q.question}</p>
                  {q.question_options && q.question_options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {q.question_options.map((o) => (
                        <div key={o.id} className={`text-xs flex items-center gap-1 ${o.is_correct ? 'text-success-700' : 'text-slate-500'}`}>
                          {o.is_correct ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-slate-300" />}
                          {o.option_text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit className="h-4 w-4 text-slate-500" /></button>
                <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg hover:bg-error-50"><Trash2 className="h-4 w-4 text-error-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editing ? 'Edit Question' : 'New Question'}</h2>
            <div className="space-y-4">
              <div><label className="label">Question</label><textarea className="input min-h-[80px]" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Type</label><select className="input" value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value })}><option value="multiple_choice">Multiple Choice</option><option value="true_false">True/False</option><option value="multiple_select">Multiple Select</option><option value="short_answer">Short Answer</option><option value="fill_blank">Fill in the Blank</option></select></div>
                <div><label className="label">Difficulty</label><select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
              </div>
              <div><label className="label">Topic</label><input className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>

              {(form.question_type === 'multiple_choice' || form.question_type === 'true_false' || form.question_type === 'multiple_select') && (
                <div>
                  <label className="label">Options</label>
                  <div className="space-y-2">
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type={form.question_type === 'multiple_select' ? 'checkbox' : 'radio'} name="correct" checked={opt.is_correct} onChange={() => setOptions(options.map((o, j) => ({ ...o, is_correct: form.question_type === 'multiple_select' ? (j === i ? !o.is_correct : o.is_correct) : j === i })))} className="h-4 w-4" />
                        <input className="input flex-1" placeholder={`Option ${i + 1}`} value={opt.option_text} onChange={(e) => setOptions(options.map((o, j) => j === i ? { ...o, option_text: e.target.value } : o))} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(form.question_type === 'short_answer' || form.question_type === 'fill_blank') && (
                <div><label className="label">Correct Answer</label><input className="input" value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} /></div>
              )}

              <div><label className="label">Explanation</label><textarea className="input min-h-[60px]" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} /></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button><button onClick={handleSave} disabled={saving || !form.question} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
