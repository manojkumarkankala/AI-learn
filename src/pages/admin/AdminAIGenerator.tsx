import { useEffect, useState } from 'react';
import { Sparkles, Brain, CheckCircle, XCircle, Trash2, FileText, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import type { Career, Course, Lesson, Note, AIDocumentAnalysis, AIGeneratedQuestion } from '@/types/database';

export function AdminAIGenerator() {
  const { profile } = useAuth();
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedNote, setSelectedNote] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<AIGeneratedQuestion[]>([]);
  const [analyses, setAnalyses] = useState<AIDocumentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('careers').select('*').order('name').then(({ data }) => {
      if (data) { setCareers(data as Career[]); if (data.length > 0) setSelectedCareer(data[0].id); }
    });
    loadAnalyses();
  }, []);

  useEffect(() => {
    if (!selectedCareer) return;
    supabase.from('courses').select('*').eq('career_id', selectedCareer).order('course_order').then(({ data }) => {
      setCourses(data as Course[]); if (data && data.length > 0) setSelectedCourse(data[0].id);
    });
  }, [selectedCareer]);

  useEffect(() => {
    if (!selectedCourse) return;
    supabase.from('lessons').select('*').eq('course_id', selectedCourse).order('lesson_order').then(({ data }) => {
      setLessons(data as Lesson[]); if (data && data.length > 0) setSelectedLesson(data[0].id);
    });
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedLesson) return;
    supabase.from('notes').select('*').eq('lesson_id', selectedLesson).eq('published', true).order('note_order').then(({ data }) => {
      setNotes(data as Note[]); if (data && data.length > 0) setSelectedNote(data[0].id);
    });
  }, [selectedLesson]);

  const loadAnalyses = async () => {
    const { data } = await supabase.from('ai_document_analysis').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setAnalyses(data as AIDocumentAnalysis[]);
    setLoading(false);
  };

  const generateQuestions = async () => {
    if (!selectedNote || !profile) return;
    setGenerating(true);
    setGenError(null);
    setGeneratedQuestions([]);

    const steps = [
      'Extracting content...',
      'Detecting topics...',
      'Identifying concepts...',
      'Generating questions...',
      'Checking quality...',
    ];

    for (const step of steps) {
      setGenStep(step);
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const { data: note } = await supabase.from('notes').select('*').eq('id', selectedNote).maybeSingle();
      if (!note) { setGenError('Note not found.'); setGenerating(false); return; }

      const { data: analysis } = await supabase.from('ai_document_analysis').insert({
        admin_id: profile.id,
        course_id: selectedCourse || null,
        lesson_id: selectedLesson || null,
        note_id: selectedNote,
        document_name: note.title,
        extracted_text: note.content,
        topics: [],
        concepts: [],
        summary: 'Manual question generation',
        status: 'completed',
        potential_questions: numQuestions,
      }).select().maybeSingle();

      if (!analysis) { setGenError('Failed to create analysis record.'); setGenerating(false); return; }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-exam-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          analysisId: analysis.id,
          noteContent: note.content,
          noteTitle: note.title,
          numQuestions,
          difficulty,
          courseId: selectedCourse,
          lessonId: selectedLesson,
        }),
      });

      if (!response.ok) {
        setGenError('AI generation failed. Please check if the Gemini API key is configured.');
        setGenerating(false);
        return;
      }

      const result = await response.json();
      if (result.questions && result.questions.length > 0) {
        const { data: saved } = await supabase.from('ai_generated_questions').select('*').eq('analysis_id', analysis.id).order('created_at', { ascending: false });
        setGeneratedQuestions((saved as AIGeneratedQuestion[]) || []);
      } else if (result.error) {
        setGenError(result.error);
      } else {
        setGenError('No questions were generated. The note may not have enough content.');
      }
    } catch {
      setGenError('An error occurred during generation. Please try again.');
    }

    setGenStep('');
    setGenerating(false);
    loadAnalyses();
  };

  const approveQuestion = async (q: AIGeneratedQuestion) => {
    await supabase.from('ai_generated_questions').update({ status: 'approved', reviewed_by: profile?.id, reviewed_at: new Date().toISOString() }).eq('id', q.id);
    setGeneratedQuestions(generatedQuestions.map((gq) => gq.id === q.id ? { ...gq, status: 'approved' } : gq));
  };

  const rejectQuestion = async (q: AIGeneratedQuestion) => {
    await supabase.from('ai_generated_questions').update({ status: 'rejected', reviewed_by: profile?.id, reviewed_at: new Date().toISOString() }).eq('id', q.id);
    setGeneratedQuestions(generatedQuestions.map((gq) => gq.id === q.id ? { ...gq, status: 'rejected' } : gq));
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from('ai_generated_questions').delete().eq('id', id);
    setGeneratedQuestions(generatedQuestions.filter((gq) => gq.id !== id));
  };

  const approveAll = async () => {
    if (!profile) return;
    const pending = generatedQuestions.filter((q) => q.status === 'generated');
    for (const q of pending) {
      await supabase.from('ai_generated_questions').update({ status: 'approved', reviewed_by: profile.id, reviewed_at: new Date().toISOString() }).eq('id', q.id);
    }
    setGeneratedQuestions(generatedQuestions.map((gq) => gq.status === 'generated' ? { ...gq, status: 'approved' } : gq));
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-900">AI Question Generator</h1>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div><label className="label">Career</label><select className="input" value={selectedCareer} onChange={(e) => setSelectedCareer(e.target.value)}>{careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Course</label><select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
          <div><label className="label">Lesson</label><select className="input" value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)}>{lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
          <div><label className="label">Notes</label><select className="input" value={selectedNote} onChange={(e) => setSelectedNote(e.target.value)}>{notes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}</select></div>
          <div><label className="label">Number of Questions</label><select className="input" value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value))}><option value={10}>10</option><option value={20}>20</option><option value={30}>30</option><option value={50}>50</option></select></div>
          <div><label className="label">Difficulty</label><select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option><option>Mixed</option></select></div>
        </div>

        {genError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{genError}</span>
          </div>
        )}

        <button onClick={generateQuestions} disabled={generating || !selectedNote} className="btn-primary">
          {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Questions</>}
        </button>
      </div>

      {/* Generation Progress */}
      {generating && genStep && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="h-5 w-5 text-primary-600 animate-pulse" />
            <span className="text-sm font-medium text-slate-700">{genStep}</span>
          </div>
          <div className="space-y-2">
            {['Extracting content...', 'Detecting topics...', 'Identifying concepts...', 'Generating questions...', 'Checking quality...'].map((s, i) => {
              const isDone = ['Extracting content...', 'Detecting topics...', 'Identifying concepts...', 'Generating questions...', 'Checking quality...'].indexOf(genStep) > i;
              const isCurrent = genStep === s;
              return (
                <div key={s} className={`flex items-center gap-2 text-sm ${isDone ? 'text-success-600' : isCurrent ? 'text-primary-600' : 'text-slate-400'}`}>
                  {isDone ? <CheckCircle className="h-4 w-4" /> : isCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200" />}
                  {s}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Generated Questions ({generatedQuestions.length})</h2>
            <button onClick={approveAll} className="btn-primary text-sm">
              <CheckCircle className="h-4 w-4" /> Approve All
            </button>
          </div>
          <div className="space-y-3">
            {generatedQuestions.map((q, i) => (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600 flex-shrink-0">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge bg-slate-100 text-slate-600">{q.question_type}</span>
                      <span className="badge bg-primary-50 text-primary-700">{q.difficulty}</span>
                      {q.topic && <span className="text-xs text-slate-500">{q.topic}</span>}
                      <span className={`badge ${q.status === 'approved' ? 'bg-success-50 text-success-700' : q.status === 'rejected' ? 'bg-error-50 text-error-700' : 'bg-warning-50 text-warning-700'}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-2">{q.question}</p>
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {q.options.map((opt, j) => (
                          <div key={j} className={`text-xs flex items-center gap-1 ${opt.is_correct ? 'text-success-700' : 'text-slate-500'}`}>
                            {opt.is_correct ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-slate-300" />}
                            {opt.text}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">Explanation: {q.explanation}</p>
                    {q.source_reference && <p className="text-xs text-slate-400 mt-1">Source: {q.source_reference}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    {q.status === 'generated' && (
                      <>
                        <button onClick={() => approveQuestion(q)} className="p-1.5 rounded-lg hover:bg-success-50" title="Approve"><CheckCircle className="h-4 w-4 text-success-500" /></button>
                        <button onClick={() => rejectQuestion(q)} className="p-1.5 rounded-lg hover:bg-error-50" title="Reject"><XCircle className="h-4 w-4 text-error-500" /></button>
                      </>
                    )}
                    <button onClick={() => deleteQuestion(q.id)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Delete"><Trash2 className="h-4 w-4 text-slate-400" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      {analyses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent AI Analyses</h2>
          <div className="space-y-3">
            {analyses.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{a.document_name}</div>
                  <div className="text-xs text-slate-500">{a.topics?.length || 0} topics · {a.potential_questions} potential questions</div>
                </div>
                <span className={`badge ${a.status === 'completed' ? 'bg-success-50 text-success-700' : a.status === 'failed' ? 'bg-error-50 text-error-700' : 'bg-warning-50 text-warning-700'}`}>{a.status}</span>
                <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!generating && generatedQuestions.length === 0 && analyses.length === 0 && (
        <EmptyState icon={Sparkles} title="No AI-generated questions yet" description="Select a note and generate questions using AI. The AI will analyze the note content and create exam questions." />
      )}
    </div>
  );
}
