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
    login: (email: string, password?: string) => Promise<string | void>;
    logout: () => Promise<void>;

    // Org & User Management
    signupOrganization: (orgName: string, adminEmail: string, adminName: string, password?: string) => Promise<'CONFIRM' | 'COMPLETE' | 'FAILED' | 'EXISTS'>;
    confirmSignUp: (email: string, code: string) => Promise<void>;
    updateOrganization: (updates: Partial<Organization>) => void;

    resetPassword: (email: string) => Promise<void>;
    confirmNewPassword: (email: string, code: string, newPassword: string) => Promise<void>;

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
            ownerId: string;
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
        let authUser: User | null = null;
        try {
            authUser = await AuthService.getCurrentUser();
        } catch (e) {
            console.error("Auth check failed completely", e);
        }

        if (!authUser) {
            set({ currentUser: null, users: [], isLoading: false });
            return;
        }

        // We have an authenticated user. Set them immediately to prevent login loops.
        // We will update the full state with data later.
        set({ currentUser: authUser });

        try {
            // Safety check for Amplify models
            if (!client.models.User || !client.models.StrategicObjective || !client.models.Outcome || !client.models.KeyResult || !client.models.Initiative) {
                console.warn("Amplify models not found. Ensure amplify_outputs.json is up to date and backend is deployed.");
                set({ isLoading: false });
                return;
            }

            // Fetch users for the tenant
            let team: User[] = [];
            let activeOrg = get().currentOrganization;
            let objList: StrategicObjective[] = [];

            if (authUser.tenantId) {
                try {
                    const { data: userRecords } = await client.models.User.list({
                        filter: { tenantId: { eq: authUser.tenantId } }
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
                    const currentUserInDb = team.find(u => u.email === authUser.email);

                    if (!currentUserInDb) {
                        try {
                            const { data: newUser } = await client.models.User.create({
                                email: authUser.email,
                                name: authUser.name,
                                role: authUser.role,
                                tenantId: authUser.tenantId,
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
                    } else if (currentUserInDb.status === 'Invited') {
                        // User was invited and is now logging in for the first time.
                        // Update status to Active.
                        try {
                            await client.models.User.update({
                                id: currentUserInDb.id,
                                status: 'Active',
                                name: authUser.name || currentUserInDb.name // Update name if provided by Cognito
                            });

                            // Update local list
                            const userIndex = team.findIndex(u => u.id === currentUserInDb.id);
                            if (userIndex !== -1) {
                                team[userIndex] = { ...team[userIndex], status: 'Active', name: authUser.name || team[userIndex].name };
                            }
                        } catch (err) {
                            console.error("Failed to accept invitation for user:", err);
                        }
                    }

                    // Fetch Organization Details
                    if (client.models.Organization) {
                        try {
                            const { data: orgData } = await client.models.Organization.get({ id: authUser.tenantId });
                            if (orgData) {
                                activeOrg = {
                                    id: orgData.id,
                                    name: orgData.name,
                                    subscriptionTier: (orgData.subscriptionTier as any) || 'Free',
                                    domain: orgData.domain || undefined,
                                    createdAt: orgData.createdAt,
                                    updatedAt: orgData.updatedAt
                                };
                            } else {
                                // Auto-create Organization if missing (First Login)
                                const orgName = (authUser as any).orgName;
                                if (orgName) {
                                    console.log("Organization record missing. Auto-creating for:", orgName);
                                    const { data: newOrg } = await client.models.Organization.create({
                                        id: authUser.tenantId,
                                        name: orgName,
                                        subscriptionTier: 'Free'
                                    });

                                    if (newOrg) {
                                        activeOrg = {
                                            id: newOrg.id,
                                            name: newOrg.name,
                                            subscriptionTier: 'Free',
                                            createdAt: newOrg.createdAt,
                                            updatedAt: newOrg.updatedAt
                                        };
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("Failed to load or create organization:", err);
                        }
                    }

                    // Fetch Objectives with nested relations
                    const { data: fetchedObjs } = await client.models.StrategicObjective.list({
                        filter: { tenantId: { eq: authUser.tenantId } },
                        selectionSet: [
                            'id', 'name', 'ownerId', 'strategicValue', 'targetDate', 'status', 'currentHealth', 'riskScore', 'tenantId', 'createdAt', 'updatedAt',
                            'heartbeats.*',
                            'outcomes.id', 'outcomes.goal', 'outcomes.benefit', 'outcomes.ownerId', 'outcomes.startDate', 'outcomes.targetDate', 'outcomes.heartbeatCadence.*',
                            'outcomes.keyResults.id', 'outcomes.keyResults.description', 'outcomes.keyResults.ownerId', 'outcomes.keyResults.startDate', 'outcomes.keyResults.targetDate', 'outcomes.keyResults.heartbeatCadence.*',
                            'outcomes.keyResults.heartbeats.*',
                            'outcomes.keyResults.initiatives.id', 'outcomes.keyResults.initiatives.name', 'outcomes.keyResults.initiatives.ownerId', 'outcomes.keyResults.initiatives.link', 'outcomes.keyResults.initiatives.status', 'outcomes.keyResults.initiatives.startDate', 'outcomes.keyResults.initiatives.targetEndDate',
                            'outcomes.keyResults.initiatives.heartbeats.*'
                        ]
                    });
                    objList = fetchedObjs as unknown as StrategicObjective[];

                } catch (dataError) {
                    console.error("Data fetching partially failed", dataError);
                    // Do not unset currentUser here
                }
            }

            set({ currentUser: authUser, users: team, currentOrganization: activeOrg, objectives: objList, isLoading: false });

        } catch (e) {
            console.error("Session check major failure", e);
            // Even in major failure, if we have authUser, keep them logged in
            set({ currentUser: authUser, isLoading: false });
        }
    },

    login: async (email: string, password = 'password123') => {
        set({ isLoading: true, authError: null });
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
            set({ isLoading: false, authError: "Email and password are required." });
            return 'FAILED';
        }
        try {
            await AuthService.signInWithPassword(cleanEmail, password);
            await get().checkSession();
            return 'SUCCESS';
        } catch (e: any) {
            console.error("Login failed:", e);

            if (e.name === 'UserNotConfirmedException') {
                set({ isLoading: false, authError: "User is not confirmed." });
                return 'NOT_CONFIRMED';
            }

            if (e.name === 'UserAlreadyAuthenticatedException' || e.message?.includes('already a signed in user')) {
                // Force logout and retry login
                try {
                    await AuthService.signOut();
                    await AuthService.signInWithPassword(cleanEmail, password);
                    await get().checkSession();
                    return 'SUCCESS';
                } catch (retryError: any) {
                    console.error("Retry login failed:", retryError);
                    set({ isLoading: false, authError: retryError.message || "Login failed after retry" });
                    return 'FAILED';
                }
            }
            set({ isLoading: false, authError: e.message || "Login failed" });
            return 'FAILED';
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
                return 'CONFIRM';
            }

            return 'COMPLETE';
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
                set({ isLoading: false, authError: msg });
                return 'EXISTS';
            } else if (errorName === 'CodeDeliveryFailureException') {
                msg = "Failed to send verification email. Please check the email address.";
            }

            set({ isLoading: false, authError: msg });
            return 'FAILED';
        }
    },

    confirmSignUp: async (email: string, code: string) => {
        set({ isLoading: true, authError: null });
        try {
            await AuthService.confirmSignUp(email, code);
            set({ isLoading: false });
        } catch (e: any) {
            console.error("Confirm signup failed:", e);
            set({ isLoading: false, authError: e.message || "Invalid verification code." });
            throw e;
        }
    },

    resetPassword: async (email: string) => {
        set({ isLoading: true, authError: null });
        try {
            await AuthService.resetPassword(email);
            set({ isLoading: false });
        } catch (e: any) {
            console.error("Reset password failed:", e);
            set({ isLoading: false, authError: e.message || "Failed to send reset code." });
            throw e;
        }
    },

    confirmNewPassword: async (email: string, code: string, newPassword: string) => {
        set({ isLoading: true, authError: null });
        try {
            await AuthService.confirmResetPassword(email, code, newPassword);
            set({ isLoading: false });
        } catch (e: any) {
            console.error("Confirm new password failed:", e);
            set({ isLoading: false, authError: e.message || "Failed to reset password." });
            throw e;
        }
    },

    updateOrganization: async (updates) => {
        try {
            const currentOrg = get().currentOrganization;
            if (!currentOrg) return;

            // Optimistic Update
            set({
                currentOrganization: { ...currentOrg, ...updates },
                planName: updates.subscriptionTier === 'Pro' ? 'Pro' : get().planName
            });

            await client.models.Organization.update({
                id: currentOrg.id,
                ...updates
            });

        } catch (e) {
            console.error("Failed to update organization:", e);
            // Rollback could be implemented here, but for now we just log
        }
    },

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

            if (!client.models.StrategicObjective || !client.models.Outcome || !client.models.KeyResult || !client.models.Initiative) {
                throw new Error("Required Amplify models are missing. Please deploy the backend.");
            }

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
                    ownerId: out.ownerId,
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

    addInitiative: async (objectiveId: string, krId: string, initiative: Initiative) => {
        try {
            const { data: newInit } = await client.models.Initiative.create({
                keyResultId: krId,
                name: initiative.name,
                ownerId: initiative.ownerId,
                link: initiative.link,
                status: initiative.status,
                startDate: initiative.startDate,
                targetEndDate: initiative.targetEndDate,
                heartbeatCadence: initiative.heartbeatCadence
            });

            if (newInit) {
                const mappedInit: Initiative = {
                    ...initiative,
                    id: newInit.id,
                    heartbeats: []
                };

                set(state => ({
                    objectives: state.objectives.map(obj =>
                        obj.id === objectiveId ? {
                            ...obj,
                            outcomes: obj.outcomes.map(out => ({
                                ...out,
                                keyResults: out.keyResults.map(kr =>
                                    kr.id === krId ? {
                                        ...kr,
                                        initiatives: [...kr.initiatives, mappedInit]
                                    } : kr
                                )
                            }))
                        } : obj
                    )
                }));
            }
        } catch (e) {
            console.error("Failed to add initiative:", e);
        }
    },

    removeInitiative: async (objectiveId: string, krId: string, initiativeId: string) => {
        try {
            await client.models.Initiative.delete({ id: initiativeId });
            set(state => ({
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
            }));
        } catch (e) {
            console.error("Failed to remove initiative:", e);
        }
    },

    updateInitiative: async (objectiveId: string, krId: string, initiativeId: string, updates: Partial<Initiative>) => {
        try {
            await client.models.Initiative.update({
                id: initiativeId,
                name: updates.name,
                ownerId: updates.ownerId,
                link: updates.link,
                status: updates.status,
                startDate: updates.startDate,
                targetEndDate: updates.targetEndDate,
                // heartbeatCadence: updates.heartbeatCadence // Add if supported by schema update
            });

            set(state => ({
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
            }));
        } catch (e) {
            console.error("Failed to update initiative:", e);
        }
    },

    addKeyResult: async (objectiveId: string, outcomeId: string, keyResult: KeyResult) => {
        try {
            const { data: newKr } = await client.models.KeyResult.create({
                outcomeId: outcomeId,
                description: keyResult.description,
                ownerId: keyResult.ownerId,
                startDate: keyResult.startDate,
                targetDate: keyResult.targetDate,
                heartbeatCadence: keyResult.heartbeatCadence
            });

            if (newKr) {
                const mappedKr: KeyResult = {
                    ...keyResult,
                    id: newKr.id,
                    initiatives: [],
                    heartbeats: []
                };

                set(state => ({
                    objectives: state.objectives.map(obj =>
                        obj.id === objectiveId ? {
                            ...obj,
                            outcomes: obj.outcomes.map(out =>
                                out.id === outcomeId ? {
                                    ...out,
                                    keyResults: [...out.keyResults, mappedKr]
                                } : out
                            )
                        } : obj
                    )
                }));
            }
        } catch (e) {
            console.error("Failed to add key result:", e);
        }
    },

    updateKeyResult: async (objectiveId: string, outcomeId: string, krId: string, updates: Partial<KeyResult>) => {
        try {
            await client.models.KeyResult.update({
                id: krId,
                description: updates.description,
                ownerId: updates.ownerId,
                startDate: updates.startDate,
                targetDate: updates.targetDate,
                // heartbeatCadence: updates.heartbeatCadence
            });

            set(state => ({
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
            }));
        } catch (e) {
            console.error("Failed to update key result:", e);
        }
    },

    removeKeyResult: async (objectiveId: string, outcomeId: string, krId: string) => {
        try {
            await client.models.KeyResult.delete({ id: krId });
            set(state => ({
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
            }));
        } catch (e) {
            console.error("Failed to remove key result:", e);
        }
    }
}));
