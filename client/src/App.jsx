import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './features/auth/LoginPage';
import TeacherDashboard from './features/dashboard/TeacherDashboard';
import StudentDashboard from './features/dashboard/StudentDashboard';
import StudentManagement from './features/students/StudentManagement';
import QuestionBank from './features/questionBank/QuestionBank';
import CreateTest from './features/tests/CreateTest';
import LiveMonitoring from './features/monitoring/LiveMonitoring';
import TestResults from './features/results/TestResults';
import ExamInterface from './features/exam/ExamInterface';
import StudentResult from './features/results/StudentResult';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Teacher routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/students" element={<StudentManagement />} />
            <Route path="/teacher/question-bank" element={<QuestionBank />} />
            <Route path="/teacher/tests/create" element={<CreateTest />} />
            <Route path="/teacher/tests/:id/monitor" element={<LiveMonitoring />} />
            <Route path="/teacher/tests/:id/results" element={<TestResults />} />
          </Route>

          {/* Student routes (with layout) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/result/:attemptId" element={<StudentResult />} />
          </Route>

          {/* Exam — full screen, no layout */}
          <Route
            path="/student/exam/:attemptId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamInterface />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
