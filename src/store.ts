import { create } from 'zustand';
import type { StrategicObjective, User, StatusUpdate, OutcomeStatus } from './types';

interface AppState {
    currentUser: User | null;
    users: User[];
    objectives: StrategicObjective[];
    updates: Record<string, StatusUpdate>; // keyed by objectiveId

    // Plan Limits
    planName: 'Free' | 'Pro';
    maxActiveObjectives: number;

    // Actions
    login: (email: string) => void;
    logout: () => void;
    addUser: (email: string, role: 'Admin' | 'Member') => void;
    createObjective: (
        name: string,
        ownerId: string,
        strategicValue: 'High' | 'Medium' | 'Low',
        targetDate: string,
        outcomes: {
            goal: string;
            benefit: string;
            keyResults: {
                description: string;
                ownerId: string;
                initiatives: { name: string; ownerId: string; link?: string }[];
            }[];
        }[]
    ) => void;
    updateObjectiveStatus: (id: string, status: OutcomeStatus) => void;
    addUpdate: (update: StatusUpdate) => void;
}

// Initial Mock Data
const INITIAL_USERS: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@vantage.inc', role: 'Admin', tenantId: 't1' },
    { id: '2', name: 'Sarah J.', email: 'sarah@vantage.inc', role: 'Member', tenantId: 't1' },
    { id: '3', name: 'Mike T.', email: 'mike@vantage.inc', role: 'Member', tenantId: 't1' },
];

export const useStore = create<AppState>((set, get) => ({
    currentUser: null, // Start logged out to show signup flow
    users: INITIAL_USERS,
    objectives: [],
    updates: {},
    planName: 'Free',
    maxActiveObjectives: 2,

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

    createObjective: (name, ownerId, strategicValue, targetDate, outcomes) => set(state => {

        // Objective Owner Display Logic
        const objectiveOwnerName = state.users.find(u => u.id === ownerId)?.name || ownerId;

        const newObjective: StrategicObjective = {
            id: crypto.randomUUID(),
            name,
            ownerId: objectiveOwnerName,
            status: 'Active',
            strategicValue,
            targetDate,

            // Map Outcome Layer
            outcomes: outcomes.map(out => ({
                id: crypto.randomUUID(),
                goal: out.goal,
                benefit: out.benefit,
                keyResults: out.keyResults.map(kr => ({
                    ...kr,
                    id: crypto.randomUUID(),
                    initiatives: kr.initiatives.map(init => ({
                        ...init,
                        id: crypto.randomUUID()
                    }))
                }))
            })),

            currentHealth: 'Green', // Default
            riskScore: 0,
            tenantId: state.currentUser?.tenantId || 't1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return { objectives: [...state.objectives, newObjective] };
    }),

    updateObjectiveStatus: (id, status) => set(state => ({
        objectives: state.objectives.map(i => i.id === id ? { ...i, status } : i)
    })),

    addUpdate: (update) => set(state => ({
        updates: { ...state.updates, [update.objectiveId]: update }
    })),
}));
