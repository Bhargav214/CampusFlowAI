import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import FacultyPage from './pages/FacultyPage'
import AttendancePage from './pages/AttendancePage'
import MarksPage from './pages/MarksPage'
import ReportsPage from './pages/ReportsPage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/students">Students</NavLink>
          <NavLink to="/faculty">Faculty</NavLink>
          <NavLink to="/attendance">Attendance</NavLink>
          <NavLink to="/marks">Marks</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/login">Login</NavLink>
        </nav>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/faculty" element={<FacultyPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/marks" element={<MarksPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
