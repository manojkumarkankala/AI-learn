import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap, Brain, Trophy, BookOpen, Video, FileText,
  ArrowRight, Star, Users, Award, Target,
  Sparkles, TrendingUp, Route, Zap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Career } from '@/types/database';

const features = [
  { icon: Brain, title: 'AI Exam Generator', description: 'AI analyzes course material and automatically generates exam questions with explanations.' },
  { icon: Route, title: 'Career Roadmaps', description: 'Follow structured, step-by-step roadmaps for each career path with clear progression.' },
  { icon: FileText, title: 'Rich Notes', description: 'Learn from comprehensive notes covering every topic with rich text and document support.' },
  { icon: Video, title: 'Video Lessons', description: 'Watch curated video content for each lesson with progress tracking.' },
  { icon: Trophy, title: 'Stars & Ranks', description: 'Earn stars, climb ranks, and compete on the leaderboard as you progress.' },
  { icon: Target, title: 'AI Performance', description: 'Get personalized recommendations based on your exam performance and weak topics.' },
];

const steps = [
  { icon: GraduationCap, title: 'Choose a Career', description: 'Select from Web Development, Data Science, Python, Cyber Security, and more.' },
  { icon: Route, title: 'Follow the Roadmap', description: 'Progress through a structured roadmap with clear stages and prerequisites.' },
  { icon: BookOpen, title: 'Learn & Practice', description: 'Read notes, watch videos, and complete lessons at your own pace.' },
  { icon: Brain, title: 'Take AI Exams', description: 'Test your knowledge with AI-generated exams tailored to course content.' },
  { icon: TrendingUp, title: 'Track Progress', description: 'Monitor your performance, identify weak topics, and get AI recommendations.' },
];

const testimonials = [
  { name: 'Manoj Kumar', role: 'Web Development Student', text: 'AI Learner completely changed how I study. The roadmap kept me focused and the AI exams were incredibly accurate.', stars: 5 },
  { name: 'Priya Sharma', role: 'Data Analytics Student', text: 'The AI performance analysis helped me identify exactly where I was struggling. I improved my scores by 30%.', stars: 5 },
  { name: 'Arjun Reddy', role: 'Python Developer', text: 'The structured roadmap made learning Python so much easier. Earning stars kept me motivated throughout.', stars: 4 },
  { name: 'Sneha Patel', role: 'Cyber Security Student', text: 'Best learning platform I have used. The AI-generated questions were spot on with the course material.', stars: 5 },
];

const careerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Brain, TrendingUp, Zap, GraduationCap, Target,
};

export function LandingPage() {
  const [careers, setCareers] = useState<Career[]>([]);

  useEffect(() => {
    supabase
      .from('careers')
      .select('*')
      .eq('published', true)
      .order('name')
      .then(({ data }) => {
        if (data) setCareers(data);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700 mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Learning Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Learn Skills.
              <br />
              Follow Your Career.
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Build Your Future.
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              AI Learner helps you choose a career, follow a structured roadmap,
              learn from notes and videos, test your knowledge, and track your progress.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup" className="btn-primary text-base px-6 py-3">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/careers" className="btn-secondary text-base px-6 py-3">
                Explore Careers
              </Link>
              <Link to="/login" className="btn-ghost text-base px-6 py-3">
                Login
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {[
              { icon: BookOpen, label: 'Career Paths', value: '10+' },
              { icon: FileText, label: 'Lessons', value: '500+' },
              { icon: Brain, label: 'AI Exams', value: '1000+' },
              { icon: Users, label: 'Students', value: '10K+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 mx-auto mb-3">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Career Cards */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Popular Career Paths</h2>
            <p className="mt-2 text-slate-600">Choose from a variety of in-demand career tracks</p>
          </div>

          {careers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {careers.slice(0, 6).map((career, i) => {
                const Icon = careerIcons[career.icon] || BookOpen;
                return (
                  <motion.div
                    key={career.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <Link
                      to={`/careers/${career.slug}`}
                      className="card p-6 hover:shadow-lg transition-all group block"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors mb-4">
                        <Icon className="h-6 w-6 text-primary-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{career.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{career.description}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="badge bg-primary-50 text-primary-700">{career.difficulty}</span>
                        <span className="text-slate-500">{career.estimated_hours}h estimated</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Web Development', 'Data Science', 'Python Development', 'Cyber Security', 'Data Analytics', 'AI / Machine Learning'].map((name) => (
                <div key={name} className="card p-6">
                  <div className="skeleton h-12 w-12 rounded-xl mb-4" />
                  <div className="skeleton h-5 w-2/3 mb-2" />
                  <div className="skeleton h-3 w-full mb-1" />
                  <div className="skeleton h-3 w-1/2 mb-4" />
                  <div className="skeleton h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/careers" className="btn-secondary">
              View All Careers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">How AI Learner Works</h2>
            <p className="mt-2 text-slate-600">A simple, structured learning journey from start to finish</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative"
              >
                <div className="card p-6 h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4">
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-xs font-bold text-primary-600 mb-2">STEP {i + 1}</div>
                  <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight className="h-5 w-5 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Powerful Features</h2>
            <p className="mt-2 text-slate-600">Everything you need to learn and succeed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Student Achievements</h2>
            <p className="mt-2 text-slate-600">Celebrate learning milestones and climb the ranks</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Star, value: '25', label: 'Stars per Career', color: 'text-amber-500' },
              { icon: Award, value: 'S+', label: 'Top Rank', color: 'text-primary-600' },
              { icon: Trophy, value: '#1', label: 'Leaderboard', color: 'text-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="card p-8 text-center">
                <item.icon className={`h-10 w-10 mx-auto mb-3 ${item.color}`} />
                <div className="text-3xl font-bold text-slate-900">{item.value}</div>
                <div className="text-sm text-slate-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">What Students Say</h2>
            <p className="mt-2 text-slate-600">Real stories from learners who advanced their careers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`h-4 w-4 ${j < t.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <span className="text-sm font-semibold text-primary-700">
                      {t.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join thousands of students advancing their careers with AI Learner.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="btn bg-white text-primary-700 hover:bg-primary-50 text-base px-6 py-3">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/careers" className="btn bg-primary-500/20 text-white hover:bg-primary-500/30 text-base px-6 py-3 border border-white/20">
              Browse Careers
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
