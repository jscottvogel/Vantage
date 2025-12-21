import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const login = useStore(state => state.login);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            login(email);
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
                        </div>
                        <Button type="submit" className="w-full">
                            Continue with Email
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-4">
                            By clicking continue, you agree to our Terms of Service.
                            <br />
                            (For demo: Enter any email to creating a new account)
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
