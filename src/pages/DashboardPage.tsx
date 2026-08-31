import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap, Star, Trophy, TrendingUp, BookOpen, ArrowRight,
  Play, Brain, Target, Award, CheckCircle, Lock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProgressBar, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Career, Course, RoadmapStep, RoadmapProgress, ExamAttempt, UserReward } from '@/types/database';

export function DashboardPage() {
  const { profile } = useAuth();
  const [career, setCareer] = useState<Career | null>(null);
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([]);
  const [roadmapProgress, setRoadmapProgress] = useState<RoadmapProgress[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([]);
  const [recentRewards, setRecentRewards] = useState<UserReward[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);

    if (profile.selected_career_id) {
      const { data: careerData } = await supabase
        .from('careers')
        .select('*')
        .eq('id', profile.selected_career_id)
        .maybeSingle();
      if (careerData) setCareer(careerData as Career);

      const { data: roadmapData } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('career_id', profile.selected_career_id)
        .maybeSingle();

      if (roadmapData) {
        const { data: stepsData } = await supabase
          .from('roadmap_steps')
          .select('*')
          .eq('roadmap_id', roadmapData.id)
          .order('step_order');
        if (stepsData) setRoadmapSteps(stepsData as RoadmapStep[]);
      }

      const { data: progressData } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('career_id', profile.selected_career_id);
      if (progressData) setRoadmapProgress(progressData as RoadmapProgress[]);

      const inProgressStep = progressData?.find((p) => p.status === 'in_progress' || p.status === 'available');
      if (inProgressStep) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('roadmap_step_id', inProgressStep.roadmap_step_id)
          .eq('published', true)
          .order('course_order')
          .limit(1)
          .maybeSingle();
        if (courseData) setCurrentCourse(courseData as Course);
      }
    }

    const { data: attemptsData } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);
    if (attemptsData) setRecentAttempts(attemptsData as ExamAttempt[]);

    const { data: rewardsData } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (rewardsData) setRecentRewards(rewardsData as UserReward[]);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  const avgScore = recentAttempts.length > 0
    ? Math.round(recentAttempts.reduce((sum, a) => sum + a.percentage, 0) / recentAttempts.length)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Continue your learning journey</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={TrendingUp} label="Overall Progress" value={`${Math.round(profile?.overall_progress || 0)}%`} color="primary" />
          <StatCard icon={Star} label="Total Stars" value={`${profile?.total_stars || 0}`} color="warning" />
          <StatCard icon={Award} label="Rank" value={profile?.rank || 'Practice'} color="success" />
          <StatCard icon={Trophy} label="Avg Score" value={`${avgScore}%`} color="accent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Continue Learning */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Continue Learning</h2>

              {!career ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No career selected yet"
                  description="Choose a career path to start your learning journey and track your progress."
                  action={<Link to="/careers" className="btn-primary">Choose a Career <ArrowRight className="h-4 w-4" /></Link>}
                />
              ) : currentCourse ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                      <BookOpen className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">{career.name}</div>
                      <div className="font-semibold text-slate-900">{currentCourse.title}</div>
                    </div>
                  </div>
                  <ProgressBar value={profile?.overall_progress || 0} className="mb-4" />
                  <Link to={`/courses/${currentCourse.id}`} className="btn-primary">
                    <Play className="h-4 w-4" /> Continue Learning
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                      <BookOpen className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">{career.name}</div>
                      <div className="font-semibold text-slate-900">Ready to begin</div>
                    </div>
                  </div>
                  <Link to={`/roadmaps/${career.slug}`} className="btn-primary">
                    View Roadmap <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Roadmap Preview */}
            {career && roadmapSteps.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Your Roadmap</h2>
                  <Link to={`/roadmaps/${career.slug}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {roadmapSteps.slice(0, 6).map((step) => {
                    const progress = roadmapProgress.find((p) => p.roadmap_step_id === step.id);
                    const status = progress?.status || 'locked';
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-success-500" />
                          ) : status === 'in_progress' || status === 'available' ? (
                            <div className="h-5 w-5 rounded-full border-2 border-primary-500 bg-primary-100" />
                          ) : (
                            <Lock className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${status === 'locked' ? 'text-slate-400' : 'text-slate-900'}`}>
                            {step.title}
                          </div>
                          {progress && (
                            <ProgressBar value={progress.progress} className="mt-1.5 h-1.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI Recommendation */}
            <div className="card p-6 bg-gradient-to-br from-primary-50 to-accent-50 border-primary-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                  <Brain className="h-4 w-4 text-primary-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">AI Recommendation</h2>
              </div>
              {recentAttempts.length > 0 && avgScore < 75 ? (
                <div>
                  <p className="text-sm text-slate-600 mb-3">
                    Based on your recent performance, you should focus on revising weaker topics.
                  </p>
                  <Link to="/dashboard" className="btn-primary text-xs px-4 py-2">
                    <Target className="h-3 w-3" /> Start AI Revision Test
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  {career
                    ? 'Keep completing lessons and exams to get personalized AI recommendations.'
                    : 'Select a career to get personalized study recommendations.'}
                </p>
              )}
            </div>

            {/* Recent Rewards */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Rewards</h2>
              {recentRewards.length > 0 ? (
                <div className="space-y-3">
                  {recentRewards.map((reward) => (
                    <div key={reward.id} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50">
                        <Star className="h-4 w-4 text-warning-500 fill-warning-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-slate-900">{reward.description}</div>
                        <div className="text-xs text-slate-500">+{reward.stars_earned} stars</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No rewards yet. Complete lessons to earn stars!</p>
              )}
            </div>

            {/* Recent Exams */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Exams</h2>
              {recentAttempts.length > 0 ? (
                <div className="space-y-3">
                  {recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-900">
                          {attempt.passed ? 'Passed' : 'Failed'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {Math.round(attempt.percentage)}% score
                        </div>
                      </div>
                      <span className={`badge ${attempt.passed ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
                        {attempt.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No exams taken yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: 'primary' | 'warning' | 'success' | 'accent';
}) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    warning: 'bg-warning-50 text-warning-600',
    success: 'bg-success-50 text-success-600',
    accent: 'bg-accent-50 text-accent-600',
  };
  return (
    <div className="card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]} mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
