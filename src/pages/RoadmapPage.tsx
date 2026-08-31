import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, Lock, Play, ArrowRight, BookOpen,
  Trophy, ChevronDown,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProgressBar, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Career, RoadmapStep, RoadmapProgress, Course, LessonProgress } from '@/types/database';

export function RoadmapPage() {
  const { slug } = useParams<{ slug: string }>();
  const { profile } = useAuth();
  const [career, setCareer] = useState<Career | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [progress, setProgress] = useState<RoadmapProgress[]>([]);
  const [courses, setCourses] = useState<Record<string, Course[]>>({});
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    loadRoadmap();
  }, [slug, profile]);

  const loadRoadmap = async () => {
    if (!slug) return;
    setLoading(true);

    const { data: careerData } = await supabase
      .from('careers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (!careerData) {
      setLoading(false);
      return;
    }
    setCareer(careerData as Career);

    const { data: roadmapData } = await supabase
      .from('roadmaps')
      .select('id')
      .eq('career_id', careerData.id)
      .maybeSingle();

    if (!roadmapData) {
      setLoading(false);
      return;
    }

    const { data: stepsData } = await supabase
      .from('roadmap_steps')
      .select('*')
      .eq('roadmap_id', roadmapData.id)
      .order('step_order');
    if (stepsData) setSteps(stepsData as RoadmapStep[]);

    if (profile) {
      const { data: progressData } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('career_id', careerData.id);
      if (progressData) setProgress(progressData as RoadmapProgress[]);
    }

    const coursesMap: Record<string, Course[]> = {};
    for (const step of stepsData || []) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('roadmap_step_id', step.id)
        .eq('published', true)
        .order('course_order');
      if (courseData) coursesMap[step.id] = courseData as Course[];
    }
    setCourses(coursesMap);

    // Load lesson progress for all courses in all steps
    if (profile) {
      const lpMap: Record<string, LessonProgress[]> = {};
      for (const step of stepsData || []) {
        const stepCourses = coursesMap[step.id] || [];
        for (const course of stepCourses) {
          const { data: lpData } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', profile.id)
            .eq('course_id', course.id);
          if (lpData) {
            lpMap[course.id] = lpData as LessonProgress[];
          }
        }
      }
      setLessonProgress(lpMap);
    }

    setLoading(false);
  };

  const getStatus = (stepId: string, stepIndex: number): RoadmapProgress['status'] => {
    const p = progress.find((p) => p.roadmap_step_id === stepId);
    if (p) return p.status;

    // First step is always available
    if (stepIndex === 0) return 'available';

    // Check if previous step is completed
    const prevStep = steps[stepIndex - 1];
    const prevProgress = progress.find((p) => p.roadmap_step_id === prevStep.id);
    if (prevProgress?.status === 'completed') return 'available';

    return 'locked';
  };

  const isStepCompleted = (stepId: string): boolean => {
    const stepCourses = courses[stepId] || [];
    if (stepCourses.length === 0) return false;

    // A step is completed when all its courses have all lessons completed
    return stepCourses.every((course) => {
      const lp = lessonProgress[course.id] || [];
      if (lp.length === 0) return false;
      return lp.every((p) => p.status === 'completed');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!career) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <EmptyState
          icon={BookOpen}
          title="Career not found"
          description="This career path doesn't exist or hasn't been published yet."
          action={<Link to="/careers" className="btn-primary">Browse Careers</Link>}
        />
        <Footer />
      </div>
    );
  }

  const completedSteps = steps.filter((s, i) => isStepCompleted(s.id)).length;
  const allStepsDone = steps.length > 0 && completedSteps === steps.length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link to="/careers" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">
            ← Back to Careers
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{career.name} Roadmap</h1>
          <p className="text-slate-600 mt-2">{career.description}</p>
          {steps.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                <span className="text-sm font-bold text-primary-600">{Math.round((completedSteps / steps.length) * 100)}%</span>
              </div>
              <ProgressBar value={(completedSteps / steps.length) * 100} />
            </div>
          )}
        </motion.div>

        {steps.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No roadmap steps yet"
            description="The administrator hasn't created a roadmap for this career yet. Please check back later."
          />
        ) : (
          <div className="space-y-4">
            {steps.map((step, i) => {
              const status = getStatus(step.id, i);
              const stepCourses = courses[step.id] || [];
              const isExpanded = expandedStep === step.id;
              const stepDone = isStepCompleted(step.id);

              // Calculate step progress based on course completion
              let stepProgressVal = 0;
              if (stepCourses.length > 0) {
                let totalLessons = 0;
                let completedLessons = 0;
                for (const course of stepCourses) {
                  const lp = lessonProgress[course.id] || [];
                  totalLessons += lp.length;
                  completedLessons += lp.filter((p) => p.status === 'completed').length;
                }
                stepProgressVal = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
              }

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`card overflow-hidden ${status === 'locked' ? 'opacity-60' : ''}`}
                >
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => status !== 'locked' && setExpandedStep(isExpanded ? null : step.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Status indicator */}
                      <div className="flex-shrink-0">
                        {stepDone ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-100">
                            <CheckCircle className="h-5 w-5 text-success-600" />
                          </div>
                        ) : status === 'in_progress' || status === 'available' ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                            <Play className="h-5 w-5 text-primary-600" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                            <Lock className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">STEP {i + 1}</span>
                          <span className={`badge ${
                            stepDone ? 'bg-success-50 text-success-700' :
                            status === 'in_progress' ? 'bg-primary-50 text-primary-700' :
                            status === 'available' ? 'bg-accent-50 text-accent-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {stepDone ? 'Completed' :
                             status === 'in_progress' ? 'In Progress' :
                             status === 'available' ? 'Available' :
                             'Locked'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mt-0.5">{step.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-1">{step.description}</p>
                        {stepProgressVal > 0 && (
                          <div className="mt-2">
                            <ProgressBar value={stepProgressVal} className="h-1.5" />
                          </div>
                        )}
                      </div>

                      {/* Expand icon */}
                      {status !== 'locked' && (
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && status !== 'locked' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200 p-5 bg-slate-50"
                    >
                      {stepCourses.length > 0 ? (
                        <div className="space-y-3">
                          {stepCourses.map((course) => {
                            const lp = lessonProgress[course.id] || [];
                            const completedInCourse = lp.filter((p) => p.status === 'completed').length;
                            const courseDone = lp.length > 0 && lp.every((p) => p.status === 'completed');
                            return (
                              <div key={course.id} className={`flex items-center gap-3 p-3 rounded-xl bg-white border ${courseDone ? 'border-success-200' : 'border-slate-200'}`}>
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                                  {courseDone ? (
                                    <CheckCircle className="h-5 w-5 text-success-500" />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                                      <BookOpen className="h-5 w-5 text-primary-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-slate-900 text-sm">{course.title}</div>
                                  <div className="text-xs text-slate-500">
                                    {course.estimated_time} min · {course.difficulty}
                                    {lp.length > 0 && ` · ${completedInCourse}/${lp.length} lessons done`}
                                  </div>
                                </div>
                                <Link to={`/courses/${course.id}`} className="btn-primary text-xs px-3 py-1.5">
                                  {courseDone ? 'Review' : 'Start'} <ArrowRight className="h-3 w-3" />
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No courses available for this step yet.</p>
                      )}
                    </motion.div>
                  )}

                  {/* Connector */}
                  {i < steps.length - 1 && (
                    <div className="flex justify-center -mb-4">
                      <div className={`w-0.5 h-8 ${stepDone ? 'bg-success-400' : 'bg-slate-200'}`} />
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Final Exam */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: steps.length * 0.05 }}
              className={`card p-5 ${allStepsDone ? 'bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200' : 'opacity-60'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${allStepsDone ? 'bg-gradient-to-br from-primary-500 to-accent-500' : 'bg-slate-200'}`}>
                  {allStepsDone ? (
                    <Trophy className="h-5 w-5 text-white" />
                  ) : (
                    <Lock className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-primary-600">FINAL</span>
                  <h3 className="font-semibold text-slate-900">Final Career Exam</h3>
                  <p className="text-sm text-slate-500">
                    {allStepsDone ? 'All steps complete! You can now take the final exam.' : 'Complete all steps to unlock the final exam.'}
                  </p>
                </div>
                {allStepsDone ? (
                  <Lock className="h-5 w-5 text-slate-400" />
                ) : (
                  <Lock className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
