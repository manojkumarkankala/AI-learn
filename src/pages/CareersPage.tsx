import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Brain, TrendingUp, Zap, GraduationCap, Target,
  Code, Database, Cloud, Shield, ArrowRight, Clock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Career } from '@/types/database';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Brain, TrendingUp, Zap, GraduationCap, Target, Code, Database, Cloud, Shield,
};

export function CareersPage() {
  const { profile, refreshProfile } = useAuth();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('careers')
      .select('*')
      .eq('published', true)
      .order('name')
      .then(({ data }) => {
        if (data) setCareers(data as Career[]);
        setLoading(false);
      });
  }, []);

  const handleSelectCareer = async (careerId: string) => {
    if (!profile) return;
    setSelecting(careerId);
    await supabase
      .from('profiles')
      .update({ selected_career_id: careerId })
      .eq('id', profile.id);
    await refreshProfile();
    setSelecting(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900">Choose Your Career Path</h1>
          <p className="text-slate-600 mt-2">
            Select a career to follow a structured roadmap and start learning
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size={32} />
          </div>
        ) : careers.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No careers available yet"
            description="The administrator has not published any career paths yet. Please check back later."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {careers.map((career, i) => {
              const Icon = iconMap[career.icon] || BookOpen;
              const isSelected = profile?.selected_career_id === career.id;
              return (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="card p-6 hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {isSelected && (
                      <span className="badge bg-success-50 text-success-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-success-500" /> Selected
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{career.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{career.description}</p>

                  <div className="flex items-center gap-3 text-xs mb-4">
                    <span className="badge bg-primary-50 text-primary-700">{career.difficulty}</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3" /> {career.estimated_hours}h
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {!isSelected ? (
                      <button
                        onClick={() => handleSelectCareer(career.id)}
                        disabled={selecting === career.id}
                        className="btn-primary flex-1 text-xs"
                      >
                        {selecting === career.id ? 'Selecting...' : 'Start Career'}
                      </button>
                    ) : (
                      <Link to={`/roadmaps/${career.slug}`} className="btn-primary flex-1 text-xs">
                        View Roadmap <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                    <Link to={`/careers/${career.slug}`} className="btn-secondary text-xs">
                      Details
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
