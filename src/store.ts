import { create } from 'zustand';
import type { Initiative, User, StatusUpdate, InitiativeStatus } from './types';

interface AppState {
    currentUser: User | null;
    users: User[];
    initiatives: Initiative[];
    updates: Record<string, StatusUpdate>; // keyed by initiativeId for simplicity in mock

    // Plan Limits
    planName: 'Free' | 'Pro';
    maxActiveInitiatives: number;

    // Actions
    login: (email: string) => void;
    logout: () => void;
    addUser: (email: string, role: 'Admin' | 'Member') => void;
    createInitiative: (name: string, ownerId: string, strategicValue: 'High' | 'Medium' | 'Low', targetDate: string) => void;
    updateInitiativeStatus: (id: string, status: InitiativeStatus) => void;
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
    initiatives: [], // Start empty to show creation flow
    updates: {},
    planName: 'Free',
    maxActiveInitiatives: 2,

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

    createInitiative: (name, ownerId, strategicValue, targetDate) => set(state => {
        // Note: We won't block here strictly to allow UI to handle the "Soft Cap" warning, 
        // but in a real backend we might throw.

        const newInit: Initiative = {
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

        return { initiatives: [...state.initiatives, newInit] };
    }),

    updateInitiativeStatus: (id, status) => set(state => ({
        initiatives: state.initiatives.map(i => i.id === id ? { ...i, status } : i)
    })),

    addUpdate: (update) => set(state => ({
        updates: { ...state.updates, [update.initiativeId]: update } // simplified generic store
    })),
}));
