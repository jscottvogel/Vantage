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
        // For this demo (passwordless/magic-link implies challenges), 
        // but sticking to standard password flow for now as "email" was the prompt input.
        // Assuming we need a password, but the UX only asked for email.
        // I will trigger a sign-in, but this might need a password or OTP flow.
        // For the purpose of "Hooking up", I'll implement standard signIn.
        // If the user meant "Passwordless", that requires specific backend config.
        // I will assume standard auth for now and update the UI to ask for password if needed.
        // WAIT: The prompt said "We have to have the email address for users".
        // Let's implement signIn with a hardcoded dev password or prompt.
        // Actually, let's update the UI to ask for password later.

        // REVISE: I'll accept just email here but returning the result might prompt next step.
        // Use a default password for the "Auto-Signup" demo feel or expect password in UI?
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
