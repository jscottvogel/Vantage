import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth';
import * as AmplifyAuth from 'aws-amplify/auth';

// Mock the AWS Amplify Auth module
vi.mock('aws-amplify/auth', () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    fetchUserAttributes: vi.fn()
}));

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCurrentUser', () => {
        it('should return a mapped User object when authenticated', async () => {
            // Mock successful AWS responses
            vi.mocked(AmplifyAuth.getCurrentUser).mockResolvedValue({ userId: 'test-user-id', username: 'test@example.com' });
            vi.mocked(AmplifyAuth.fetchUserAttributes).mockResolvedValue({
                email: 'test@example.com',
                name: 'Test User',
                'custom:role': 'Admin',
                'custom:tenant_id': 'tenant-123'
            });

            const user = await AuthService.getCurrentUser();

            expect(user).toEqual({
                id: 'test-user-id',
                email: 'test@example.com',
                name: 'Test User',
                role: 'Admin',
                tenantId: 'tenant-123',
                status: 'Active'
            });
        });

        it('should return null when not authenticated (error thrown)', async () => {
            vi.mocked(AmplifyAuth.getCurrentUser).mockRejectedValue(new Error('No user'));

            const user = await AuthService.getCurrentUser();

            expect(user).toBeNull();
        });
    });

    describe('signInWithPassword', () => {
        it('should call Amplify signIn', async () => {
            vi.mocked(AmplifyAuth.signIn).mockResolvedValue({ isSignedIn: true, nextStep: { signInStep: 'DONE' } });

            const result = await AuthService.signInWithPassword('test@example.com', 'password');

            expect(AmplifyAuth.signIn).toHaveBeenCalledWith({ username: 'test@example.com', password: 'password' });
            expect(result.isSignedIn).toBe(true);
        });

        it('should propagate errors from Amplify', async () => {
            vi.mocked(AmplifyAuth.signIn).mockRejectedValue(new Error('Invalid password'));

            await expect(AuthService.signInWithPassword('test@example.com', 'wrong')).rejects.toThrow('Invalid password');
        });
    });

    describe('signUp', () => {
        it('should call Amplify signUp with correct attributes and generated tenantId', async () => {
            vi.mocked(AmplifyAuth.signUp).mockResolvedValue({
                isSignUpComplete: false,
                nextStep: {
                    signUpStep: 'CONFIRM_SIGN_UP',
                    codeDeliveryDetails: {
                        deliveryMedium: 'EMAIL',
                        destination: 'new@example.com',
                        attributeName: 'email'
                    }
                }
            });

            await AuthService.signUp('new@example.com', 'password', 'New Admin', 'New Org');

            expect(AmplifyAuth.signUp).toHaveBeenCalledWith(expect.objectContaining({
                username: 'new@example.com',
                password: 'password',
                options: {
                    userAttributes: expect.objectContaining({
                        email: 'new@example.com',
                        name: 'New Admin',
                        'custom:org_name': 'New Org'
                    })
                }
            }));

            // Check if tenantId was generated (uuid-like)
            const callArgs = vi.mocked(AmplifyAuth.signUp).mock.calls[0][0];
            expect(callArgs.options?.userAttributes?.['custom:tenant_id']).toBeDefined();
        });
    });

    describe('signOut', () => {
        it('should call Amplify signOut', async () => {
            await AuthService.signOut();
            expect(AmplifyAuth.signOut).toHaveBeenCalled();
        });
    });
});
