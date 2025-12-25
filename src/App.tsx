import { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import { useStore } from "./store";
import { Dashboard } from "./components/Dashboard";
import { HeartbeatEntryPage } from "./components/HeartbeatEntryPage";
import { AdminLayout } from "./components/Admin/AdminLayout";
import { OrganizationSettings } from "./components/Admin/OrganizationSettings";
import { UserManagement } from "./components/Admin/UserManagement";
import { Loader2 } from 'lucide-react';

function OrgGuard({ children }: { children: React.ReactNode }) {
  const { slug } = useParams();
  const { memberships, switchOrganization, currentOrg, isLoading } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && slug) {
      if (memberships.length === 0) {
        navigate('/');
        return;
      }

      const match = memberships.find(m => m.organization?.slug === slug);
      if (match && match.orgId !== currentOrg?.id) {
        switchOrganization(match.orgId);
      } else if (!match) {
        navigate('/');
      }
    }
  }, [slug, memberships, isLoading, currentOrg, switchOrganization, navigate]);

  if (isLoading || (slug && !currentOrg)) {
    // If we have no memberships and aren't loading, we shouldn't be trapped here. 
    // The effect above handles redirection, but render needs to be safe.
    if (!isLoading && memberships.length === 0) return null;

    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return <>{children}</>;
}

function ProtectedApp() {
  const { isLoading, checkSession, currentOrg, memberships } = useStore();

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

  // If no memberships (New User), show empty state or create org (Can be handled by Dashboard if we route there)
  // Logic: If on Root, redirect to first org
  const RootRedirect = () => {
    if (currentOrg) return <Navigate to={`/org/${currentOrg.slug}/dashboard`} replace />;
    if (memberships.length > 0 && memberships[0].organization) return <Navigate to={`/org/${memberships[0].organization.slug}/dashboard`} replace />;
    return <Dashboard />; // Fallback for 0 orgs
  };

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/org/:slug/*" element={
        <OrgGuard>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="heartbeat/:type/:id" element={<HeartbeatEntryPage />} />
            <Route path="admin" element={<Navigate to="settings" replace />} />
            <Route path="admin/*" element={
              <AdminLayout>
                <Routes>
                  <Route path="settings" element={<OrganizationSettings />} />
                  <Route path="users" element={<UserManagement />} />
                </Routes>
              </AdminLayout>
            } />
          </Routes>
        </OrgGuard>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
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
