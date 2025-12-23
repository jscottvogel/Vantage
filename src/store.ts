import { create } from 'zustand';
import { AuthService } from './services/auth';
import type { StrategicObjective, User, OutcomeStatus, Heartbeat, Initiative, KeyResult, Organization, HeartbeatCadence } from './types';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

interface AppState {
    currentUser: User | null;
    currentOrganization: Organization | null;
    users: User[];
    objectives: StrategicObjective[];

    // Plan Limits
    planName: 'Free' | 'Pro';
    maxActiveObjectives: number;
    isLoading: boolean;
    authError: string | null;

    // Actions
    checkSession: () => Promise<void>;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => Promise<void>;

    // Org & User Management
    signupOrganization: (orgName: string, adminEmail: string, adminName: string, password?: string) => Promise<boolean>;
    confirmSignUp: (email: string, code: string) => Promise<void>;
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
            startDate: string;
            targetDate: string;
            heartbeatCadence: HeartbeatCadence;
            keyResults: {
                description: string;
                ownerId: string;
                startDate: string;
                targetDate: string;
                heartbeatCadence: HeartbeatCadence;
                initiatives: { name: string; ownerId: string; link?: string }[];
            }[];
        }[]
    ) => Promise<void>;

    updateObjectiveStatus: (id: string, status: OutcomeStatus) => void;

    addHeartbeat: (targetId: string, targetType: 'objective' | 'kr' | 'initiative', heartbeat: Heartbeat) => Promise<void>;

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

export const useStore = create<AppState>((set, get) => ({
    currentUser: null, // Start logged out
    currentOrganization: MOCK_ORG,
    users: [], // Start empty
    objectives: [],
    planName: 'Free',
    maxActiveObjectives: 2,
    isLoading: true,
    authError: null,

    checkSession: async () => {
        try {
            const user = await AuthService.getCurrentUser();

            // Fetch users for the tenant
            let team: User[] = [];
            if (user?.tenantId) {
                const { data: userRecords } = await client.models.User.list({
                    filter: { tenantId: { eq: user.tenantId } }
                });

                team = userRecords.map(r => ({
                    id: r.id,
                    email: r.email,
                    name: r.name || '',
                    role: (r.role as 'Admin' | 'Member') || 'Member',
                    tenantId: r.tenantId || '',
                    status: (r.status as 'Active' | 'Invited') || 'Active'
                }));

                // Self-healing: If current user is not in the DB
                const currentUserInDb = team.find(u => u.email === user.email);
                if (!currentUserInDb) {
                    try {
                        const { data: newUser } = await client.models.User.create({
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            tenantId: user.tenantId,
                            status: 'Active'
                        });

                        if (newUser) {
                            const mappedNewUser: User = {
                                id: newUser.id,
                                email: newUser.email,
                                name: newUser.name || '',
                                role: (newUser.role as 'Admin' | 'Member'),
                                tenantId: newUser.tenantId || '',
                                status: 'Active'
                            };
                            team.push(mappedNewUser);
                        }
                    } catch (err) {
                        console.error("Failed to auto-create user record:", err);
                    }
                }

                // Fetch Organization Details
                let activeOrg = get().currentOrganization;
                if (user.tenantId) {
                    try {
                        const { data: orgData } = await client.models.Organization.get({ id: user.tenantId });
                        if (orgData) {
                            activeOrg = {
                                id: orgData.id,
                                name: orgData.name,
                                subscriptionTier: (orgData.subscriptionTier as any) || 'Free',
                                domain: orgData.domain || undefined,
                                createdAt: orgData.createdAt,
                                updatedAt: orgData.updatedAt
                            };
                        }
                    } catch (err) {
                        console.error("Failed to load organization:", err);
                    }
                }

                // Fetch Objectives with nested relations
                const { data: objList } = await client.models.StrategicObjective.list({
                    filter: { tenantId: { eq: user.tenantId } },
                    selectionSet: [
                        'id', 'name', 'ownerId', 'strategicValue', 'targetDate', 'status', 'currentHealth', 'riskScore', 'tenantId', 'createdAt', 'updatedAt',
                        'heartbeats.*',
                        'outcomes.id', 'outcomes.goal', 'outcomes.benefit', 'outcomes.startDate', 'outcomes.targetDate', 'outcomes.heartbeatCadence.*',
                        'outcomes.keyResults.id', 'outcomes.keyResults.description', 'outcomes.keyResults.ownerId', 'outcomes.keyResults.startDate', 'outcomes.keyResults.targetDate', 'outcomes.keyResults.heartbeatCadence.*',
                        'outcomes.keyResults.heartbeats.*',
                        'outcomes.keyResults.initiatives.id', 'outcomes.keyResults.initiatives.name', 'outcomes.keyResults.initiatives.ownerId', 'outcomes.keyResults.initiatives.link', 'outcomes.keyResults.initiatives.status', 'outcomes.keyResults.initiatives.startDate', 'outcomes.keyResults.initiatives.targetEndDate',
                        'outcomes.keyResults.initiatives.heartbeats.*'
                    ]
                });

                set({ currentUser: user, users: team, currentOrganization: activeOrg, objectives: objList as unknown as StrategicObjective[], isLoading: false });
            } else {
                set({ currentUser: user, users: team, isLoading: false });
            }
        } catch (e) {
            console.error("Session check failed", e);
            set({ currentUser: null, users: [], isLoading: false });
        }
    },

    login: async (email: string, password = 'password123') => {
        set({ isLoading: true, authError: null });
        try {
            await AuthService.signInWithPassword(email, password);
            await get().checkSession();
        } catch (e: any) {
            console.error("Login failed:", e);
            if (e.name === 'UserAlreadyAuthenticatedException' || e.message?.includes('already a signed in user')) {
                // If already signed in, just check session
                await get().checkSession();
                return;
            }
            set({ isLoading: false, authError: e.message || "Login failed" });
        }
    },

    logout: async () => {
        set({ isLoading: true });
        await AuthService.signOut();
        set({ currentUser: null, objectives: [], users: [], isLoading: false });
    },

    signupOrganization: async (orgName, adminEmail, adminName, password = 'password123') => {
        set({ isLoading: true, authError: null });
        try {
            const { nextStep } = await AuthService.signUp(adminEmail, password, adminName, orgName);

            if (nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
                set({ isLoading: false });
                return false;
            }

            return true;
        } catch (e: any) {
            console.error("Signup failed:", e);
            let msg = e.message || "An unexpected error occurred.";

            const errorName = e.name || e.code;
            const errorMessage = e.message || '';

            if (errorName === 'InvalidPasswordException') {
                msg = "Password must be at least 8 characters, numbers, mixed case, and symbols.";
            } else if (
                errorName === 'UsernameExistsException' ||
                errorMessage.includes('already exists') ||
                errorMessage.includes('UsernameExistsException')
            ) {
                msg = "An account with this email already exists.";
            } else if (errorName === 'CodeDeliveryFailureException') {
                msg = "Failed to send verification email. Please check the email address.";
            }

            set({ isLoading: false, authError: msg });
            return false;
        }
    },

    confirmSignUp: async (email: string, code: string) => {
        set({ isLoading: true, authError: null });
        try {
            await AuthService.confirmSignUp(email, code);
            set({ isLoading: false });
        } catch (e: any) {
            console.error("Confirmation failed:", e);
            set({ isLoading: false, authError: e.message || "Invalid code" });
            throw e;
        }
    },

    updateOrganization: (updates) => set(state => state.currentOrganization ? ({
        currentOrganization: { ...state.currentOrganization, ...updates },
        planName: updates.subscriptionTier === 'Pro' ? 'Pro' : state.planName
    }) : {}),

    inviteUser: async (email, role) => {
        const currentUser = get().currentUser;
        if (!currentUser?.tenantId) return;

        try {
            const { data: newUser } = await client.models.User.create({
                email,
                name: email.split('@')[0],
                role,
                tenantId: currentUser.tenantId,
                status: 'Invited'
            });

            if (newUser) {
                const mappedUser: User = {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name || '',
                    role: (newUser.role as 'Admin' | 'Member'),
                    tenantId: newUser.tenantId || '',
                    status: 'Invited'
                };
                set(state => ({ users: [...state.users, mappedUser] }));
            }
        } catch (error) {
            console.error("Failed to invite user:", error);
        }
    },

    updateUserRole: async (userId, role) => {
        try {
            await client.models.User.update({
                id: userId,
                role
            });
            set(state => ({
                users: state.users.map(u => u.id === userId ? { ...u, role } : u)
            }));
        } catch (error) {
            console.error("Failed to update user role:", error);
        }
    },

    removeUser: async (userId) => {
        try {
            await client.models.User.delete({ id: userId });
            set(state => ({
                users: state.users.filter(u => u.id !== userId)
            }));
        } catch (error) {
            console.error("Failed to remove user:", error);
        }
    },

    createObjective: async (name, ownerId, strategicValue, targetDate, outcomes) => {
        set({ isLoading: true });
        try {
            const tenantId = get().currentUser?.tenantId;
            if (!tenantId) throw new Error("No tenant ID found");

            const { data: newObj } = await client.models.StrategicObjective.create({
                name,
                ownerId,
                strategicValue,
                targetDate,
                status: 'Active',
                currentHealth: 'Green',
                riskScore: 0,
                tenantId
            });

            if (!newObj) throw new Error("Failed to create objective");

            const createdOutcomes = [];

            for (const out of outcomes) {
                const { data: newOut } = await client.models.Outcome.create({
                    objectiveId: newObj.id,
                    goal: out.goal,
                    benefit: out.benefit,
                    startDate: out.startDate,
                    targetDate: out.targetDate,
                    heartbeatCadence: out.heartbeatCadence
                });
                if (!newOut) continue;

                const createdKRs = [];

                for (const kr of out.keyResults) {
                    const { data: newKr } = await client.models.KeyResult.create({
                        outcomeId: newOut.id,
                        description: kr.description,
                        ownerId: kr.ownerId,
                        startDate: kr.startDate,
                        targetDate: kr.targetDate,
                        heartbeatCadence: kr.heartbeatCadence
                    });
                    if (!newKr) continue;

                    const createdInits = [];

                    for (const init of kr.initiatives) {
                        const { data: newInit } = await client.models.Initiative.create({
                            keyResultId: newKr.id,
                            name: init.name,
                            ownerId: init.ownerId,
                            link: init.link,
                            status: 'active',
                            startDate: new Date().toISOString(),
                            targetEndDate: targetDate
                        });
                        createdInits.push(newInit);
                    }
                    createdKRs.push({ ...newKr, initiatives: createdInits });
                }
                createdOutcomes.push({ ...newOut, keyResults: createdKRs });
            }

            const fullObj: StrategicObjective = {
                ...newObj,
                outcomes: createdOutcomes
            } as unknown as StrategicObjective;

            set(state => ({
                objectives: [...state.objectives, fullObj],
                isLoading: false
            }));

        } catch (e: any) {
            console.error("Create Objective Failed:", e);
            set({ isLoading: false });
        }
    },

    updateObjectiveStatus: (id, status) => set(state => ({
        objectives: state.objectives.map(i => i.id === id ? { ...i, status } : i)
    })),

    addHeartbeat: async (targetId: string, targetType: 'objective' | 'kr' | 'initiative', heartbeat: Heartbeat) => {
        try {
            const payload: any = {
                periodStart: heartbeat.periodStart,
                periodEnd: heartbeat.periodEnd,
                healthSignal: heartbeat.healthSignal,
                confidence: heartbeat.confidence || 'Medium',
                narrative: heartbeat.narrative,
                confidenceToExpectedImpact: heartbeat.confidenceToExpectedImpact,
                leadingIndicators: heartbeat.leadingIndicators,
                evidence: heartbeat.evidence,
                risks: heartbeat.risks,
                ownerAttestation: heartbeat.ownerAttestation
            };

            if (targetType === 'objective') payload.objectiveId = targetId;
            if (targetType === 'kr') payload.keyResultId = targetId;
            if (targetType === 'initiative') payload.initiativeId = targetId;

            await client.models.Heartbeat.create(payload);

            set(state => {
                const add = (items: Heartbeat[] | undefined) => [...(items || []), heartbeat];

                return {
                    objectives: state.objectives.map(obj => {
                        if (targetType === 'objective' && obj.id === targetId) {
                            return { ...obj, heartbeats: add(obj.heartbeats) };
                        }

                        return {
                            ...obj,
                            outcomes: obj.outcomes.map(out => ({
                                ...out,
                                keyResults: out.keyResults.map(kr => {
                                    if (targetType === 'kr' && kr.id === targetId) {
                                        return { ...kr, heartbeats: add(kr.heartbeats) };
                                    }

                                    return {
                                        ...kr,
                                        initiatives: kr.initiatives.map(init => {
                                            if (targetType === 'initiative' && init.id === targetId) {
                                                return { ...init, heartbeats: add(init.heartbeats) };
                                            }
                                            return init;
                                        })
                                    };
                                })
                            }))
                        };
                    })
                };
            });
        } catch (e) {
            console.error("Failed to add heartbeat", e);
        }
    },

    addInitiative: (objectiveId: string, krId: string, initiative: Initiative) => set(state => ({
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

    removeInitiative: (objectiveId: string, krId: string, initiativeId: string) => set(state => ({
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

    updateInitiative: (objectiveId: string, krId: string, initiativeId: string, updates: Partial<Initiative>) => set(state => ({
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

    addKeyResult: (objectiveId: string, outcomeId: string, keyResult: KeyResult) => set(state => ({
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

    updateKeyResult: (objectiveId: string, outcomeId: string, krId: string, updates: Partial<KeyResult>) => set(state => ({
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

    removeKeyResult: (objectiveId: string, outcomeId: string, krId: string) => set(state => ({
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
    }))
}));
