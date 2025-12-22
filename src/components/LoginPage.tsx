
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowRight, Building2 } from 'lucide-react';

export function LoginPage() {
    const [step, setStep] = useState<'email' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [simulatedOrg, setSimulatedOrg] = useState<string | null>(null);
    const { login, isLoading, authError } = useStore();

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim().includes('@')) {
            // Simulate lookup - in real app would call API
            // For now, assume if email is valid, we proceed.
            // If we had a "UserOrganization" table, we'd fetch orgs here.
            setSimulatedOrg("Vantage Inc."); // Just a mock display for UX
            setStep('password');
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            await login(email, password);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Welcome to Vantage</CardTitle>
                    <CardDescription>
                        {step === 'email'
                            ? "Enter your work email to sign in."
                            : "Enter your password to continue."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'email' ? (
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="bg-muted/30 p-3 rounded-md mb-4 flex items-center gap-3">
                                <div className="bg-white p-1 rounded-full border">
                                    <Building2 className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">Organization</p>
                                    <p className="text-sm font-medium">{simulatedOrg}</p>
                                </div>
                                <Button variant="ghost" size="sm" type="button" className="h-6 text-xs text-muted-foreground" onClick={() => setStep('email')}>Change</Button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Password</label>
                                    <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
                                </div>
                                <input
                                    type="password"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {authError && (
                                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm font-medium border border-red-200">
                                    {authError}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm border-t pt-4">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link to="/signup" className="text-primary hover:underline font-medium">Create Organization</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
