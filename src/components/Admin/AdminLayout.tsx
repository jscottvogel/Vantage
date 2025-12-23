import { Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const currentUser = useStore(state => state.currentUser);
    const currentOrg = useStore(state => state.currentOrganization);

    if (!currentUser || currentUser.role !== 'Admin') {
        return <Navigate to="/" replace />;
    }

    const navItems = [
        { name: 'Organization', path: '/admin/settings', icon: LayoutDashboard },
        { name: 'User Management', path: '/admin/users', icon: Users },
        // { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="h-14 flex items-center px-4 border-b">
                    <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back to App
                    </Link>
                </div>

                <div className="p-4 border-b bg-slate-50/50">
                    <h2 className="text-sm font-semibold text-slate-900">{currentOrg?.name || 'Organization'}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Admin Console</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                location.pathname === item.path
                                    ? "bg-primary/10 text-primary"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t mt-auto">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-stone-100 text-stone-600">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-xs font-medium">Billing managed via AWS</span>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
