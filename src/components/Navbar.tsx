import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Menu, X, LayoutDashboard, User, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              AI <span className="text-primary-600">Learner</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/careers" className="btn-ghost">Careers</Link>
            <Link to="/leaderboard" className="btn-ghost">Leaderboard</Link>
            {profile ? (
              <>
                <Link to="/dashboard" className="btn-ghost">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link to="/admin" className="btn-ghost">
                  <Shield className="h-4 w-4" /> Admin
                </Link>
                <Link to="/profile" className="btn-ghost">
                  <User className="h-4 w-4" /> Profile
                </Link>
                <button onClick={handleSignOut} className="btn-secondary">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Login</Link>
                <Link to="/signup" className="btn-primary">Start Learning</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className={cn(
          'md:hidden border-t border-slate-200 overflow-hidden transition-all',
          mobileOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}>
          <div className="flex flex-col gap-1 pt-4">
            <Link to="/careers" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
              Careers
            </Link>
            <Link to="/leaderboard" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
              Leaderboard
            </Link>
            {profile ? (
              <>
                <Link to="/dashboard" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/admin" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                  <Shield className="h-4 w-4" /> Admin
                </Link>
                <Link to="/profile" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                  Profile
                </Link>
                <button onClick={handleSignOut} className="btn-secondary justify-start">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary justify-start" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link to="/signup" className="btn-primary justify-start" onClick={() => setMobileOpen(false)}>
                  Start Learning
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
