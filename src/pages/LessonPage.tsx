import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Video as VideoIcon, Clock, CheckCircle,
  ChevronLeft, BookOpen,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProgressBar, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Lesson, Note, Video, LessonProgress, Course } from '@/types/database';
// 'Video' refers to the database type; the lucide icon is imported as 'VideoIcon'.
import { getYouTubeId } from '@/lib/utils';

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'videos'>('notes');
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    loadLesson();
  }, [lessonId, profile]);

  const loadLesson = async () => {
    if (!lessonId) return;
    setLoading(true);

    const { data: lessonData } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();
    if (lessonData) {
      setLesson(lessonData as Lesson);

      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', lessonData.course_id)
        .maybeSingle();
      if (courseData) setCourse(courseData as Course);
    }

    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('published', true)
      .order('note_order');
    if (notesData) setNotes(notesData as Note[]);

    const { data: videosData } = await supabase
      .from('videos')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('published', true)
      .order('video_order');
    if (videosData) setVideos(videosData as Video[]);

    if (profile) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();
      if (progressData) setProgress(progressData as LessonProgress);

      if (!progressData && lessonData) {
        const { data: newProgress } = await supabase
          .from('lesson_progress')
          .insert({
            user_id: profile.id,
            lesson_id: lessonId,
            course_id: lessonData.course_id,
            status: 'in_progress',
            progress: 0,
          })
          .select()
          .maybeSingle();
        if (newProgress) setProgress(newProgress as LessonProgress);
      }
    }

    setLoading(false);
  };

  const markNoteComplete = async () => {
    if (!profile || !lesson || !progress) return;
    const updates: Partial<LessonProgress> = {
      note_completed: true,
      note_started: true,
    };
    const newProgressVal = Math.min(100, progress.progress + 50);
    updates.progress = newProgressVal;
    if (newProgressVal >= 100) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }
    const { data } = await supabase
      .from('lesson_progress')
      .update(updates)
      .eq('id', progress.id)
      .select()
      .maybeSingle();
    if (data) setProgress(data as LessonProgress);

    if (newProgressVal >= 100) {
      await supabase.from('user_rewards').insert({
        user_id: profile.id,
        reward_type: 'lesson_complete',
        description: `Completed lesson: ${lesson.title}`,
        stars_earned: 1,
        reference_id: lesson.id,
      });
      await supabase.rpc('update_user_stars', { p_user_id: profile.id });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <EmptyState
          icon={BookOpen}
          title="Lesson not found"
          description="This lesson doesn't exist or hasn't been published yet."
          action={<Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Course
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{lesson.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.estimated_minutes} min</span>
            {course && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.title}</span>}
          </div>
        </motion.div>

        {/* Progress */}
        {progress && (
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Lesson Progress</span>
              <span className="text-sm font-bold text-primary-600">{Math.round(progress.progress)}%</span>
            </div>
            <ProgressBar value={progress.progress} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('notes')}
            className={`btn ${activeTab === 'notes' ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
          >
            <FileText className="h-4 w-4" /> Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`btn ${activeTab === 'videos' ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
          >
            <VideoIcon className="h-4 w-4" /> Videos ({videos.length})
          </button>
        </div>

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-2">
              {notes.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No notes available"
                  description="Notes for this lesson haven't been published yet."
                />
              ) : (
                notes.map((note, i) => (
                  <button
                    key={note.id}
                    onClick={() => setActiveNote(note)}
                    className={`w-full text-left card p-4 transition-all ${activeNote?.id === note.id ? 'border-primary-500 shadow-md' : 'hover:shadow-sm'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <span className="text-sm font-medium text-slate-900 line-clamp-1">{note.title}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="lg:col-span-2">
              {activeNote ? (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">{activeNote.title}</h3>
                  <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {activeNote.content}
                  </div>
                  {activeNote.file_url && (
                    <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <a
                        href={activeNote.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-sm"
                      >
                        <FileText className="h-4 w-4" /> Download Attachment
                      </a>
                    </div>
                  )}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    {progress?.note_completed ? (
                      <div className="flex items-center gap-2 text-sm text-success-600">
                        <CheckCircle className="h-4 w-4" /> Notes completed
                      </div>
                    ) : (
                      <button onClick={markNoteComplete} className="btn-primary">
                        <CheckCircle className="h-4 w-4" /> Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              ) : notes.length > 0 ? (
                <div className="card p-6 flex items-center justify-center text-slate-400 text-sm h-full">
                  Select a note to read
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-4">
            {videos.length === 0 ? (
              <EmptyState
                icon={VideoIcon}
                title="No videos available"
                description="Videos for this lesson haven't been published yet."
              />
            ) : (
              videos.map((video) => {
                const ytId = getYouTubeId(video.video_url);
                return (
                  <div key={video.id} className="card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{video.title}</h3>
                    <p className="text-sm text-slate-500 mb-4">{video.description}</p>
                    <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {video.duration_minutes} min</span>
                      {video.duration_minutes > 40 && (
                        <span className="badge bg-warning-50 text-warning-700">Long video</span>
                      )}
                    </div>
                    {ytId ? (
                      <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                        <video src={video.video_url} controls className="w-full h-full" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
