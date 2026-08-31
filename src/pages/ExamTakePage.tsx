import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, ChevronLeft, ChevronRight, AlertCircle, Loader2,
  CheckCircle, Circle,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner, EmptyState, ProgressBar } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Question, QuestionOption, ExamAttempt } from '@/types/database';
import { formatTime } from '@/lib/utils';

interface QuestionWithOptions extends Question {
  question_options: QuestionOption[];
}

export function ExamTakePage() {
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!examId || !attemptId || !profile) return;
    loadExam();
  }, [examId, attemptId, profile]);

  const loadExam = async () => {
    if (!examId || !attemptId) return;
    setLoading(true);

    const { data: attemptData } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .maybeSingle();
    if (!attemptData) {
      setLoading(false);
      return;
    }
    setAttempt(attemptData as ExamAttempt);

    const { data: questionsData } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('exam_id', examId)
      .eq('approved', true)
      .order('question_options.option_order');
    
    if (questionsData) {
      const shuffled = [...(questionsData as QuestionWithOptions[])].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      
      if (attemptData) {
        const elapsed = Math.floor((Date.now() - new Date(attemptData.started_at).getTime()) / 1000);
        
        const examTimeLimit = await supabase
          .from('exams')
          .select('time_limit_minutes')
          .eq('id', examId)
          .maybeSingle();
        const limit = (examTimeLimit.data?.time_limit_minutes || 30) * 60;
        setTimeLeft(Math.max(0, limit - elapsed));
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submitExam = useCallback(async () => {
    if (!attempt || !profile || submitting) return;
    setSubmitting(true);

    let correctCount = 0;
    const answerRecords: Array<{ question_id: string; user_answer: string; is_correct: boolean }> = [];

    for (const q of questions) {
      const userAnswer = answers[q.id] || '';
      let isCorrect = false;
      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
        const correctOption = q.question_options.find((o) => o.is_correct);
        isCorrect = userAnswer === (correctOption?.option_text || q.correct_answer);
      } else if (q.question_type === 'multiple_select') {
        const correctAnswers = q.question_options.filter((o) => o.is_correct).map((o) => o.option_text).sort();
        const userAnswers = userAnswer.split(',').sort();
        isCorrect = JSON.stringify(correctAnswers) === JSON.stringify(userAnswers);
      } else {
        isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
      }
      if (isCorrect) correctCount++;
      answerRecords.push({ question_id: q.id, user_answer: userAnswer, is_correct: isCorrect });
    }

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = percentage >= (attempt as ExamAttempt).percentage || percentage >= 60;

    const timeTaken = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);

    await supabase.from('exam_answers').insert(
      answerRecords.map((a) => ({
        attempt_id: attempt.id,
        question_id: a.question_id,
        user_answer: a.user_answer,
        is_correct: a.is_correct,
        time_taken_seconds: 0,
      }))
    );

    const { data: updatedAttempt } = await supabase
      .from('exam_attempts')
      .update({
        status: 'completed',
        score: correctCount,
        percentage,
        passed,
        time_taken_seconds: timeTaken,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attempt.id)
      .select()
      .maybeSingle();

    if (passed) {
      await supabase.from('user_rewards').insert({
        user_id: profile.id,
        reward_type: 'exam_pass',
        description: `Passed exam with ${percentage}%`,
        stars_earned: 5,
        reference_id: attempt.id,
      });
    }

    if (updatedAttempt) {
      navigate(`/exams/${examId}/results/${attempt.id}`);
    }
    setSubmitting(false);
  }, [attempt, questions, answers, profile, submitting, navigate, examId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <EmptyState
          icon={AlertCircle}
          title="No questions available"
          description="This exam doesn't have any approved questions yet."
          action={<button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-xs text-slate-500">
              {answeredCount} answered
            </span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeLeft < 60 ? 'bg-error-50 text-error-700' : 'bg-primary-50 text-primary-700'}`}>
            <Clock className="h-4 w-4" />
            <span className="font-mono font-semibold text-sm">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <ProgressBar value={(answeredCount / questions.length) * 100} className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question */}
          <div className="lg:col-span-3">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="badge bg-primary-50 text-primary-700">{currentQuestion.difficulty}</span>
                {currentQuestion.topic && (
                  <span className="badge bg-slate-100 text-slate-600">{currentQuestion.topic}</span>
                )}
              </div>

              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                {currentQuestion.question}
              </h2>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.question_type === 'multiple_choice' && (
                  currentQuestion.question_options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => selectAnswer(currentQuestion.id, option.option_text)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        answers[currentQuestion.id] === option.option_text
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        answers[currentQuestion.id] === option.option_text
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-slate-300'
                      }`}>
                        {answers[currentQuestion.id] === option.option_text && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-slate-900">{option.option_text}</span>
                    </button>
                  ))
                )}

                {currentQuestion.question_type === 'true_false' && (
                  [true, false].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => selectAnswer(currentQuestion.id, String(val))}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        answers[currentQuestion.id] === String(val)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        answers[currentQuestion.id] === String(val)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-slate-300'
                      }`}>
                        {answers[currentQuestion.id] === String(val) && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-slate-900">{val ? 'True' : 'False'}</span>
                    </button>
                  ))
                )}

                {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'fill_blank') && (
                  <input
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => selectAnswer(currentQuestion.id, e.target.value)}
                    className="input"
                    placeholder="Type your answer..."
                  />
                )}

                {currentQuestion.question_type === 'multiple_select' && (
                  currentQuestion.question_options.map((option) => {
                    const currentAnswers = (answers[currentQuestion.id] || '').split(',').filter(Boolean);
                    const isSelected = currentAnswers.includes(option.option_text);
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          const newAnswers = isSelected
                            ? currentAnswers.filter((a) => a !== option.option_text)
                            : [...currentAnswers, option.option_text];
                          selectAnswer(currentQuestion.id, newAnswers.join(','));
                        }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${
                          isSelected ? 'border-primary-500 bg-primary-500' : 'border-slate-300'
                        }`}>
                          {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                        </div>
                        <span className="text-sm text-slate-900">{option.option_text}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="btn-secondary"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="btn-primary"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="btn-primary bg-success-600 hover:bg-success-700"
                  >
                    Submit Exam
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-20">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-9 w-9 rounded-lg text-xs font-medium transition-all ${
                      i === currentIndex
                        ? 'bg-primary-600 text-white'
                        : answers[q.id]
                        ? 'bg-success-100 text-success-700'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-primary-600" /> Current
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-success-100" /> Answered
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-slate-300" /> Unanswered
                </div>
              </div>

              <button
                onClick={() => setShowConfirm(true)}
                className="btn-primary w-full mt-4 text-xs bg-success-600 hover:bg-success-700"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>

        {/* Submit Confirmation */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Submit Exam?</h3>
              <p className="text-sm text-slate-500 mb-4">
                You have answered {answeredCount} of {questions.length} questions.
                {answeredCount < questions.length && ' Unanswered questions will be marked as incorrect.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={() => submitExam()}
                  disabled={submitting}
                  className="btn-primary flex-1 bg-success-600 hover:bg-success-700"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
