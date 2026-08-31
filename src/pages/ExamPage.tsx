import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, Clock, AlertCircle,
  ChevronLeft, Target, Award, Play,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Exam, ExamAttempt } from '@/types/database';

export function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!examId) return;
    loadExam();
  }, [examId, profile]);

  const loadExam = async () => {
    if (!examId) return;
    setLoading(true);

    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .maybeSingle();
    if (examData) setExam(examData as Exam);

    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', examId)
      .eq('approved', true);
    setQuestionCount(count || 0);

    if (profile) {
      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('user_id', profile.id)
        .eq('exam_id', examId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      if (attemptsData) setAttempts(attemptsData as ExamAttempt[]);
    }

    setLoading(false);
  };

  const startExam = async () => {
    if (!profile || !exam) return;
    setStarting(true);

    const { data: attempt } = await supabase
      .from('exam_attempts')
      .insert({
        user_id: profile.id,
        exam_id: exam.id,
        course_id: exam.course_id,
        career_id: exam.career_id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (attempt) {
      navigate(`/exams/${exam.id}/take/${attempt.id}`);
    }
    setStarting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <EmptyState
          icon={Brain}
          title="Exam not found"
          description="This exam doesn't exist or hasn't been published yet."
          action={<Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>}
        />
        <Footer />
      </div>
    );
  }

  const attemptsLeft = exam.max_attempts - attempts.length;
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.percentage))
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
              <p className="text-sm text-slate-500">{exam.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <InfoCard icon={Brain} label="Questions" value={`${questionCount}`} />
            <InfoCard icon={Clock} label="Time Limit" value={`${exam.time_limit_minutes} min`} />
            <InfoCard icon={Target} label="Pass Score" value={`${exam.passing_score}%`} />
            <InfoCard icon={Award} label="Attempts" value={`${attemptsLeft} left`} />
          </div>

          {attempts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Previous Attempts</h3>
              <div className="space-y-2">
                {attempts.map((attempt, i) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">Attempt {i + 1}</span>
                      <span className={`badge ${attempt.passed ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
                        {attempt.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500">{Math.round(attempt.percentage)}%</span>
                      <Link to={`/exams/${exam.id}/results/${attempt.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                        View Results
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attemptsLeft <= 0 ? (
            <div className="p-4 rounded-xl bg-error-50 border border-error-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-error-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-error-700">Maximum attempts reached</p>
                <p className="text-xs text-error-600">You have used all {exam.max_attempts} attempts for this exam.</p>
              </div>
            </div>
          ) : questionCount === 0 ? (
            <div className="p-4 rounded-xl bg-warning-50 border border-warning-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-700">No questions available</p>
                <p className="text-xs text-warning-600">This exam doesn't have any approved questions yet.</p>
              </div>
            </div>
          ) : (
            <button onClick={startExam} disabled={starting} className="btn-primary w-full text-base py-3">
              {starting ? <LoadingSpinner size={16} /> : <><Play className="h-4 w-4" /> Start Exam</>}
            </button>
          )}

          {attempts.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-primary-50 border border-primary-100 flex items-center gap-3">
              <Award className="h-5 w-5 text-primary-600" />
              <span className="text-sm text-primary-700">
                Your best score: <strong>{Math.round(bestScore)}%</strong>
              </span>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
      <Icon className="h-5 w-5 text-primary-600 mb-2" />
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
