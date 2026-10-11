import { Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import FacultyPage from './pages/FacultyPage';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import SubjectsPage from './pages/SubjectsPage';
import ETLPage from './pages/ETLPage';
import AiRiskPage from './pages/AIRiskPage';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentAnalyticsPage from './pages/StudentAnalyticsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import ParentDashboardPage from './pages/ParentDashboardPage';

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside AppLayout */}
      <Route element={<AppLayout />}>
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty", "student"]}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/students" 
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <StudentsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/faculty" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <FacultyPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/departments" 
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <DepartmentsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subjects" 
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <SubjectsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty", "student"]}>
              <AttendancePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/marks" 
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty", "student"]}>
              <MarksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etl"
          element={
              <ProtectedRoute allowedRoles={["admin", "faculty"]}>
                <ETLPage />
              </ProtectedRoute>
          }
      />
        <Route
          path="/ai-risk"
          element={
              <ProtectedRoute allowedRoles={["admin", "faculty"]}>
                <AiRiskPage />
              </ProtectedRoute>
          }
        />
        <Route
          path="/my-analytics"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent-dashboard"
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <ParentDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;