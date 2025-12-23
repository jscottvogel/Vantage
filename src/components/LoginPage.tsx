import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export function LoginPage() {
    const [view, setView] = useState<'LOGIN' | 'FORGOT_PASSWORD' | 'CONFIRM_PASSWORD'>('LOGIN');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // For password reset
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const { login, resetPassword, confirmNewPassword, isLoading, authError } = useStore();

    // Reset error when switching views
    const switchView = (v: typeof view) => {
        useStore.setState({ authError: null });
        setSuccessMsg(null);
        setView(v);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            await login(email, password);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        try {
            await resetPassword(email);
            setView('CONFIRM_PASSWORD');
            setSuccessMsg(`We've sent a verification code to ${email}`);
        } catch (err) {
            // Error handled in store
        }
    };

    const handleConfirmPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetCode || !newPassword) return;
        try {
            await confirmNewPassword(email, resetCode, newPassword);
            setSuccessMsg("Password reset successfully! Please sign in.");
            setView('LOGIN');
            // Pre-fill password field? maybe not for security, but user knows it.
            setPassword('');
        } catch (err) {
            // Error handled in store
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {view === 'LOGIN' && 'Sign in to Vantage'}
                        {view === 'FORGOT_PASSWORD' && 'Reset Password'}
                        {view === 'CONFIRM_PASSWORD' && 'Set New Password'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {view === 'LOGIN' && 'Enter your email and password to access your account'}
                        {view === 'FORGOT_PASSWORD' && 'Enter your email to receive a reset code'}
                        {view === 'CONFIRM_PASSWORD' && 'Enter the code and your new password'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Error / Success Messages */}
                    <div className="space-y-4">
                        {authError && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {authError}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {successMsg}
                            </div>
                        )}

                        {view === 'LOGIN' && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium" htmlFor="password">Password</label>
                                        <button
                                            type="button"
                                            className="text-sm font-medium text-primary hover:underline"
                                            onClick={() => switchView('FORGOT_PASSWORD')}
                                        >
                                            Forgot your password?
                                        </button>
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                                    ) : "Sign In"}
                                </Button>
                            </form>
                        )}

                        {view === 'FORGOT_PASSWORD' && (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="reset-email">Email</label>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Code...</>
                                    ) : "Send Reset Code"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full"
                                    type="button"
                                    onClick={() => switchView('LOGIN')}
                                    disabled={isLoading}
                                >
                                    Back to Sign In
                                </Button>
                            </form>
                        )}

                        {view === 'CONFIRM_PASSWORD' && (
                            <form onSubmit={handleConfirmPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground text-center">
                                        Check your email for the verification code.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Verification Code</label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center tracking-widest"
                                        placeholder="123456"
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">New Password</label>
                                    <input
                                        type="password"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground">Is at least 8 characters long</p>
                                </div>
                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting Password...</>
                                    ) : "Set New Password"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full"
                                    type="button"
                                    onClick={() => switchView('LOGIN')}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                            </form>
                        )}
                    </div>
                </CardContent>
                {view === 'LOGIN' && (
                    <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                        <div>
                            <span className="mr-1">Don't have an organization?</span>
                            <Link to="/signup" className="text-primary hover:underline font-medium">
                                Create New Organization
                            </Link>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
