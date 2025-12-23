
import { describe, it, expect, vi } from 'vitest';
import { useStore } from './store';
import { AuthService } from './services/auth';

// Mock AuthService
vi.mock('./services/auth', () => ({
    AuthService: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getCurrentUser: vi.fn(),
        fetchUserAttributes: vi.fn(),
        confirmSignUp: vi.fn(),
    }
}));

// Mock amplify client
vi.mock('aws-amplify/data', () => ({
    generateClient: () => ({
        models: {
            User: { list: vi.fn(), create: vi.fn() },
            Organization: { get: vi.fn(), create: vi.fn() },
            StrategicObjective: { list: vi.fn() },
            Outcome: {},
            KeyResult: {},
            Initiative: {}
        }
    })
}));

describe('Authentication Logic Flow', () => {

    it('should return NOT_CONFIRMED when login fails with UserNotConfirmedException', async () => {
        const error = new Error('User not confirmed');
        error.name = 'UserNotConfirmedException';
        // @ts-ignore
        AuthService.signInWithPassword.mockRejectedValueOnce(error);

        const result = await useStore.getState().login('test@example.com', 'password');
        expect(result).toBe('NOT_CONFIRMED');
        expect(useStore.getState().authError).toContain('not confirmed');
    });

    it('should return EXISTS when signup fails with UsernameExistsException', async () => {
        const error = new Error('User exists');
        error.name = 'UsernameExistsException';
        // @ts-ignore
        AuthService.signUp.mockRejectedValueOnce(error);

        const result = await useStore.getState().signupOrganization('Org', 'test@example.com', 'Admin');
        expect(result).toBe('EXISTS');
    });

    it('should return CONFIRM when signup returns CONFIRM_SIGN_UP step', async () => {
        // @ts-ignore
        AuthService.signUp.mockResolvedValueOnce({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } });

        const result = await useStore.getState().signupOrganization('Org', 'new@example.com', 'Admin');
        expect(result).toBe('CONFIRM');
    });

    it('should return SUCCESS when login succeeds', async () => {
        // @ts-ignore
        AuthService.signInWithPassword.mockResolvedValueOnce({});
        // Mock checkSession to avoid errors
        useStore.setState({ checkSession: async () => { } });

        const result = await useStore.getState().login('valid@example.com', 'password');
        expect(result).toBe('SUCCESS');
    });
});
