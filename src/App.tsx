import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from "./store";
import { Dashboard } from "./components/Dashboard";
import { LoginPage } from "./components/LoginPage";
import { OrganizationSignUp } from "./components/SignUp/OrganizationSignUp";
import { HeartbeatEntryPage } from "./components/HeartbeatEntryPage";
import { AdminLayout } from "./components/Admin/AdminLayout";
import { OrganizationSettings } from "./components/Admin/OrganizationSettings";
import { UserManagement } from "./components/Admin/UserManagement";
import { Loader2 } from 'lucide-react';

function App() {
  const { currentUser, isLoading, checkSession } = useStore();
  const location = useLocation();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    if (location.pathname.replace(/\/$/, '') === '/signup') {
      return <OrganizationSignUp />;
    }
    // Redirect to login if not signed up or logged in, but allow signup page
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/heartbeat/:type/:id" element={<HeartbeatEntryPage />} />
      <Route path="/admin" element={<Navigate to="/admin/settings" replace />} />
      <Route path="/admin/*" element={
        <AdminLayout>
          <Routes>
            <Route path="settings" element={<OrganizationSettings />} />
            <Route path="users" element={<UserManagement />} />
          </Routes>
        </AdminLayout>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
