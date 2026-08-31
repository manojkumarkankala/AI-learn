export type UserRole = 'student' | 'admin';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'multiple_select'
  | 'short_answer'
  | 'fill_blank';

export type ExamType = 'lesson' | 'course' | 'topic' | 'revision' | 'final';

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export type RoadmapStepStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'failed';

export type ExamAttemptStatus = 'in_progress' | 'completed' | 'abandoned';

export type AIAnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export type AIQuestionStatus =
  | 'generated'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'published';

export type RewardType =
  | 'lesson_complete'
  | 'course_complete'
  | 'exam_pass'
  | 'module_complete'
  | 'career_complete'
  | 'badge';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  avatar_url: string | null;
  selected_career_id: string | null;
  role: UserRole;
  total_stars: number;
  rank: string;
  overall_progress: number;
  joined_date: string;
  created_at: string;
  updated_at: string;
}

export interface Career {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  estimated_hours: number;
  published: boolean;
  image_url: string | null;
  long_description: string | null;
  syllabus: string | null;
  created_at: string;
  updated_at: string;
}

export interface Roadmap {
  id: string;
  career_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RoadmapStep {
  id: string;
  roadmap_id: string;
  title: string;
  description: string;
  step_order: number;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  career_id: string;
  roadmap_step_id: string | null;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  estimated_time: number;
  course_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  lesson_order: number;
  estimated_minutes: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  lesson_id: string;
  course_id: string;
  title: string;
  content: string;
  file_url: string | null;
  file_type: string | null;
  note_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  lesson_id: string;
  course_id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_minutes: number;
  description: string;
  video_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  course_id: string | null;
  career_id: string | null;
  title: string;
  description: string;
  exam_type: ExamType;
  num_questions: number;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  course_id: string | null;
  lesson_id: string | null;
  question: string;
  question_type: QuestionType;
  correct_answer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  points: number;
  source_note_id: string | null;
  source_reference: string | null;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_label: string;
  is_correct: boolean;
  option_order: number;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  status: LessonStatus;
  progress: number;
  note_started: boolean;
  note_completed: boolean;
  video_started: boolean;
  video_progress: number;
  video_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  status: LessonStatus;
  progress: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapProgress {
  id: string;
  user_id: string;
  roadmap_step_id: string;
  career_id: string;
  status: RoadmapStepStatus;
  progress: number;
  exam_score: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  course_id: string | null;
  career_id: string | null;
  status: ExamAttemptStatus;
  score: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string | null;
  is_correct: boolean;
  time_taken_seconds: number;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_type: RewardType;
  description: string;
  stars_earned: number;
  reference_id: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  stars_required: number;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  career_id: string;
  title: string;
  final_score: number;
  rank: string;
  issued_at: string;
  created_at: string;
}

export interface AIDocumentAnalysis {
  id: string;
  admin_id: string;
  course_id: string | null;
  lesson_id: string | null;
  note_id: string | null;
  document_name: string;
  extracted_text: string;
  topics: string[];
  concepts: string[];
  summary: string;
  status: AIAnalysisStatus;
  potential_questions: number;
  created_at: string;
  updated_at: string;
}

export interface AIGeneratedQuestion {
  id: string;
  analysis_id: string;
  course_id: string | null;
  lesson_id: string | null;
  question: string;
  question_type: QuestionType;
  options: { text: string; is_correct: boolean }[];
  correct_answer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  source_reference: string;
  status: AIQuestionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionWithOptions extends Question {
  question_options: QuestionOption[];
}

export interface ExamWithQuestions extends Exam {
  questions: QuestionWithOptions[];
}

export interface CourseWithLessons extends Course {
  lessons: Lesson[];
}

export interface RoadmapStepWithCourses extends RoadmapStep {
  courses: Course[];
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  career_name: string;
  total_stars: number;
  rank: string;
  overall_progress: number;
  avg_score: number;
}
