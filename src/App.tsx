import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from "./store";
import { Dashboard } from "./components/Dashboard";
import { LoginPage } from "./components/LoginPage";
import { OrganizationSignUp } from "./components/SignUp/OrganizationSignUp";
import { AdminLayout } from "./components/Admin/AdminLayout";
import { OrganizationSettings } from "./components/Admin/OrganizationSettings";
import { UserManagement } from "./components/Admin/UserManagement";

function App() {
  const currentUser = useStore(state => state.currentUser);
  const location = useLocation();

  if (!currentUser) {
    if (location.pathname === '/signup') {
      return <OrganizationSignUp />;
    }
    // Redirect to login if not signed up or logged in, but allow signup page
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
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
