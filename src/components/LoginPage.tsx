import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, authError } = useStore();

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
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>
                        Enter your credentials to sign in.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                                required
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

                    <div className="mt-6 text-center text-sm border-t pt-4">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link to="/signup" className="text-primary hover:underline font-medium">Create Organization</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
