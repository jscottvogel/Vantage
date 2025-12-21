import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('password123'); // Dev default
    const { login, isLoading, authError } = useStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            await login(email, password);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Welcome to Vantage</CardTitle>
                    <CardDescription>
                        Enter your work email to sign in or create your organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <input
                                type="email"
                                placeholder="name@company.com"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password (Dev Default: password123)</label>
                                <input
                                    type="password"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        {authError && <p className="text-sm text-red-500">{authError}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-4">
                            By clicking continue, you agree to our Terms of Service.
                        </p>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        <span className="text-muted-foreground">Detailed logic pending? </span>
                        <Link to="/signup" className="text-primary hover:underline font-medium">Create New Organization</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
