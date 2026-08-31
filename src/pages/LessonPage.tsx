import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Video as VideoIcon, Clock, CheckCircle,
  ChevronLeft, BookOpen, Lock, PlayCircle, ArrowRight,
  PartyPopper,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProgressBar, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Lesson, Note, Video, LessonProgress, Course } from '@/types/database';
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
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

  useEffect(() => {
    if (!lessonId) return;
    loadLesson();
  }, [lessonId, profile]);

  useEffect(() => {
    if (notes.length > 0 && !activeNote) {
      setActiveNote(notes[0]);
    }
  }, [notes, activeNote]);

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
      if (progressData) {
        setProgress(progressData as LessonProgress);
        if (progressData.video_completed) {
          setCompletedVideoIds(new Set(videosData?.map((v) => v.id) || []));
        }
      }

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

  const computeProgress = (
    noteDone: boolean,
    videoDone: boolean,
  ): number => {
    const hasNotes = notes.length > 0;
    const hasVideos = videos.length > 0;
    if (hasNotes && hasVideos) {
      return (noteDone ? 50 : 0) + (videoDone ? 50 : 0);
    }
    if (hasNotes) return noteDone ? 100 : 0;
    if (hasVideos) return videoDone ? 100 : 0;
    return 100;
  };

  const updateProgressInDb = async (updates: Partial<LessonProgress>) => {
    if (!profile || !progress) return;
    const { data } = await supabase
      .from('lesson_progress')
      .update(updates)
      .eq('id', progress.id)
      .select()
      .maybeSingle();
    if (data) setProgress(data as LessonProgress);
  };

  const markNoteComplete = async () => {
    if (!profile || !lesson || !progress) return;

    const noteDone = true;
    const videoDone = progress.video_completed || videos.length === 0;
    const newProgressVal = computeProgress(noteDone, videoDone);

    const updates: Partial<LessonProgress> = {
      note_completed: true,
      note_started: true,
      progress: newProgressVal,
    };
    if (newProgressVal >= 100) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }
    await updateProgressInDb(updates);

    if (newProgressVal >= 100) {
      await grantReward();
      setShowCelebration(true);
    }
  };

  const markVideoWatched = async (videoId: string) => {
    if (!profile || !lesson || !progress) return;

    const newSet = new Set(completedVideoIds);
    newSet.add(videoId);
    setCompletedVideoIds(newSet);

    const allVideosDone = videos.every((v) => newSet.has(v.id));
    const noteDone = progress.note_completed || notes.length === 0;
    const newProgressVal = computeProgress(noteDone, allVideosDone);

    const updates: Partial<LessonProgress> = {
      video_started: true,
      video_completed: allVideosDone,
      video_progress: allVideosDone ? 100 : (newSet.size / videos.length) * 100,
      progress: newProgressVal,
    };
    if (newProgressVal >= 100) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }
    await updateProgressInDb(updates);

    if (allVideosDone && newProgressVal >= 100) {
      await grantReward();
      setShowCelebration(true);
    }
  };

  const grantReward = async () => {
    if (!profile || !lesson) return;
    const { data: existing } = await supabase
      .from('user_rewards')
      .select('id')
      .eq('user_id', profile.id)
      .eq('reference_id', lesson.id)
      .maybeSingle();
    if (existing) return;

    await supabase.from('user_rewards').insert({
      user_id: profile.id,
      reward_type: 'lesson_complete',
      description: `Completed lesson: ${lesson.title}`,
      stars_earned: 1,
      reference_id: lesson.id,
    });
    await supabase.rpc('update_user_stars', { p_user_id: profile.id });
  };

  const isNoteStepDone = progress?.note_completed || notes.length === 0;
  const isVideoStepDone = progress?.video_completed || videos.length === 0;
  const isLessonComplete = isNoteStepDone && isVideoStepDone;

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

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <StepBadge
            label="Notes"
            icon={FileText}
            done={isNoteStepDone}
            active={!isNoteStepDone}
          />
          <div className={`h-0.5 flex-1 ${isNoteStepDone ? 'bg-success-400' : 'bg-slate-200'}`} />
          <StepBadge
            label="Videos"
            icon={VideoIcon}
            done={isVideoStepDone}
            active={isNoteStepDone && !isVideoStepDone}
          />
          <div className={`h-0.5 flex-1 ${isLessonComplete ? 'bg-success-400' : 'bg-slate-200'}`} />
          <StepBadge
            label="Complete"
            icon={CheckCircle}
            done={isLessonComplete}
            active={false}
          />
        </div>

        {/* Celebration overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setShowCelebration(false)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm text-center mx-4"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 mx-auto mb-4">
                  <PartyPopper className="h-8 w-8 text-success-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Lesson Complete!</h2>
                <p className="text-sm text-slate-500 mb-4">You earned 1 star. Great work!</p>
                <button onClick={() => setShowCelebration(false)} className="btn-primary w-full">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Notes */}
        {!isNoteStepDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                <FileText className="h-4 w-4 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Step 1: Read the Notes</h2>
            </div>

            {notes.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-sm text-slate-400 mb-4">No notes for this lesson. You can skip to videos.</p>
                <button onClick={markNoteComplete} className="btn-primary">
                  Skip to Videos <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-2">
                  {notes.map((note, i) => (
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
                  ))}
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
                        <button onClick={markNoteComplete} className="btn-primary w-full">
                          <CheckCircle className="h-4 w-4" /> Mark Notes as Completed
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="card p-6 flex items-center justify-center text-slate-400 text-sm h-full">
                      Select a note to read
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Videos */}
        {isNoteStepDone && !isVideoStepDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                <VideoIcon className="h-4 w-4 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Step 2: Watch the Videos</h2>
            </div>

            {videos.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-sm text-slate-400 mb-4">No videos for this lesson. You can complete the lesson.</p>
                <button onClick={() => markVideoWatched('none')} className="btn-primary">
                  <CheckCircle className="h-4 w-4" /> Complete Lesson
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Video player */}
                {(() => {
                  const video = videos[activeVideoIdx];
                  if (!video) return null;
                  const ytId = getYouTubeId(video.video_url);
                  const isWatched = completedVideoIds.has(video.id);
                  return (
                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{video.title}</h3>
                          <p className="text-sm text-slate-500">{video.description}</p>
                        </div>
                        {isWatched && (
                          <span className="badge bg-success-50 text-success-700 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Watched
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {video.duration_minutes} min</span>
                        <span>Video {activeVideoIdx + 1} of {videos.length}</span>
                      </div>
                      {ytId ? (
                        <div className="aspect-video rounded-xl overflow-hidden bg-black">
                          <iframe
                            ref={(el) => { iframeRefs.current[video.id] = el; }}
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
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={() => setActiveVideoIdx(Math.max(0, activeVideoIdx - 1))}
                          disabled={activeVideoIdx === 0}
                          className="btn-secondary text-sm disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button
                          onClick={() => markVideoWatched(video.id)}
                          disabled={isWatched}
                          className="btn-primary text-sm disabled:opacity-60"
                        >
                          {isWatched ? (
                            <><CheckCircle className="h-4 w-4" /> Watched</>
                          ) : (
                            <><PlayCircle className="h-4 w-4" /> Mark as Watched</>
                          )}
                        </button>
                        <button
                          onClick={() => setActiveVideoIdx(Math.min(videos.length - 1, activeVideoIdx + 1))}
                          disabled={activeVideoIdx === videos.length - 1}
                          className="btn-secondary text-sm disabled:opacity-40"
                        >
                          Next <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Video list */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">All Videos in This Lesson</h4>
                  {videos.map((video, i) => {
                    const isWatched = completedVideoIds.has(video.id);
                    const isActive = i === activeVideoIdx;
                    return (
                      <button
                        key={video.id}
                        onClick={() => setActiveVideoIdx(i)}
                        className={`w-full text-left card p-3 flex items-center gap-3 transition-all ${isActive ? 'border-primary-500 shadow-md' : 'hover:shadow-sm'}`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0">
                          {isWatched ? (
                            <CheckCircle className="h-5 w-5 text-success-500" />
                          ) : (
                            <PlayCircle className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 line-clamp-1">{video.title}</div>
                          <div className="text-xs text-slate-500">{video.duration_minutes} min</div>
                        </div>
                        {isActive && <span className="badge bg-primary-50 text-primary-700 text-xs">Playing</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Complete */}
        {isLessonComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 text-center bg-gradient-to-br from-success-50 to-primary-50 border-success-200"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Lesson Complete!</h2>
            <p className="text-sm text-slate-500 mb-4">You've finished all notes and videos for this lesson.</p>
            <button onClick={() => navigate(-1)} className="btn-primary">
              Back to Course <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Locked steps preview */}
        {!isNoteStepDone && notes.length > 0 && (
          <div className="card p-5 opacity-50">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-slate-400" />
              <div>
                <h3 className="font-medium text-slate-700 text-sm">Videos locked</h3>
                <p className="text-xs text-slate-400">Complete the notes to unlock the video section.</p>
              </div>
            </div>
          </div>
        )}
        {isNoteStepDone && !isVideoStepDone && videos.length > 0 && (
          <div className="card p-5 opacity-50">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-slate-400" />
              <div>
                <h3 className="font-medium text-slate-700 text-sm">Completion locked</h3>
                <p className="text-xs text-slate-400">Watch all videos to complete this lesson.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function StepBadge({
  label,
  icon: Icon,
  done,
  active,
}: {
  label: string;
  icon: typeof FileText;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        done ? 'bg-success-100' : active ? 'bg-primary-100' : 'bg-slate-100'
      }`}>
        <Icon className={`h-4 w-4 ${done ? 'text-success-600' : active ? 'text-primary-600' : 'text-slate-400'}`} />
      </div>
      <span className={`text-xs font-medium hidden sm:inline ${done ? 'text-success-700' : active ? 'text-primary-700' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}
