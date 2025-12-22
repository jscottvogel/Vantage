import { signIn, signUp, signOut, confirmSignUp, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import type { User } from '../types';

/**
 * Service to handle Authentication interactions with AWS Cognito.
 * Provides methods for signing up, signing in, signing out, and retrieving current user details.
 */
export const AuthService = {
    /**
     * Retrieves the currently authenticated user from Cognito and maps attributes to the User type.
     * @returns Promise<User | null> The current user or null if not authenticated.
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            const authUser = await getCurrentUser();
            const attributes = await fetchUserAttributes();

            // Map Cognito attributes to User
            return {
                id: authUser.userId,
                email: attributes.email || '',
                name: attributes.name || attributes.email?.split('@')[0] || 'User',
                role: (attributes.profile as 'Admin' | 'Member') || 'Member',
                tenantId: attributes.locale || '',
                status: 'Active'
            };
        } catch (error) {
            // No current user session found
            return null;
        }
    },

    /**
     * @deprecated Use signInWithPassword instead.
     */
    async signIn(_email: string): Promise<void> {
        throw new Error("UI needs to collect password. Use signInWithPassword instead.");
    },

    /**
     * Signs in a user with username (email) and password.
     * @param username The user's email address.
     * @param password The user's password.
     * @returns Promise<SignInOutput> logic from Amplify.
     */
    async signInWithPassword(username: string, password: string) {
        return await signIn({ username, password });
    },

    /**
     * Signs up a new Organization Admin user.
     * Generates a new tenantId for the organization.
     * @param email Admin email
     * @param password Admin password
     * @param name Admin full name
     * @param orgName Organization name
     * @returns Promise<SignUpOutput>
     */
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
                    'profile': 'Admin',        // profile -> Role
                    'locale': tenantId,        // locale -> TenantID
                    'nickname': orgName        // nickname -> OrgName
                }
            }
        });
    },

    /**
     * Signs out the current user.
     */
    async signOut(): Promise<void> {
        await signOut();
    },

    /**
     * Confirms the sign up with the code sent to the email.
     * @param username The user's email address.
     * @param confirmationCode The code sent to the user.
     */
    async confirmSignUp(username: string, confirmationCode: string) {
        return await confirmSignUp({ username, confirmationCode });
    }
};
