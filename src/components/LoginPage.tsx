import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import { useStore } from '../store';

export function LoginPage() {
    const { checkSession } = useStore();
    const navigate = useNavigate();

    // We can use the 'components' prop to customize the header/footer if needed
    // but simply hiding sign up and adding a link below is good.

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <div className="w-full max-w-lg">
                <Authenticator hideSignUp={true}>
                    {({ user }) => {
                        // Once signed in, trigger session check and redirect
                        useEffect(() => {
                            if (user) {
                                checkSession();
                                navigate('/');
                            }
                        }, [user, checkSession, navigate]);

                        return (
                            <div className="text-center p-4">
                                <p>Signing you in...</p>
                            </div>
                        );
                    }}
                </Authenticator>

                <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">Need an organization? </span>
                    <Link to="/signup" className="text-primary hover:underline font-medium">Create New Organization</Link>
                </div>
            </div>
        </div>
    );
}
