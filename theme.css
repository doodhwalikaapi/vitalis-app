import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Nutrition from './pages/Nutrition';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';

function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function Root() {
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <Splash onDone={() => setSplashDone(true)} userName={user?.username} />;
  }
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
        <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/workouts" element={<PrivateLayout><Workouts /></PrivateLayout>} />
        <Route path="/nutrition" element={<PrivateLayout><Nutrition /></PrivateLayout>} />
        <Route path="/assistant" element={<PrivateLayout><Assistant /></PrivateLayout>} />
        <Route path="/profile" element={<PrivateLayout><Profile /></PrivateLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ThemeProvider>
  );
}
