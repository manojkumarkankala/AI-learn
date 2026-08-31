import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Crown, Medal, Award } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Career, LeaderboardEntry } from '@/types/database';

export function LeaderboardPage() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCareer]);

  const loadData = async () => {
    setLoading(true);
    const { data: careersData } = await supabase
      .from('careers')
      .select('*')
      .eq('published', true)
      .order('name');
    if (careersData) setCareers(careersData as Career[]);

    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        total_stars,
        rank,
        overall_progress,
        selected_career_id,
        selected_career:careers!selected_career_id(name)
      `)
      .order('total_stars', { ascending: false })
      .limit(100);

    if (selectedCareer !== 'all') {
      query = query.eq('selected_career_id', selectedCareer);
    }

    const { data: profilesData } = await query;

    if (profilesData) {
      const entries: LeaderboardEntry[] = (profilesData as unknown as Array<{
        id: string;
        full_name: string;
        avatar_url: string | null;
        total_stars: number;
        rank: string;
        overall_progress: number;
        selected_career?: { name: string };
      }>).map((p) => ({
        user_id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        career_name: p.selected_career?.name || 'Not selected',
        total_stars: p.total_stars,
        rank: p.rank,
        overall_progress: p.overall_progress,
        avg_score: 0,
      }));
      setEntries(entries);
    }
    setLoading(false);
  };

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
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-7 w-7 text-warning-500" />
            <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
          </div>
          <p className="text-slate-600">See how you rank against all learners</p>
        </motion.div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin pb-2">
          <button
            onClick={() => setSelectedCareer('all')}
            className={`btn text-sm whitespace-nowrap ${selectedCareer === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
          >
            All Careers
          </button>
          {careers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCareer(c.id)}
              className={`btn text-sm whitespace-nowrap ${selectedCareer === c.id ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size={32} />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No learners yet"
            description="Be the first to join the leaderboard by completing lessons and exams!"
          />
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const isMe = entry.user_id === profile?.id;
              const isTop3 = i < 3;
              const rankIcon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Award : null;
              const RankIcon = rankIcon;

              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className={`card p-4 flex items-center gap-4 ${isMe ? 'border-primary-500 bg-primary-50' : ''} ${isTop3 ? 'shadow-md' : ''}`}
                >
                  <div className="flex-shrink-0 w-10 text-center">
                    {RankIcon ? (
                      <RankIcon className={`h-6 w-6 mx-auto ${i === 0 ? 'text-warning-500' : i === 1 ? 'text-slate-400' : 'text-amber-600'}`} />
                    ) : (
                      <span className="text-lg font-bold text-slate-400">{i + 1}</span>
                    )}
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 flex-shrink-0">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt={entry.full_name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-primary-700">
                        {entry.full_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">{entry.full_name}</span>
                      {isMe && <span className="badge bg-primary-100 text-primary-700 text-xs">You</span>}
                    </div>
                    <div className="text-xs text-slate-500">{entry.career_name}</div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="h-4 w-4 text-warning-400 fill-warning-400" />
                      <span className="font-bold text-slate-900">{entry.total_stars}</span>
                    </div>
                    <div className="text-xs text-slate-500">{entry.rank}</div>
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
