/*
# AI LEARNER — Core Database Schema (Part 1: Base Tables)

Creates careers and profiles tables first, then helper functions, then all remaining tables.
Careers must exist before profiles (FK), and profiles must exist before is_admin() function.
*/

-- ============================================================
-- CAREERS TABLE (must come first — profiles references it)
-- ============================================================
CREATE TABLE IF NOT EXISTS careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'BookOpen',
  difficulty text NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  estimated_hours integer NOT NULL DEFAULT 100,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES TABLE (must come after careers)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  avatar_url text,
  selected_career_id uuid REFERENCES careers(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  total_stars integer NOT NULL DEFAULT 0,
  rank text NOT NULL DEFAULT 'Practice',
  overall_progress numeric(5,2) NOT NULL DEFAULT 0.00,
  joined_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS (must come after profiles)
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_admin_or_owner(owner_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT is_admin() OR auth.uid() = owner_id;
$$;

-- ============================================================
-- CAREERS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "read_published_careers" ON careers;
CREATE POLICY "read_published_careers" ON careers FOR SELECT
  TO authenticated USING (published = true OR is_admin());

DROP POLICY IF EXISTS "insert_careers_admin" ON careers;
CREATE POLICY "insert_careers_admin" ON careers FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_careers_admin" ON careers;
CREATE POLICY "update_careers_admin" ON careers FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_careers_admin" ON careers;
CREATE POLICY "delete_careers_admin" ON careers FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id OR is_admin());

-- ============================================================
-- ROADMAPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Main Roadmap',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_roadmaps" ON roadmaps;
CREATE POLICY "read_roadmaps" ON roadmaps FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM careers WHERE careers.id = roadmaps.career_id AND (careers.published = true OR is_admin())));

DROP POLICY IF EXISTS "insert_roadmaps_admin" ON roadmaps;
CREATE POLICY "insert_roadmaps_admin" ON roadmaps FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_roadmaps_admin" ON roadmaps;
CREATE POLICY "update_roadmaps_admin" ON roadmaps FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_roadmaps_admin" ON roadmaps;
CREATE POLICY "delete_roadmaps_admin" ON roadmaps FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- ROADMAP STEPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roadmap_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  step_order integer NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT 'Circle',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roadmap_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_roadmap_steps" ON roadmap_steps;
CREATE POLICY "read_roadmap_steps" ON roadmap_steps FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_roadmap_steps_admin" ON roadmap_steps;
CREATE POLICY "insert_roadmap_steps_admin" ON roadmap_steps FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_roadmap_steps_admin" ON roadmap_steps;
CREATE POLICY "update_roadmap_steps_admin" ON roadmap_steps FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_roadmap_steps_admin" ON roadmap_steps;
CREATE POLICY "delete_roadmap_steps_admin" ON roadmap_steps FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- COURSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  roadmap_step_id uuid REFERENCES roadmap_steps(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  estimated_time integer NOT NULL DEFAULT 60,
  course_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(career_id, slug)
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_courses" ON courses;
CREATE POLICY "read_courses" ON courses FOR SELECT
  TO authenticated USING (published = true OR is_admin());

DROP POLICY IF EXISTS "insert_courses_admin" ON courses;
CREATE POLICY "insert_courses_admin" ON courses FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_courses_admin" ON courses;
CREATE POLICY "update_courses_admin" ON courses FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_courses_admin" ON courses;
CREATE POLICY "delete_courses_admin" ON courses FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- LESSONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  lesson_order integer NOT NULL DEFAULT 0,
  estimated_minutes integer NOT NULL DEFAULT 30,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_lessons" ON lessons;
CREATE POLICY "read_lessons" ON lessons FOR SELECT
  TO authenticated USING (published = true OR is_admin());

DROP POLICY IF EXISTS "insert_lessons_admin" ON lessons;
CREATE POLICY "insert_lessons_admin" ON lessons FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_lessons_admin" ON lessons;
CREATE POLICY "update_lessons_admin" ON lessons FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_lessons_admin" ON lessons;
CREATE POLICY "delete_lessons_admin" ON lessons FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- NOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  file_url text,
  file_type text,
  note_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_notes" ON notes;
CREATE POLICY "read_notes" ON notes FOR SELECT
  TO authenticated USING (published = true OR is_admin());

DROP POLICY IF EXISTS "insert_notes_admin" ON notes;
CREATE POLICY "insert_notes_admin" ON notes FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_notes_admin" ON notes;
CREATE POLICY "update_notes_admin" ON notes FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_notes_admin" ON notes;
CREATE POLICY "delete_notes_admin" ON notes FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- VIDEOS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  duration_minutes integer NOT NULL DEFAULT 10,
  description text NOT NULL DEFAULT '',
  video_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_videos" ON videos;
CREATE POLICY "read_videos" ON videos FOR SELECT
  TO authenticated USING (published = true OR is_admin());

DROP POLICY IF EXISTS "insert_videos_admin" ON videos;
CREATE POLICY "insert_videos_admin" ON videos FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_videos_admin" ON videos;
CREATE POLICY "update_videos_admin" ON videos FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_videos_admin" ON videos;
CREATE POLICY "delete_videos_admin" ON videos FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- EXAMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  career_id uuid REFERENCES careers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  exam_type text NOT NULL DEFAULT 'course' CHECK (exam_type IN ('lesson', 'course', 'topic', 'revision', 'final')),
  num_questions integer NOT NULL DEFAULT 10,
  time_limit_minutes integer NOT NULL DEFAULT 30,
  passing_score integer NOT NULL DEFAULT 60,
  max_attempts integer NOT NULL DEFAULT 3,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_exams" ON exams;
CREATE POLICY "read_exams" ON exams FOR SELECT
  TO authenticated USING (published = true OR is_admin());

DROP POLICY IF EXISTS "insert_exams_admin" ON exams;
CREATE POLICY "insert_exams_admin" ON exams FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_exams_admin" ON exams;
CREATE POLICY "update_exams_admin" ON exams FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_exams_admin" ON exams;
CREATE POLICY "delete_exams_admin" ON exams FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- QUESTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  question text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'multiple_select', 'short_answer', 'fill_blank')),
  correct_answer text NOT NULL,
  explanation text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Easy' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  topic text NOT NULL DEFAULT '',
  points integer NOT NULL DEFAULT 1,
  source_note_id uuid REFERENCES notes(id) ON DELETE SET NULL,
  source_reference text,
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_questions" ON questions;
CREATE POLICY "read_questions" ON questions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_questions_admin" ON questions;
CREATE POLICY "insert_questions_admin" ON questions FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_questions_admin" ON questions;
CREATE POLICY "update_questions_admin" ON questions FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_questions_admin" ON questions;
CREATE POLICY "delete_questions_admin" ON questions FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- QUESTION OPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  option_label text NOT NULL DEFAULT '',
  is_correct boolean NOT NULL DEFAULT false,
  option_order integer NOT NULL DEFAULT 0
);

ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_question_options" ON question_options;
CREATE POLICY "read_question_options" ON question_options FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_question_options_admin" ON question_options;
CREATE POLICY "insert_question_options_admin" ON question_options FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_question_options_admin" ON question_options;
CREATE POLICY "update_question_options_admin" ON question_options FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_question_options_admin" ON question_options;
CREATE POLICY "delete_question_options_admin" ON question_options FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- LESSON PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress numeric(5,2) NOT NULL DEFAULT 0.00,
  note_started boolean NOT NULL DEFAULT false,
  note_completed boolean NOT NULL DEFAULT false,
  video_started boolean NOT NULL DEFAULT false,
  video_progress numeric(5,2) NOT NULL DEFAULT 0.00,
  video_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lesson_progress" ON lesson_progress;
CREATE POLICY "select_own_lesson_progress" ON lesson_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_lesson_progress" ON lesson_progress;
CREATE POLICY "insert_own_lesson_progress" ON lesson_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_lesson_progress" ON lesson_progress;
CREATE POLICY "update_own_lesson_progress" ON lesson_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_lesson_progress" ON lesson_progress;
CREATE POLICY "delete_own_lesson_progress" ON lesson_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- COURSE PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress numeric(5,2) NOT NULL DEFAULT 0.00,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_course_progress" ON course_progress;
CREATE POLICY "select_own_course_progress" ON course_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_course_progress" ON course_progress;
CREATE POLICY "insert_own_course_progress" ON course_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_course_progress" ON course_progress;
CREATE POLICY "update_own_course_progress" ON course_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_course_progress" ON course_progress;
CREATE POLICY "delete_own_course_progress" ON course_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ROADMAP PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roadmap_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_step_id uuid NOT NULL REFERENCES roadmap_steps(id) ON DELETE CASCADE,
  career_id uuid NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'failed')),
  progress numeric(5,2) NOT NULL DEFAULT 0.00,
  exam_score numeric(5,2),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, roadmap_step_id)
);

ALTER TABLE roadmap_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_roadmap_progress" ON roadmap_progress;
CREATE POLICY "select_own_roadmap_progress" ON roadmap_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_roadmap_progress" ON roadmap_progress;
CREATE POLICY "insert_own_roadmap_progress" ON roadmap_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_roadmap_progress" ON roadmap_progress;
CREATE POLICY "update_own_roadmap_progress" ON roadmap_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_roadmap_progress" ON roadmap_progress;
CREATE POLICY "delete_own_roadmap_progress" ON roadmap_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- EXAM ATTEMPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  career_id uuid REFERENCES careers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  score numeric(5,2) NOT NULL DEFAULT 0.00,
  percentage numeric(5,2) NOT NULL DEFAULT 0.00,
  passed boolean NOT NULL DEFAULT false,
  time_taken_seconds integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_exam_attempts" ON exam_attempts;
CREATE POLICY "select_own_exam_attempts" ON exam_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_exam_attempts" ON exam_attempts;
CREATE POLICY "insert_own_exam_attempts" ON exam_attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_exam_attempts" ON exam_attempts;
CREATE POLICY "update_own_exam_attempts" ON exam_attempts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_exam_attempts" ON exam_attempts;
CREATE POLICY "delete_own_exam_attempts" ON exam_attempts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- EXAM ANSWERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer text,
  is_correct boolean NOT NULL DEFAULT false,
  time_taken_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_exam_answers" ON exam_answers;
CREATE POLICY "select_own_exam_answers" ON exam_answers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = exam_answers.attempt_id AND exam_attempts.user_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "insert_own_exam_answers" ON exam_answers;
CREATE POLICY "insert_own_exam_answers" ON exam_answers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = exam_answers.attempt_id AND exam_attempts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_exam_answers" ON exam_answers;
CREATE POLICY "update_own_exam_answers" ON exam_answers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = exam_answers.attempt_id AND exam_attempts.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = exam_answers.attempt_id AND exam_attempts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_exam_answers" ON exam_answers;
CREATE POLICY "delete_own_exam_answers" ON exam_answers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = exam_answers.attempt_id AND exam_attempts.user_id = auth.uid())
  );

-- ============================================================
-- USER REWARDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('lesson_complete', 'course_complete', 'exam_pass', 'module_complete', 'career_complete', 'badge')),
  description text NOT NULL DEFAULT '',
  stars_earned integer NOT NULL DEFAULT 0,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rewards" ON user_rewards;
CREATE POLICY "select_own_rewards" ON user_rewards FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_rewards" ON user_rewards;
CREATE POLICY "insert_own_rewards" ON user_rewards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_rewards" ON user_rewards;
CREATE POLICY "delete_own_rewards" ON user_rewards FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ACHIEVEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Award',
  criteria text NOT NULL DEFAULT '',
  stars_required integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_achievements" ON achievements;
CREATE POLICY "read_achievements" ON achievements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_achievements_admin" ON achievements;
CREATE POLICY "insert_achievements_admin" ON achievements FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_achievements_admin" ON achievements;
CREATE POLICY "update_achievements_admin" ON achievements FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_achievements_admin" ON achievements;
CREATE POLICY "delete_achievements_admin" ON achievements FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- USER ACHIEVEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_achievements" ON user_achievements;
CREATE POLICY "select_own_user_achievements" ON user_achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_user_achievements" ON user_achievements;
CREATE POLICY "insert_own_user_achievements" ON user_achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_achievements" ON user_achievements;
CREATE POLICY "delete_own_user_achievements" ON user_achievements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CERTIFICATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  career_id uuid NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  title text NOT NULL,
  final_score numeric(5,2) NOT NULL DEFAULT 0.00,
  rank text NOT NULL DEFAULT 'A',
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_certificates" ON certificates;
CREATE POLICY "select_own_certificates" ON certificates FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_certificates" ON certificates;
CREATE POLICY "insert_own_certificates" ON certificates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_certificates" ON certificates;
CREATE POLICY "delete_own_certificates" ON certificates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- AI DOCUMENT ANALYSIS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_document_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  note_id uuid REFERENCES notes(id) ON DELETE SET NULL,
  document_name text NOT NULL DEFAULT '',
  extracted_text text NOT NULL DEFAULT '',
  topics text[] NOT NULL DEFAULT '{}',
  concepts text[] NOT NULL DEFAULT '{}',
  summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
  potential_questions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_document_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_ai_analysis_admin" ON ai_document_analysis;
CREATE POLICY "select_ai_analysis_admin" ON ai_document_analysis FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "insert_ai_analysis_admin" ON ai_document_analysis;
CREATE POLICY "insert_ai_analysis_admin" ON ai_document_analysis FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_ai_analysis_admin" ON ai_document_analysis;
CREATE POLICY "update_ai_analysis_admin" ON ai_document_analysis FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_ai_analysis_admin" ON ai_document_analysis;
CREATE POLICY "delete_ai_analysis_admin" ON ai_document_analysis FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- AI GENERATED QUESTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_generated_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES ai_document_analysis(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  question text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'multiple_select', 'short_answer', 'fill_blank')),
  options jsonb NOT NULL DEFAULT '[]',
  correct_answer text NOT NULL,
  explanation text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Easy' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  topic text NOT NULL DEFAULT '',
  source_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'approved', 'rejected', 'published')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_generated_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_ai_questions_admin" ON ai_generated_questions;
CREATE POLICY "select_ai_questions_admin" ON ai_generated_questions FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "insert_ai_questions_admin" ON ai_generated_questions;
CREATE POLICY "insert_ai_questions_admin" ON ai_generated_questions FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_ai_questions_admin" ON ai_generated_questions;
CREATE POLICY "update_ai_questions_admin" ON ai_generated_questions FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_ai_questions_admin" ON ai_generated_questions;
CREATE POLICY "delete_ai_questions_admin" ON ai_generated_questions FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_selected_career ON profiles(selected_career_id);
CREATE INDEX IF NOT EXISTS idx_careers_slug ON careers(slug);
CREATE INDEX IF NOT EXISTS idx_roadmaps_career ON roadmaps(career_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_roadmap ON roadmap_steps(roadmap_id, step_order);
CREATE INDEX IF NOT EXISTS idx_courses_career ON courses(career_id);
CREATE INDEX IF NOT EXISTS idx_courses_step ON courses(roadmap_step_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id, lesson_order);
CREATE INDEX IF NOT EXISTS idx_notes_lesson ON notes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_videos_lesson ON videos(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exams_course ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_career ON exams(career_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id, option_order);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_progress_user ON roadmap_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_progress_step ON roadmap_progress(roadmap_step_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt ON exam_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_course ON ai_document_analysis(course_id);
CREATE INDEX IF NOT EXISTS idx_ai_questions_analysis ON ai_generated_questions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_questions_course ON ai_generated_questions(course_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS careers_updated_at ON careers;
CREATE TRIGGER careers_updated_at BEFORE UPDATE ON careers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS roadmaps_updated_at ON roadmaps;
CREATE TRIGGER roadmaps_updated_at BEFORE UPDATE ON roadmaps FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS roadmap_steps_updated_at ON roadmap_steps;
CREATE TRIGGER roadmap_steps_updated_at BEFORE UPDATE ON roadmap_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS courses_updated_at ON courses;
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS lessons_updated_at ON lessons;
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS notes_updated_at ON notes;
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS videos_updated_at ON videos;
CREATE TRIGGER videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS exams_updated_at ON exams;
CREATE TRIGGER exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS questions_updated_at ON questions;
CREATE TRIGGER questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER lesson_progress_updated_at BEFORE UPDATE ON lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS course_progress_updated_at ON course_progress;
CREATE TRIGGER course_progress_updated_at BEFORE UPDATE ON course_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS roadmap_progress_updated_at ON roadmap_progress;
CREATE TRIGGER roadmap_progress_updated_at BEFORE UPDATE ON roadmap_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS exam_attempts_updated_at ON exam_attempts;
CREATE TRIGGER exam_attempts_updated_at BEFORE UPDATE ON exam_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ai_analysis_updated_at ON ai_document_analysis;
CREATE TRIGGER ai_analysis_updated_at BEFORE UPDATE ON ai_document_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ai_questions_updated_at ON ai_generated_questions;
CREATE TRIGGER ai_questions_updated_at BEFORE UPDATE ON ai_generated_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
