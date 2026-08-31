import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, CheckCircle, XCircle, Clock, Brain,
  Target, ArrowRight, ChevronLeft, Award,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoadingSpinner, EmptyState, ProgressBar } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { ExamAttempt, ExamAnswer, Question, QuestionOption } from '@/types/database';
import { formatTime, calculateRank } from '@/lib/utils';

export function ExamResultsPage() {
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<(ExamAnswer & { question: Question & { question_options: QuestionOption[] } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    if (!attemptId) return;
    setLoading(true);

    const { data: attemptData } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .maybeSingle();
    if (attemptData) setAttempt(attemptData as ExamAttempt);

    const { data: answersData } = await supabase
      .from('exam_answers')
      .select('*, question(*, question_options(*))')
      .eq('attempt_id', attemptId);
    if (answersData) setAnswers(answersData as unknown as typeof answers);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <EmptyState
          icon={Trophy}
          title="Results not found"
          description="We couldn't find the results for this exam attempt."
          action={<Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>}
        />
        <Footer />
      </div>
    );
  }

  const percentage = Math.round(attempt.percentage);
  const passed = attempt.passed;
  const rank = calculateRank(percentage);
  const correctCount = answers.filter((a) => a.is_correct).length;
  const wrongCount = answers.filter((a) => !a.is_correct && a.user_answer).length;
  const skippedCount = answers.filter((a) => !a.user_answer).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {/* Result Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`card p-8 mb-6 ${passed ? 'bg-gradient-to-br from-success-50 to-white border-success-200' : 'bg-gradient-to-br from-error-50 to-white border-error-200'}`}
        >
          <div className="text-center">
            <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4 ${passed ? 'bg-success-100' : 'bg-error-100'}`}>
              {passed ? <Trophy className="h-8 w-8 text-success-600" /> : <XCircle className="h-8 w-8 text-error-600" />}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {passed ? 'Congratulations!' : 'Keep Practicing!'}
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              {passed ? 'You passed the exam.' : 'You did not pass this time. Review and try again.'}
            </p>

            <div className="text-5xl font-bold text-slate-900 mb-2">{percentage}%</div>
            <p className="text-sm text-slate-500 mb-6">
              {correctCount} / {answers.length} correct
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
                <Award className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-slate-900">Rank: {rank}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
                <Clock className="h-5 w-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-900">{formatTime(attempt.time_taken_seconds)}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${passed ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
                <span className="text-sm font-bold">{passed ? 'PASSED' : 'FAILED'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <CheckCircle className="h-6 w-6 text-success-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-slate-900">{correctCount}</div>
            <div className="text-xs text-slate-500">Correct</div>
          </div>
          <div className="card p-4 text-center">
            <XCircle className="h-6 w-6 text-error-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-slate-900">{wrongCount}</div>
            <div className="text-xs text-slate-500">Wrong</div>
          </div>
          <div className="card p-4 text-center">
            <Clock className="h-6 w-6 text-slate-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-slate-900">{skippedCount}</div>
            <div className="text-xs text-slate-500">Skipped</div>
          </div>
        </div>

        {/* AI Performance Analysis */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-primary-50 to-accent-50 border-primary-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <Brain className="h-4 w-4 text-primary-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">AI Performance Analysis</h2>
          </div>

          {percentage >= 75 ? (
            <p className="text-sm text-slate-600 mb-3">
              Excellent work! You have a strong understanding of the material.
              Keep up the great performance!
            </p>
          ) : percentage >= 60 ? (
            <p className="text-sm text-slate-600 mb-3">
              Good effort! You're on the right track. Review the topics you missed
              and try again to improve your score.
            </p>
          ) : (
            <p className="text-sm text-slate-600 mb-3">
              You need more practice. Focus on reviewing the notes and watching
              the videos for the topics you struggled with.
            </p>
          )}

          <div className="space-y-2">
            {answers.length > 0 && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Overall accuracy</span>
                  <span className="font-bold text-slate-900">{percentage}%</span>
                </div>
                <ProgressBar value={percentage} />
              </>
            )}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary-600" />
              <span className="text-xs font-semibold text-slate-900">Recommended Next Steps</span>
            </div>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Review the notes for questions you got wrong</li>
              <li>Watch the video lessons for weak topics</li>
              <li>Take a revision test focused on weak areas</li>
              <li>Retry this exam to improve your score</li>
            </ol>
          </div>
        </div>

        {/* Question Review */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Question Review</h2>
        <div className="space-y-4">
          {answers.map((answer, i) => (
            <div key={answer.id} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 ${
                  answer.is_correct ? 'bg-success-100 text-success-700' :
                  answer.user_answer ? 'bg-error-100 text-error-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 mb-2">
                    {answer.question?.question}
                  </p>

                  <div className="space-y-1.5">
                    {answer.question?.question_options?.map((option) => {
                      const isUserAnswer = answer.user_answer === option.option_text ||
                        (answer.question.question_type === 'multiple_select' &&
                         (answer.user_answer || '').split(',').includes(option.option_text));
                      const isCorrect = option.is_correct;

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                            isCorrect ? 'bg-success-50 text-success-700' :
                            isUserAnswer ? 'bg-error-50 text-error-700' : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          {isCorrect ? <CheckCircle className="h-3.5 w-3.5" /> :
                           isUserAnswer ? <XCircle className="h-3.5 w-3.5" /> :
                           <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
                          <span>{option.option_text}</span>
                          {isCorrect && <span className="ml-auto text-xs font-medium">Correct Answer</span>}
                          {isUserAnswer && !isCorrect && <span className="ml-auto text-xs font-medium">Your Answer</span>}
                        </div>
                      );
                    })}

                    {(answer.question?.question_type === 'short_answer' || answer.question?.question_type === 'fill_blank') && (
                      <div className="p-2 rounded-lg bg-slate-50 text-xs space-y-1">
                        <div className="text-slate-500">
                          Your answer: <span className={answer.is_correct ? 'text-success-700' : 'text-error-700'}>
                            {answer.user_answer || '(skipped)'}
                          </span>
                        </div>
                        <div className="text-slate-500">
                          Correct answer: <span className="text-success-700">{answer.question?.correct_answer}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {answer.question?.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-primary-50 border border-primary-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Brain className="h-3.5 w-3.5 text-primary-600" />
                        <span className="text-xs font-semibold text-primary-700">Explanation</span>
                      </div>
                      <p className="text-xs text-slate-600">{answer.question.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Link to={`/exams/${examId}`} className="btn-secondary flex-1">
            Retry Exam
          </Link>
          <Link to="/dashboard" className="btn-primary flex-1">
            Back to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
