import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Phone, Award, Star, TrendingUp,
  CheckCircle, Trophy, Calendar,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Career, ExamAttempt, UserReward, Certificate } from '@/types/database';

export function ProfilePage() {
  const { profile } = useAuth();
  const [career, setCareer] = useState<Career | null>(null);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadProfile();
  }, [profile]);

  const loadProfile = async () => {
    if (!profile) return;
    setLoading(true);

    if (profile.selected_career_id) {
      const { data: careerData } = await supabase
        .from('careers')
        .select('*')
        .eq('id', profile.selected_career_id)
        .maybeSingle();
      if (careerData) setCareer(careerData as Career);
    }

    const { data: attemptsData } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);
    if (attemptsData) setAttempts(attemptsData as ExamAttempt[]);

    const { data: rewardsData } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (rewardsData) setRewards(rewardsData as UserReward[]);

    const { data: certsData } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', profile.id)
      .order('issued_at', { ascending: false });
    if (certsData) setCertificates(certsData as Certificate[]);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!profile) return null;

  const passedExams = attempts.filter((a) => a.passed).length;
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {profile.full_name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{profile.full_name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {profile.email}</span>
                {profile.mobile && (
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {profile.mobile}</span>
                )}
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {new Date(profile.joined_date).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="badge bg-primary-50 text-primary-700">{profile.role}</span>
                {career && <span className="badge bg-accent-50 text-accent-700">{career.name}</span>}
                <span className="badge bg-warning-50 text-warning-700">{profile.rank}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={TrendingUp} label="Progress" value={`${Math.round(profile.overall_progress)}%`} />
          <StatCard icon={Star} label="Stars" value={`${profile.total_stars}`} />
          <StatCard icon={CheckCircle} label="Exams Passed" value={`${passedExams}`} />
          <StatCard icon={Award} label="Avg Score" value={`${avgScore}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exam History */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Exam History</h2>
            {attempts.length === 0 ? (
              <p className="text-sm text-slate-400">No exams taken yet.</p>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className={`badge ${attempt.passed ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
                        {attempt.passed ? 'PASSED' : 'FAILED'}
                      </span>
                      <span className="text-sm text-slate-700 ml-2">{Math.round(attempt.percentage)}%</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rewards */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Rewards</h2>
            {rewards.length === 0 ? (
              <p className="text-sm text-slate-400">No rewards earned yet.</p>
            ) : (
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <div key={reward.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50">
                      <Star className="h-4 w-4 text-warning-500 fill-warning-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-900">{reward.description}</div>
                      <div className="text-xs text-slate-500">+{reward.stars_earned} stars</div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(reward.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificates */}
          <div className="card p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Certificates</h2>
            {certificates.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No certificates yet"
                description="Complete a career path to earn your first certificate!"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200">
                    <Trophy className="h-6 w-6 text-primary-600 mb-2" />
                    <div className="font-medium text-slate-900">{cert.title}</div>
                    <div className="text-xs text-slate-500">Score: {Math.round(cert.final_score)}% · Rank: {cert.rank}</div>
                    <div className="text-xs text-slate-400 mt-1">Issued {new Date(cert.issued_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="card p-5">
      <Icon className="h-5 w-5 text-primary-600 mb-2" />
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
