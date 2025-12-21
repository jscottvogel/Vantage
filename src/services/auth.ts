import { signIn, signUp, signOut, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import type { User } from '../types';

export const AuthService = {
    async getCurrentUser(): Promise<User | null> {
        try {
            const authUser = await getCurrentUser();
            const attributes = await fetchUserAttributes();

            // Map Cognito attributes to User
            return {
                id: authUser.userId,
                email: attributes.email || '',
                name: attributes.name || attributes.email?.split('@')[0] || 'User',
                role: (attributes['custom:role'] as 'Admin' | 'Member') || 'Member',
                tenantId: attributes['custom:tenant_id'] || '',
                status: 'Active'
            };
        } catch (error: any) {
            // Implicit Dev Fallback: If Amplify is not configured (or dummy config), allow dev login
            if (error.name === 'NotConfiguredException' || error.message?.includes('not been configured')) {
                const stored = localStorage.getItem('vantage_dev_user');
                return stored ? JSON.parse(stored) : null;
            }
            return null;
        }
    },

    async signIn(_email: string) {
        throw new Error("UI needs to collect password");
    },

    async signInWithPassword(username: string, password: string) {
        try {
            return await signIn({ username, password });
        } catch (error: any) {
            // Implicit Dev Fallback
            if (error.name === 'NotConfiguredException' || error.message?.includes('not been configured') || error.message?.includes('User pool client')) {
                console.warn("Backend not configured. Logging in as Dev User.");
                const mockUser: User = {
                    id: 'dev-user-1',
                    email: username,
                    name: 'Dev Admin',
                    role: 'Admin',
                    tenantId: 'dev-tenant-1',
                    status: 'Active'
                };
                localStorage.setItem('vantage_dev_user', JSON.stringify(mockUser));
                return { isSignedIn: true };
            }
            throw error;
        }
    },

    async signUp(email: string, password: string, name: string, orgName: string) {
        try {
            // orgName is meant to be saved to DB/tenant logic. 
            // In Cognito, we can store tenantId as attribute.
            // We generate a tenantId here.
            const tenantId = crypto.randomUUID();

            return await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                        name,
                        'custom:role': 'Admin',
                        'custom:tenant_id': tenantId,
                        'custom:org_name': orgName // Store org name in attribute for simple retrieval
                    }
                }
            });
        } catch (error: any) {
            // Implicit Dev Fallback
            if (error.name === 'NotConfiguredException' || error.message?.includes('not been configured') || error.message?.includes('User pool client')) {
                console.warn("Backend not configured. Simulating Signup.");
                return { isSignUpComplete: true };
            }
            throw error;
        }
    },

    async signOut() {
        try {
            await signOut();
        } catch (e) {
            // Fallback
            localStorage.removeItem('vantage_dev_user');
        }
        localStorage.removeItem('vantage_dev_user');
    }
};
