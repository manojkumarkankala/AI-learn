import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CareersPage } from '@/pages/CareersPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { CoursePage } from '@/pages/CoursePage';
import { LessonPage } from '@/pages/LessonPage';
import { ExamPage } from '@/pages/ExamPage';
import { ExamTakePage } from '@/pages/ExamTakePage';
import { ExamResultsPage } from '@/pages/ExamResultsPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { CareerDetailPage } from '@/pages/CareerDetailPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminGate } from '@/components/AdminGate';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminCareers } from '@/pages/admin/AdminCareers';
import { AdminRoadmaps } from '@/pages/admin/AdminRoadmaps';
import { AdminCourses } from '@/pages/admin/AdminCourses';
import { AdminLessons } from '@/pages/admin/AdminLessons';
import { AdminNotes } from '@/pages/admin/AdminNotes';
import { AdminVideos } from '@/pages/admin/AdminVideos';
import { AdminExams } from '@/pages/admin/AdminExams';
import { AdminQuestions } from '@/pages/admin/AdminQuestions';
import { AdminResults } from '@/pages/admin/AdminResults';
import { AdminAIGenerator } from '@/pages/admin/AdminAIGenerator';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/careers/:slug" element={<CareerDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Protected student routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/roadmaps/:slug" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
          <Route path="/courses/:courseId" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
          <Route path="/lessons/:lessonId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          <Route path="/exams/:examId" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
          <Route path="/exams/:examId/take/:attemptId" element={<ProtectedRoute><ExamTakePage /></ProtectedRoute>} />
          <Route path="/exams/:examId/results/:attemptId" element={<ProtectedRoute><ExamResultsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Protected admin routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminGate><AdminLayout /></AdminGate></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="careers" element={<AdminCareers />} />
            <Route path="roadmaps" element={<AdminRoadmaps />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="lessons" element={<AdminLessons />} />
            <Route path="notes" element={<AdminNotes />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="questions" element={<AdminQuestions />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="ai-generator" element={<AdminAIGenerator />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
