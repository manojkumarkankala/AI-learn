import { Link } from 'react-router-dom';
import { GraduationCap, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                AI Learner
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              AI-powered career learning and examination platform. Choose a career,
              follow a structured roadmap, learn from notes and videos, test your
              knowledge, and track your progress.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © 2026 AI Learner. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">
            Built with AI-powered learning.
          </p>
        </div>
      </div>
    </footer>
  );
}
