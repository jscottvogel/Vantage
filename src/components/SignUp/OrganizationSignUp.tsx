import { useState } from 'react';
import { useStore } from '../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight, Building2, ShieldCheck, Mail } from 'lucide-react';

export function OrganizationSignUp() {
    const { signupOrganization, isLoading, authError } = useStore();
    const [step, setStep] = useState<'org' | 'admin'>('org');

    const [orgName, setOrgName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('password123'); // Dev default

    const handleOrgSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (orgName.trim()) setStep('admin');
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (adminName.trim() && adminEmail.trim()) {
            await signupOrganization(orgName, adminEmail, adminName, password);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Organization</CardTitle>
                    <CardDescription>
                        Start your journey with Vantage. Free forever for small teams.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'org' ? (
                        <form onSubmit={handleOrgSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Organization Name</label>
                                <input
                                    autoFocus
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="e.g. Acme Corp"
                                    value={orgName}
                                    onChange={e => setOrgName(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" disabled={!orgName.trim()}>
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleFinalSubmit} className="space-y-4">
                            <div className="bg-muted/30 p-3 rounded-md mb-4 flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">{orgName}</p>
                                    <p className="text-xs text-muted-foreground">Organization</p>
                                </div>
                                <Button variant="ghost" size="sm" type="button" className="ml-auto h-6 text-xs" onClick={() => setStep('org')}>Change</Button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Admin Name</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <input
                                        autoFocus
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        placeholder="Full Name"
                                        value={adminName}
                                        onChange={e => setAdminName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        placeholder="name@company.com"
                                        value={adminEmail}
                                        onChange={e => setAdminEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <input
                                    type="password"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>

                            {authError && (
                                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                                    {authError}
                                </div>
                            )}

                            <Button className="w-full" disabled={!adminName.trim() || !adminEmail.trim() || isLoading}>
                                {isLoading ? 'Creating Account...' : 'Complete Setup'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
