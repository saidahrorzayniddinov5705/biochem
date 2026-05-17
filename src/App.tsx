import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './lib/store';
import { Toaster } from './components/ui/sonner';

// Imports will go here
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Modules from './pages/Modules';
import TopicPage from './pages/TopicPage';
import AITutor from './pages/AITutor';
import Worksheets from './pages/Worksheets';
import TakeWorksheet from './pages/TakeWorksheet';
import CustomWorksheet from './pages/CustomWorksheet';
import Library from './pages/Library';
import LabSimulations from './pages/LabSimulations';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Layout from './components/Layout';
import Founders from './pages/Founders';

export default function App() {
  const { user, isLoading } = useUserStore();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        
        {/* Protected Student Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/darslar" element={user ? <Modules /> : <Navigate to="/login" />} />
          <Route path="/darslar/:id" element={user ? <TopicPage /> : <Navigate to="/login" />} />
          <Route path="/ai-tutor" element={user ? <AITutor /> : <Navigate to="/login" />} />
          <Route path="/worksheets" element={user ? <Worksheets /> : <Navigate to="/login" />} />
          <Route path="/worksheets/:id" element={user ? <TakeWorksheet /> : <Navigate to="/login" />} />
          <Route path="/worksheet-render/:id" element={user ? <CustomWorksheet /> : <Navigate to="/login" />} />
          <Route path="/library" element={user ? <Library /> : <Navigate to="/login" />} />
          <Route path="/lab" element={user ? <LabSimulations /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
          <Route path="/founders" element={<Founders />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route path="/admin/*" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
      </Routes>
      <Toaster theme="light" />
    </>
  );
}
