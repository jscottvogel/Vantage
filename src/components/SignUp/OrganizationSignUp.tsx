import { useState } from 'react';
import { useStore } from '../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight, Building2, ShieldCheck, Mail } from 'lucide-react';

export function OrganizationSignUp() {
    const { signupOrganization, confirmSignUp, login, isLoading, authError } = useStore();
    const [step, setStep] = useState<'org' | 'admin' | 'verify'>('org');

    const [orgName, setOrgName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');

    const handleOrgSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (orgName.trim()) setStep('admin');
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (adminName.trim() && adminEmail.trim()) {
            try {
                // Try initial signup
                let result = await signupOrganization(orgName, adminEmail, adminName, password);

                // If account exists, try logging in to check status
                if (result === 'EXISTS') {
                    const loginResult = await login(adminEmail, password);
                    if (loginResult === 'NOT_CONFIRMED') {
                        setStep('verify');
                        return;
                    }
                } else if (result === 'CONFIRM') {
                    setStep('verify');
                    return;
                } else if (result === 'COMPLETE') {
                    await login(adminEmail, password);
                }

                // Fallback check (legacy or if status code missed)
                const currentError = useStore.getState().authError;
                if (currentError && currentError.includes('not confirmed')) {
                    setStep('verify');
                }
            } catch (err) {
                console.error("Unhandled signup error in component:", err);
            }
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim()) {
            try {
                await confirmSignUp(adminEmail, code);
                // Success! Now login
                await login(adminEmail, password);
            } catch (err) {
                // Error handled in store
            }
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
                    {step === 'org' && (
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
                    )}

                    {step === 'admin' && (
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
                                <p className="text-xs text-muted-foreground">
                                    Must be at least 8 characters, including uppercase, lowercase, numbers, and symbols.
                                </p>
                            </div>

                            {authError && (
                                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium border border-destructive/20 flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{authError}</span>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <Button className="w-full" disabled={!adminName.trim() || !adminEmail.trim() || isLoading}>
                                    {isLoading ? 'Creating Account...' : 'Complete Setup'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-xs text-muted-foreground"
                                    onClick={() => setStep('verify')}
                                >
                                    Already have a code? Enter it here.
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 'verify' && (
                        <form onSubmit={handleVerifySubmit} className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground text-center">
                                    We sent a verification code to <strong>{adminEmail}</strong>.
                                    Enter it below to verify your account.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Verification Code</label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center tracking-widest text-lg"
                                    placeholder="123456"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            {authError && (
                                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm font-medium border border-red-200">
                                    {authError}
                                </div>
                            )}

                            <Button className="w-full" disabled={!code.trim() || isLoading}>
                                {isLoading ? 'Verifying...' : 'Verify Email'}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-xs"
                                onClick={() => setStep('admin')}
                            >
                                Back
                            </Button>
                        </form>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
