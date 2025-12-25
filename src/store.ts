import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import { AuthService } from './services/auth';
import type { Schema } from '../amplify/data/resource';
// Import Domain Types STRICTLY
import type {
    StrategicObjective,
    Heartbeat,
    Organization as DomainOrganization, // Renamed to avoid collision if needed, but we used Organization in store. Will align.
    User
} from './types';

const client = generateClient<Schema>();

// --- State Types ---
// We use the Domain Types for state to satisfy components

export interface UserProfile {
    userSub: string;
    email: string;
    displayName: string;
    owner: string;
}

export interface Membership {
    id: string;
    orgId: string;
    organization?: DomainOrganization;
    userSub: string;
    role: 'Owner' | 'Admin' | 'Member' | 'BillingAdmin';
    status: 'Active' | 'Invited' | 'Suspended';
}

interface AppState {
    // Session State
    userProfile: UserProfile | null;
    memberships: Membership[];
    currentOrg: DomainOrganization | null;

    // Data State (Domain Types)
    objectives: StrategicObjective[];
    users: any[]; // Team Members

    // UI State
    isLoading: boolean;
    authError: string | null;
    planName: string; // Compat
    maxActiveObjectives: number; // Added

    // Computed Properties (Legacy Compat)
    currentUser: User | null;
    currentOrganization: DomainOrganization | null;

    // Actions
    checkSession: () => Promise<void>;
    login: (email: string, password?: string) => Promise<'SUCCESS' | 'NOT_CONFIRMED' | 'FAILED' | 'EXISTS'>;
    logout: () => Promise<void>;
    signupOrganization: (orgName: string, adminEmail: string, adminName: string, password?: string) => Promise<string>;
    confirmSignUp: (email: string, code: string) => Promise<void>;

    switchOrganization: (orgId: string) => Promise<void>;

    // Data Actions
    fetchObjectives: () => Promise<void>;
    fetchTeam: () => Promise<void>;

    createObjective: (name: string, ownerId: string, strategicValue: string, targetDate: string, outcomes: any[]) => Promise<void>;
    inviteUser: (email: string, role: string) => Promise<void>;

    // Methods
    updateOrganization: (updates: Partial<DomainOrganization>) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    confirmNewPassword: (email: string, code: string, newPassword: string) => Promise<void>;

    updateUserRole: (userId: string, role: any) => Promise<void>;
    removeUser: (userId: string) => Promise<void>;

    addKeyResult: (objectiveId: string, outcomeId: string, keyResult: any) => Promise<void>;
    updateKeyResult: (objectiveId: string, outcomeId: string, krId: string, updates: any) => Promise<void>;
    removeKeyResult: (objectiveId: string, outcomeId: string, krId: string) => Promise<void>;

    addInitiative: (objectiveId: string, krId: string, initiative: any) => Promise<void>;
    removeInitiative: (objectiveId: string, krId: string, initiativeId: string) => Promise<void>;
    updateInitiative: (objectiveId: string, krId: string, initiativeId: string, updates: any) => Promise<void>;

    addHeartbeat: (targetId: string, targetType: 'objective' | 'keyResult' | 'initiative', heartbeat: Partial<Heartbeat>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    userProfile: null,
    memberships: [],
    currentOrg: null,
    objectives: [],
    users: [],
    isLoading: true,
    authError: null,
    planName: 'Free',
    maxActiveObjectives: 5,
    currentUser: null,
    currentOrganization: null,

    checkSession: async () => {
        set({ isLoading: true });
        try {
            const user = await AuthService.getCurrentUser();
            if (!user || !user.id) {
                set({ userProfile: null, memberships: [], currentOrg: null, currentUser: null, currentOrganization: null, isLoading: false });
                return;
            }

            try {
                // 1. Fetch UserProfile
                const { data: profileList } = await client.models.UserProfile.list({
                    filter: { userSub: { eq: user.id } }
                });
                const userProfile = profileList[0] || null;

                // 2. Fetch Memberships
                const { data: memberList } = await client.models.Membership.list({
                    filter: { userSub: { eq: user.id } },
                    selectionSet: ['id', 'userSub', 'orgId', 'role', 'status', 'organization.*']
                });

                if (memberList.length === 0) {
                    console.log("No memberships found. Auto-creating 'My Org'...");
                    try {
                        const slug = `my-org-${user.id.substring(0, 8)}`;
                        const { data: newOrg } = await client.models.Organization.create({
                            name: "My Org",
                            slug,
                            subscriptionTier: "Free",
                            status: "Active",
                            createdBySub: user.id
                        });

                        if (newOrg) {
                            await client.models.Membership.create({
                                orgId: newOrg.id,
                                userSub: user.id,
                                role: "Owner",
                                status: "Active"
                            });
                            console.log("Default org created. Reloading session...");
                            await get().checkSession();
                            return;
                        }
                    } catch (createErr) {
                        console.error("Failed to auto-create organization", createErr);
                    }
                }

                const memberships: Membership[] = memberList.map(m => ({
                    id: m.id,
                    orgId: m.orgId,
                    userSub: m.userSub,
                    role: m.role as any,
                    status: m.status as any,
                    organization: m.organization ? {
                        // m.organization (Schema) includes id, name, slug.
                        // We spread it first, then overwrite/add what we need for Domain compatibility.
                        ...m.organization,
                        slug: m.organization.slug,
                        subscriptionTier: (m.organization.subscriptionTier as any) || 'Free',
                        createdAt: m.organization.createdAt || new Date().toISOString(),
                        updatedAt: m.organization.updatedAt || new Date().toISOString()
                    } as any : undefined
                }));

                // 3. Resolve Active Org
                let activeOrg: any = null; // Typing loosely to accommodate slug
                const savedOrgId = localStorage.getItem('vantage_active_org');

                if (savedOrgId) {
                    const match = memberships.find(m => m.orgId === savedOrgId);
                    if (match && match.organization) activeOrg = match.organization;
                }

                if (!activeOrg && memberships.length > 0) {
                    const first = memberships.find(m => m.organization);
                    if (first && first.organization) activeOrg = first.organization;
                }

                // Construct Legacy User
                const legacyUser: User | null = userProfile ? {
                    id: userProfile.userSub,
                    email: userProfile.email,
                    name: userProfile.displayName || '',
                    role: 'Member',
                    tenantId: activeOrg?.id || '',
                    status: 'Active'
                } : null;

                set({
                    userProfile: userProfile ? {
                        userSub: userProfile.userSub,
                        email: userProfile.email,
                        displayName: userProfile.displayName || '',
                        owner: userProfile.owner || ''
                    } : null,
                    memberships,
                    currentOrg: activeOrg,
                    currentUser: legacyUser,
                    currentOrganization: activeOrg
                });

                if (activeOrg) {
                    await get().fetchObjectives();
                    await get().fetchTeam();
                }

            } catch (err) {
                console.error("Failed to load user data", err);
            }

        } catch (error) {
            console.error("Session check failed", error);
        } finally {
            set({ isLoading: false });
        }
    },

    login: async (email, password = 'password123') => {
        set({ isLoading: true, authError: null });
        try {
            await AuthService.signInWithPassword(email, password);
            await get().checkSession();
            return 'SUCCESS';
        } catch (error: any) {
            set({ isLoading: false, authError: error.message });
            return 'FAILED';
        }
    },

    logout: async () => {
        await AuthService.signOut();
        set({ userProfile: null, memberships: [], currentOrg: null, objectives: [], users: [], currentUser: null, currentOrganization: null });
        localStorage.removeItem('vantage_active_org');
    },

    signupOrganization: async (orgName, adminEmail, adminName, password = 'password123') => {
        try {
            set({ isLoading: true });
            const { nextStep } = await AuthService.signUp(adminEmail, password, adminName, orgName);
            if (nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
                set({ isLoading: false });
                return 'CONFIRM';
            }
            return 'COMPLETE';
        } catch (e: any) {
            set({ isLoading: false, authError: e.message });
            return 'FAILED';
        }
    },

    confirmSignUp: async (email, code) => {
        try {
            await AuthService.confirmSignUp(email, code);
        } catch (e: any) {
            throw e;
        }
    },

    switchOrganization: async (orgId: string) => {
        const memberships = get().memberships;
        const match = memberships.find(m => m.orgId === orgId);
        if (match && match.organization) {
            set({ currentOrg: match.organization, currentOrganization: match.organization, isLoading: true });
            localStorage.setItem('vantage_active_org', orgId);
            await get().fetchObjectives();
            await get().fetchTeam();
            set({ isLoading: false });
        }
    },

    fetchObjectives: async () => {
        const org = get().currentOrg;
        if (!org) return;

        try {
            const { data: objs } = await client.models.StrategicObjective.list({
                filter: { orgId: { eq: org.id } },
                selectionSet: [
                    'id', 'orgId', 'name', 'ownerId', 'strategicValue', 'targetDate', 'status', 'currentHealth', 'riskScore',
                    'outcomes.id', 'outcomes.goal', 'outcomes.benefit', 'outcomes.ownerId', 'outcomes.startDate', 'outcomes.targetDate', 'outcomes.heartbeatCadence.*',
                    'outcomes.keyResults.id', 'outcomes.keyResults.description', 'outcomes.keyResults.ownerId', 'outcomes.keyResults.startDate', 'outcomes.keyResults.targetDate', 'outcomes.keyResults.heartbeatCadence.*',
                    'outcomes.keyResults.initiatives.id', 'outcomes.keyResults.initiatives.name', 'outcomes.keyResults.initiatives.ownerId', 'outcomes.keyResults.initiatives.link', 'outcomes.keyResults.initiatives.status', 'outcomes.keyResults.initiatives.startDate', 'outcomes.keyResults.initiatives.targetEndDate', 'outcomes.keyResults.initiatives.heartbeatCadence.*'
                ]
            });

            // Map Schema to Domain Types
            const mappedObjs: StrategicObjective[] = objs.map((o: any) => ({
                ...o,
                tenantId: o.orgId,
                featureLink: o.featureLink,
                strategicValue: o.strategicValue as any,
                status: o.status as any,
                currentHealth: o.currentHealth as any,
                heartbeats: [], // Schema load for heartbeats not deep in this selectionSet? Added placeholder
                createdAt: new Date().toISOString(), // Fallback
                updatedAt: new Date().toISOString(), // Fallback
                outcomes: o.outcomes.map((out: any) => ({
                    ...out,
                    keyResults: out.keyResults.map((kr: any) => ({
                        ...kr,
                        initiatives: kr.initiatives.map((init: any) => ({
                            ...init,
                            status: init.status as any, // Cast status
                            heartbeatCadence: init.heartbeatCadence ? {
                                frequency: init.heartbeatCadence.frequency as any,
                                dueDay: init.heartbeatCadence.dueDay,
                                dueTime: init.heartbeatCadence.dueTime
                            } : undefined
                        }))
                    }))
                }))
            }));

            set({ objectives: mappedObjs });
        } catch (e) {
            console.error("Fetch objectives failed", e);
        }
    },

    fetchTeam: async () => {
        const org = get().currentOrg;
        if (!org) return;

        try {
            const { data: members } = await client.models.Membership.list({
                filter: { orgId: { eq: org.id } },
                selectionSet: ['id', 'userSub', 'role', 'status', 'user.email', 'user.displayName']
            });

            const team = members.map(m => ({
                id: m.userSub,
                email: m.user?.email || 'Unknown',
                name: m.user?.displayName || 'Unknown',
                role: m.role,
                status: m.status,
                tenantId: org.id
            }));

            set({ users: team });
        } catch (e) {
            console.error("Fetch Team Failed", e);
        }
    },

    createObjective: async (name, ownerId, strategicValue, targetDate, outcomes) => {
        const org = get().currentOrg;
        console.log("createObjective called", { name, orgId: org?.id, outcomesCount: outcomes.length });

        if (!org) {
            console.error("No active organization found in store. Cannot create objective.");
            return;
        }

        try {
            console.log("Creating StrategicObjective in DB...");
            const { data: newObj, errors } = await client.models.StrategicObjective.create({
                orgId: org.id,
                name,
                ownerId,
                strategicValue,
                targetDate,
                status: 'Draft',
                currentHealth: 'Green',
                riskScore: 0
            });

            if (errors) {
                console.error("Error creating objective:", errors);
                return;
            }

            console.log("Objective Created:", newObj);

            if (newObj) {
                console.log("Creating Outcomes...");
                for (const out of outcomes) {
                    await client.models.Outcome.create({
                        orgId: org.id,
                        objectiveId: newObj.id,
                        goal: out.goal,
                        benefit: out.benefit,
                        ownerId: out.ownerId,
                        startDate: out.startDate,
                        targetDate: out.targetDate,
                        heartbeatCadence: out.heartbeatCadence
                    });
                }
            }
            console.log("Refreshing Objectives...");
            await get().fetchObjectives();
        } catch (e) {
            console.error("Create failed exception", e);
        }
    },

    inviteUser: async (email, role) => {
        const org = get().currentOrg;
        if (!org) return;

        try {
            await client.mutations.manageOrg({
                action: 'inviteUser',
                orgId: org.id,
                email,
                role
            });
        } catch (e) {
            console.error("Invite failed", e);
        }
    },

    // --- Restored Methods ---

    updateOrganization: async (updates) => {
        const org = get().currentOrg;
        if (!org) return;
        try {
            // @ts-ignore - updates might be Domain type, schema expects different
            await client.models.Organization.update({ id: org.id, ...updates });
            // @ts-ignore
            set({ currentOrg: { ...org, ...updates }, currentOrganization: { ...org, ...updates } });
        } catch (e) { console.error(e); }
    },

    resetPassword: async (email) => { await AuthService.resetPassword(email); },
    confirmNewPassword: async (email, code, newPassword) => { await AuthService.confirmResetPassword(email, code, newPassword); },

    // Data Mutations using Gen 2 Client
    addKeyResult: async (_objectiveId, outcomeId, keyResult) => {
        const org = get().currentOrg;
        if (!org) return;
        try {
            await client.models.KeyResult.create({
                orgId: org.id,
                outcomeId,
                description: keyResult.description,
                ownerId: keyResult.ownerId,
                startDate: keyResult.startDate,
                targetDate: keyResult.targetDate,
                heartbeatCadence: keyResult.heartbeatCadence
            });
            await get().fetchObjectives();
        } catch (e) { console.error("addKR failed", e); }
    },

    updateKeyResult: async (_objectiveId, _outcomeId, krId, updates) => {
        try {
            const { initiatives, heartbeats, ...validUpdates } = updates;
            await client.models.KeyResult.update({ id: krId, ...validUpdates });
            await get().fetchObjectives();
        } catch (e) { console.error("updateKR failed", e); }
    },

    removeKeyResult: async (_objectiveId, _outcomeId, krId) => {
        try {
            await client.models.KeyResult.delete({ id: krId });
            await get().fetchObjectives();
        } catch (e) { console.error("delKR failed", e); }
    },

    addInitiative: async (_objectiveId, krId, initiative) => {
        const org = get().currentOrg;
        if (!org) return;
        try {
            await client.models.Initiative.create({
                orgId: org.id,
                keyResultId: krId,
                name: initiative.name,
                ownerId: initiative.ownerId,
                link: initiative.link,
                status: initiative.status,
                startDate: initiative.startDate,
                targetEndDate: initiative.targetEndDate,
                heartbeatCadence: initiative.heartbeatCadence
            });
            await get().fetchObjectives();
        } catch (e) { console.error("addInit failed", e); }
    },

    removeInitiative: async (_objectiveId, _krId, initiativeId) => {
        try {
            await client.models.Initiative.delete({ id: initiativeId });
            await get().fetchObjectives();
        } catch (e) { console.error("delInit failed", e); }
    },

    updateInitiative: async (_objectiveId, _krId, initiativeId, updates) => {
        try {
            const { heartbeats, ...validUpdates } = updates;
            await client.models.Initiative.update({ id: initiativeId, ...validUpdates });
            await get().fetchObjectives();
        } catch (e) { console.error("updateInit failed", e); }
    },

    // Missing Stubs
    updateUserRole: async (_userId, _role) => { console.log('updateUserRole placeholder'); },
    removeUser: async (_userId) => { console.log('removeUser placeholder'); },
    addHeartbeat: async (_targetId, _targetType, _heartbeat) => {
        // Logic to add heartbeat
        console.log('addHeartbeat placeholder');
    },

}));
