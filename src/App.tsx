import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import { useStore } from "./store";
import { Dashboard } from "./components/Dashboard";
import { HeartbeatEntryPage } from "./components/HeartbeatEntryPage";
import { AdminLayout } from "./components/Admin/AdminLayout";
import { OrganizationSettings } from "./components/Admin/OrganizationSettings";
import { UserManagement } from "./components/Admin/UserManagement";
import { Loader2 } from 'lucide-react';



function ProtectedApp() {
  const { isLoading, checkSession } = useStore();

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

  // If we have an org, render the app. If not, Dashboard handles the bootstrap.
  // We simply redirect root to dashboard.

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<Dashboard />} />

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

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Authenticator>
      {() => <ProtectedApp />}
    </Authenticator>
  );
}

export default App;
