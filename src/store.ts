import { create } from 'zustand';
import type { BusinessOutcome, User, StatusUpdate, OutcomeStatus } from './types';

interface AppState {
    currentUser: User | null;
    users: User[];
    outcomes: BusinessOutcome[];
    updates: Record<string, StatusUpdate>; // keyed by outcomeId

    // Plan Limits
    planName: 'Free' | 'Pro';
    maxActiveOutcomes: number;

    // Actions
    login: (email: string) => void;
    logout: () => void;
    addUser: (email: string, role: 'Admin' | 'Member') => void;
    createOutcome: (name: string, ownerId: string, strategicValue: 'High' | 'Medium' | 'Low', targetDate: string) => void;
    updateOutcomeStatus: (id: string, status: OutcomeStatus) => void;
    addUpdate: (update: StatusUpdate) => void;
}

// Initial Mock Data
const INITIAL_USERS: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@vantage.inc', role: 'Admin', tenantId: 't1' },
    { id: '2', name: 'Sarah J.', email: 'sarah@vantage.inc', role: 'Member', tenantId: 't1' },
];

export const useStore = create<AppState>((set, get) => ({
    currentUser: null, // Start logged out to show signup flow
    users: INITIAL_USERS,
    outcomes: [],
    updates: {},
    planName: 'Free',
    maxActiveOutcomes: 2,

    login: (email: string) => {
        // Mock login - just find user or create admin if first time
        const existing = get().users.find(u => u.email === email);
        if (existing) {
            set({ currentUser: existing });
        } else {
            // Auto-signup flow
            const newUser: User = {
                id: crypto.randomUUID(),
                name: email.split('@')[0],
                email,
                role: 'Admin',
                tenantId: 't1'
            };
            set(state => ({
                currentUser: newUser,
                users: [...state.users, newUser]
            }));
        }
    },

    logout: () => set({ currentUser: null }),

    addUser: (email, role) => set(state => ({
        users: [...state.users, {
            id: crypto.randomUUID(),
            name: email.split('@')[0],
            email,
            role,
            tenantId: state.currentUser?.tenantId || 't1'
        }]
    })),

    createOutcome: (name, ownerId, strategicValue, targetDate) => set(state => {

        const newOutcome: BusinessOutcome = {
            id: crypto.randomUUID(),
            name,
            ownerId: state.users.find(u => u.id === ownerId)?.name || ownerId, // Store name for simple display in mock
            status: 'Active',
            strategicValue,
            targetDate,
            currentHealth: 'Green', // Default
            riskScore: 0,
            tenantId: state.currentUser?.tenantId || 't1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return { outcomes: [...state.outcomes, newOutcome] };
    }),

    updateOutcomeStatus: (id, status) => set(state => ({
        outcomes: state.outcomes.map(i => i.id === id ? { ...i, status } : i)
    })),

    addUpdate: (update) => set(state => ({
        updates: { ...state.updates, [update.outcomeId]: update }
    })),
}));
