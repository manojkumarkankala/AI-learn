import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Clock, ArrowRight, BarChart3,
  Brain,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Career, RoadmapStep, Course, Exam } from '@/types/database';

export function CareerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { profile, refreshProfile } = useAuth();
  const [career, setCareer] = useState<Career | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadCareer();
  }, [slug]);

  const loadCareer = async () => {
    if (!slug) return;
    setLoading(true);
    const { data: careerData } = await supabase
      .from('careers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (careerData) {
      setCareer(careerData as Career);
      const { data: roadmapData } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('career_id', careerData.id)
        .maybeSingle();
      if (roadmapData) {
        const { data: stepsData } = await supabase
          .from('roadmap_steps')
          .select('*')
          .eq('roadmap_id', roadmapData.id)
          .order('step_order');
        if (stepsData) setSteps(stepsData as RoadmapStep[]);
      }
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('career_id', careerData.id)
        .eq('published', true);
      if (coursesData) setCourses(coursesData as Course[]);
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('career_id', careerData.id)
        .eq('published', true);
      if (examsData) setExams(examsData as Exam[]);
    }
    setLoading(false);
  };

  const handleSelect = async () => {
    if (!profile || !career) return;
    setSelecting(true);
    await supabase
      .from('profiles')
      .update({ selected_career_id: career.id })
      .eq('id', profile.id);
    await refreshProfile();
    setSelecting(false);
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
          description="This career path doesn't exist."
          action={<Link to="/careers" className="btn-primary">Browse Careers</Link>}
        />
        <Footer />
      </div>
    );
  }

  const isSelected = profile?.selected_career_id === career.id;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/careers" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">
          ← Back to Careers
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card overflow-hidden mb-6"
        >
          {career.image_url && (
            <div className="h-56 w-full overflow-hidden">
              <img src={career.image_url} alt={career.name} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-8">
          <h1 className="text-3xl font-bold text-slate-900">{career.name}</h1>
          <p className="text-slate-600 mt-2">{career.description}</p>
          {career.long_description && (
            <p className="text-slate-600 mt-3 whitespace-pre-wrap leading-relaxed">{career.long_description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <InfoItem icon={BarChart3} label="Difficulty" value={career.difficulty} />
            <InfoItem icon={Clock} label="Est. Hours" value={`${career.estimated_hours}h`} />
            <InfoItem icon={BookOpen} label="Courses" value={`${courses.length}`} />
            <InfoItem icon={Brain} label="Exams" value={`${exams.length}`} />
          </div>

          <div className="mt-6 flex gap-3">
            {!isSelected ? (
              <button onClick={handleSelect} disabled={selecting} className="btn-primary">
                {selecting ? 'Selecting...' : 'Start Career'}
              </button>
            ) : (
              <Link to={`/roadmaps/${career.slug}`} className="btn-primary">
                View Roadmap <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          </div>
        </motion.div>

        {/* Roadmap Steps */}
        {steps.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Learning Path</h2>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-sm font-bold text-primary-600">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 text-sm">{step.title}</div>
                    <div className="text-xs text-slate-500">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Syllabus */}
        {career.syllabus && career.syllabus.trim() && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Syllabus</h2>
            <div className="space-y-2">
              {career.syllabus.split('\n').filter(Boolean).map((topic, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">{i + 1}</span>
                  <span className="text-sm text-slate-700">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <BookOpen className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{course.title}</div>
                      <div className="text-xs text-slate-500">{course.difficulty} · {course.estimated_time} min</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{course.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
      <Icon className="h-4 w-4 text-primary-600 mb-1" />
      <div className="text-sm font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
