import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, FileText, Video, ArrowRight, Clock, Play,
  CheckCircle, Circle, Brain, ChevronLeft, Lock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProgressBar, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Course, Lesson, LessonProgress, Exam } from '@/types/database';

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    loadCourse();
  }, [courseId, profile]);

  const loadCourse = async () => {
    if (!courseId) return;
    setLoading(true);

    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();
    if (courseData) setCourse(courseData as Course);

    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .eq('published', true)
      .order('lesson_order');
    if (lessonsData) setLessons(lessonsData as Lesson[]);

    const { data: examsData } = await supabase
      .from('exams')
      .select('*')
      .eq('course_id', courseId)
      .eq('published', true);
    if (examsData) setExams(examsData as Exam[]);

    if (profile) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('course_id', courseId);
      if (progressData) setProgress(progressData as LessonProgress[]);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <EmptyState
          icon={BookOpen}
          title="Course not found"
          description="This course doesn't exist or hasn't been published yet."
          action={<Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>}
        />
        <Footer />
      </div>
    );
  }

  const completedLessons = progress.filter((p) => p.status === 'completed').length;
  const courseProgress = lessons.length > 0
    ? Math.round((completedLessons / lessons.length) * 100)
    : 0;
  const allLessonsDone = lessons.length > 0 && completedLessons === lessons.length;

  const isLessonLocked = (index: number): boolean => {
    if (index === 0) return false;
    const prevLesson = lessons[index - 1];
    const prevProgress = progress.find((p) => p.lesson_id === prevLesson.id);
    return prevProgress?.status !== 'completed';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
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
          className="card p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              <p className="text-sm text-slate-500 mt-1">{course.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.estimated_time} min</span>
                <span className="badge bg-primary-50 text-primary-700">{course.difficulty}</span>
                <span>{lessons.length} lessons</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Course Progress</span>
              <span className="text-sm font-bold text-primary-600">{courseProgress}%</span>
            </div>
            <ProgressBar value={courseProgress} />
          </div>
        </motion.div>

        {/* Lessons */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Lessons</h2>

        {lessons.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No lessons available yet"
            description="The administrator hasn't published lessons for this course yet."
          />
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, i) => {
              const lessonProgress = progress.find((p) => p.lesson_id === lesson.id);
              const isCompleted = lessonProgress?.status === 'completed';
              const isInProgress = lessonProgress?.status === 'in_progress';
              const isLocked = isLessonLocked(i);

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  {isLocked ? (
                    <div className="card p-5 flex items-center gap-4 opacity-60">
                      <div className="flex-shrink-0">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                          <Lock className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">LESSON {i + 1}</span>
                          <span className="badge bg-slate-100 text-slate-500">Locked</span>
                        </div>
                        <h3 className="font-medium text-slate-700 mt-0.5">{lesson.title}</h3>
                        <p className="text-sm text-slate-400 line-clamp-1">{lesson.description}</p>
                        <p className="text-xs text-slate-400 mt-1">Complete the previous lesson to unlock this one.</p>
                      </div>
                      <Lock className="h-5 w-5 text-slate-300" />
                    </div>
                  ) : (
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className="card p-5 hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-success-500" />
                        ) : isInProgress ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-500 bg-primary-100">
                            <Play className="h-3 w-3 text-primary-600" />
                          </div>
                        ) : (
                          <Circle className="h-6 w-6 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">LESSON {i + 1}</span>
                          {isCompleted && (
                            <span className="badge bg-success-50 text-success-700">Completed</span>
                          )}
                          {isInProgress && (
                            <span className="badge bg-primary-50 text-primary-700">In Progress</span>
                          )}
                        </div>
                        <h3 className="font-medium text-slate-900 mt-0.5">{lesson.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-1">{lesson.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.estimated_minutes} min</span>
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Notes</span>
                          <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Video</span>
                        </div>
                      </div>

                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Exam */}
        {exams.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Course Exam</h2>
            {exams.map((exam) => (
              <div
                key={exam.id}
                className={`card p-6 ${allLessonsDone ? 'bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200' : 'opacity-60'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${allLessonsDone ? 'bg-gradient-to-br from-primary-500 to-accent-500' : 'bg-slate-200'}`}>
                    {allLessonsDone ? (
                      <Brain className="h-6 w-6 text-white" />
                    ) : (
                      <Lock className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{exam.title}</h3>
                    <p className="text-sm text-slate-500">{exam.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{exam.num_questions} questions</span>
                      <span>{exam.time_limit_minutes} min</span>
                      <span>Pass: {exam.passing_score}%</span>
                    </div>
                    {!allLessonsDone && (
                      <p className="text-xs text-slate-400 mt-2">Complete all lessons to unlock the exam.</p>
                    )}
                  </div>
                  {allLessonsDone ? (
                    <Link to={`/exams/${exam.id}`} className="btn-primary">
                      Start Exam <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Lock className="h-5 w-5 text-slate-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
