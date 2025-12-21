import { create } from 'zustand';
import type { StrategicObjective, User, StatusUpdate, OutcomeStatus, Heartbeat, KeyResultHeartbeat, Initiative, KeyResult, Organization } from './types';

interface AppState {
    currentUser: User | null;
    currentOrganization: Organization | null;
    users: User[];
    objectives: StrategicObjective[];
    updates: Record<string, StatusUpdate>; // keyed by objectiveId

    // Plan Limits
    planName: 'Free' | 'Pro'; // Derived from currentOrganization usually, kept for compat or simple ref
    maxActiveObjectives: number;

    // Actions
    login: (email: string) => void;
    logout: () => void;

    // Org & User Management
    signupOrganization: (orgName: string, adminEmail: string, adminName: string) => void;
    updateOrganization: (updates: Partial<Organization>) => void;

    inviteUser: (email: string, role: 'Admin' | 'Member') => void;
    updateUserRole: (userId: string, role: 'Admin' | 'Member') => void;
    removeUser: (userId: string) => void;

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
    addHeartbeat: (objectiveId: string, initiativeId: string, heartbeat: Heartbeat) => void;
    addKeyResultHeartbeat: (objectiveId: string, krId: string, heartbeat: KeyResultHeartbeat) => void;
    addInitiative: (objectiveId: string, krId: string, initiative: Initiative) => void;
    updateInitiative: (objectiveId: string, krId: string, initiativeId: string, updates: Partial<Initiative>) => void;
    removeInitiative: (objectiveId: string, krId: string, initiativeId: string) => void;

    addKeyResult: (objectiveId: string, outcomeId: string, keyResult: KeyResult) => void;
    updateKeyResult: (objectiveId: string, outcomeId: string, krId: string, updates: Partial<KeyResult>) => void;
    removeKeyResult: (objectiveId: string, outcomeId: string, krId: string) => void;
}

// Initial Mock Data
const MOCK_ORG: Organization = {
    id: 't1',
    name: 'Vantage Inc.',
    subscriptionTier: 'Free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

const INITIAL_USERS: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@vantage.inc', role: 'Admin', tenantId: 't1', status: 'Active' },
    { id: '2', name: 'Sarah J.', email: 'sarah@vantage.inc', role: 'Member', tenantId: 't1', status: 'Active' },
    { id: '3', name: 'Mike T.', email: 'mike@vantage.inc', role: 'Member', tenantId: 't1', status: 'Active' },
];

export const useStore = create<AppState>((set, get) => ({
    currentUser: null, // Start logged out
    currentOrganization: MOCK_ORG,
    users: INITIAL_USERS,
    objectives: [],
    updates: {},
    planName: 'Free',
    maxActiveObjectives: 2,

    login: (email: string) => {
        // Mock login - just find user
        const existing = get().users.find(u => u.email === email);
        if (existing) {
            set({ currentUser: existing, currentOrganization: MOCK_ORG });
        } else {
            // Fallback for demo: auto-create a user if not found, but ideally this is blocked
            console.warn("User not found, auto-creating for demo");
            const newUser: User = {
                id: crypto.randomUUID(),
                name: email.split('@')[0],
                email,
                role: 'Admin',
                tenantId: 't1',
                status: 'Active'
            };
            set(state => ({
                currentUser: newUser,
                users: [...state.users, newUser],
                currentOrganization: MOCK_ORG
            }));
        }
    },

    logout: () => set({ currentUser: null }),

    signupOrganization: (orgName, adminEmail, adminName) => {
        const newOrgId = crypto.randomUUID();
        const newOrg: Organization = {
            id: newOrgId,
            name: orgName,
            subscriptionTier: 'Free',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const newAdmin: User = {
            id: crypto.randomUUID(),
            name: adminName,
            email: adminEmail,
            role: 'Admin',
            tenantId: newOrgId,
            status: 'Active'
        };

        set({
            currentOrganization: newOrg,
            currentUser: newAdmin,
            users: [newAdmin],
            objectives: [], // Clean slate
            planName: 'Free'
        });
    },

    updateOrganization: (updates) => set(state => state.currentOrganization ? ({
        currentOrganization: { ...state.currentOrganization, ...updates },
        planName: updates.subscriptionTier === 'Pro' ? 'Pro' : state.planName // Sync plan name if tier changes
    }) : {}),

    inviteUser: (email, role) => set(state => ({
        users: [...state.users, {
            id: crypto.randomUUID(),
            name: email.split('@')[0] || 'Invited User',
            email,
            role,
            tenantId: state.currentOrganization?.id || 't1',
            status: 'Invited'
        }]
    })),

    updateUserRole: (userId, role) => set(state => ({
        users: state.users.map(u => u.id === userId ? { ...u, role } : u)
    })),

    removeUser: (userId) => set(state => ({
        users: state.users.filter(u => u.id !== userId)
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
                    heartbeats: [], // Init empty heartbeats
                    initiatives: kr.initiatives.map(init => ({
                        ...init,
                        id: crypto.randomUUID(),
                        status: 'active',
                        startDate: new Date().toISOString(),
                        targetEndDate: targetDate, // Default to objective target
                        heartbeatCadence: 'weekly',
                        supportedKeyResults: [],
                        heartbeats: []
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

    addHeartbeat: (objectiveId, initiativeId, heartbeat) => set(state => ({
        objectives: state.objectives.map(obj =>
            obj.id === objectiveId ? {
                ...obj,
                outcomes: obj.outcomes.map(out => ({
                    ...out,
                    keyResults: out.keyResults.map(kr => ({
                        ...kr,
                        initiatives: kr.initiatives.map(init =>
                            init.id === initiativeId ? {
                                ...init,
                                heartbeats: [...init.heartbeats, heartbeat]
                            } : init
                        )
                    }))
                }))
            } : obj
        )
    })),

    addKeyResultHeartbeat: (objectiveId, krId, heartbeat) => set(state => ({
        objectives: state.objectives.map(obj =>
            obj.id === objectiveId ? {
                ...obj,
                outcomes: obj.outcomes.map(out => ({
                    ...out,
                    keyResults: out.keyResults.map(kr =>
                        kr.id === krId ? {
                            ...kr,
                            heartbeats: [...kr.heartbeats, heartbeat]
                        } : kr
                    )
                }))
            } : obj
        )
    })),

    addInitiative: (objectiveId, krId, initiative) => set(state => ({
        objectives: state.objectives.map(obj =>
            obj.id === objectiveId ? {
                ...obj,
                outcomes: obj.outcomes.map(out => ({
                    ...out,
                    keyResults: out.keyResults.map(kr =>
                        kr.id === krId ? {
                            ...kr,
                            initiatives: [...kr.initiatives, initiative]
                        } : kr
                    )
                }))
            } : obj
        )
    })),

    removeInitiative: (objectiveId, krId, initiativeId) => set(state => ({
        objectives: state.objectives.map(obj =>
            obj.id === objectiveId ? {
                ...obj,
                outcomes: obj.outcomes.map(out => ({
                    ...out,
                    keyResults: out.keyResults.map(kr =>
                        kr.id === krId ? {
                            ...kr,
                            initiatives: kr.initiatives.filter(i => i.id !== initiativeId)
                        } : kr
                    )
                }))
            } : obj
        )
    })),

    updateInitiative: (objectiveId, krId, initiativeId, updates) => set(state => ({
        objectives: state.objectives.map(obj =>
            obj.id === objectiveId ? {
                ...obj,
                outcomes: obj.outcomes.map(out => ({
                    ...out,
                    keyResults: out.keyResults.map(kr =>
                        kr.id === krId ? {
                            ...kr,
                            initiatives: kr.initiatives.map(i => i.id === initiativeId ? { ...i, ...updates } : i)
                        } : kr
                    )
                }))
            } : obj
        )
    })),

    addKeyResult: (objectiveId, outcomeId, keyResult) => set(state => ({
        objectives: state.objectives.map(obj =>
            obj.id === objectiveId ? {
                ...obj,
                outcomes: obj.outcomes.map(out =>
                    out.id === outcomeId ? {
                        ...out,
                        keyResults: [...out.keyResults, keyResult]
                    } : out
                )
            } : obj
        )
    })),

    updateKeyResult: (objectiveId, outcomeId, krId, updates) => set(state => ({
        objectives: state.objectives.map(obj =>
            obj.id === objectiveId ? {
                ...obj,
                outcomes: obj.outcomes.map(out =>
                    out.id === outcomeId ? {
                        ...out,
                        keyResults: out.keyResults.map(kr => kr.id === krId ? { ...kr, ...updates } : kr)
                    } : out
                )
            } : obj
        )
    })),

    removeKeyResult: (objectiveId, outcomeId, krId) => set(state => ({
        objectives: state.objectives.map(obj =>
            obj.id === objectiveId ? {
                ...obj,
                outcomes: obj.outcomes.map(out =>
                    out.id === outcomeId ? {
                        ...out,
                        keyResults: out.keyResults.filter(kr => kr.id !== krId)
                    } : out
                )
            } : obj
        )
    })),
}));
