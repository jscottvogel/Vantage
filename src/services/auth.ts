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
        } catch (error) {
            // No current user
            return null;
        }
    },

    async signIn(_email: string) {
        throw new Error("UI needs to collect password");
    },

    async signInWithPassword(username: string, password: string) {
        return await signIn({ username, password });
    },

    async signUp(email: string, password: string, name: string, orgName: string) {
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
    },

    async signOut() {
        await signOut();
    }
};
