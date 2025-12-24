import { create } from 'zustand';
import { generateClient } from 'aws-amplify/data';
import { AuthService } from './services/auth';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

// --- Types matching new Schema ---

export interface UserProfile {
    userSub: string;
    email: string;
    displayName: string;
    owner: string;
}

export interface Organization {
    id: string; // orgId
    name: string;
    slug: string;
    subscriptionTier: string;
    status: string;
}

export interface Membership {
    id: string;
    orgId: string;
    organization?: Organization; // Hydrated
    userSub: string;
    role: 'Owner' | 'Admin' | 'Member' | 'BillingAdmin';
    status: 'Active' | 'Invited' | 'Suspended';
}

export interface StrategicObjective {
    id: string;
    orgId: string;
    name: string;
    ownerId: string;
    strategicValue: string;
    targetDate: string;
    status: string;
    currentHealth: string;
    riskScore: number;
    outcomes: Outcome[];
    heartbeats: Heartbeat[];
}

export interface Outcome {
    id: string;
    orgId: string;
    objectiveId: string;
    goal: string;
    benefit: string;
    ownerId: string;
    startDate: string;
    targetDate: string;
    heartbeatCadence: CadenceSchedule;
    keyResults: KeyResult[];
}

export interface KeyResult {
    id: string;
    description: string;
    orgId: string;
    outcomeId: string;
    ownerId: string;
    startDate: string;
    targetDate: string;
    heartbeatCadence: CadenceSchedule;
    initiatives: Initiative[];
    heartbeats: Heartbeat[];
}

export interface Initiative {
    id: string;
    keyResultId: string;
    orgId: string;
    name: string;
    ownerId: string;
    link?: string;
    status: string;
    startDate: string;
    targetEndDate: string;
    heartbeatCadence: CadenceSchedule;
    heartbeats: Heartbeat[];
}

export interface Heartbeat {
    id: string;
    orgId: string;
    periodStart: string;
    periodEnd: string;
    healthSignal: 'green' | 'yellow' | 'red';
    confidence: 'High' | 'Medium' | 'Low';
    narrative: string;
    confidenceToExpectedImpact: number;
    leadingIndicators: LeadingIndicator[];
    evidence: Evidence[];
    risks: Risk[];
    ownerAttestation: OwnerAttestation;
}

// Support Types
export interface CadenceSchedule { frequency: string; dueDay: string; dueTime: string; }
export interface LeadingIndicator { name: string; value: number; previousValue?: number; trend?: string; }
export interface Evidence { type: string; description?: string; sourceLink?: string; }
export interface Risk { description: string; severity: string; mitigation?: string; }
export interface OwnerAttestation { attestedBy: string; attestedOn: string; }

interface AppState {
    // Session State
    userProfile: UserProfile | null;
    memberships: Membership[];
    currentOrg: Organization | null;

    // Data State (Scoped to currentOrg)
    objectives: StrategicObjective[];
    users: any[]; // Team Members (Legacy UI Compatibility)

    // UI State
    isLoading: boolean;
    authError: string | null;

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

    // Placeholders for compilation
    updateUserRole: (userId: string, role: any) => Promise<void>;
    removeUser: (userId: string) => Promise<void>;
    addHeartbeat: (targetId: string, targetType: any, heartbeat: any) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    userProfile: null,
    memberships: [],
    currentOrg: null,
    objectives: [],
    users: [],
    isLoading: true,
    authError: null,

    checkSession: async () => {
        set({ isLoading: true });
        try {
            const user = await AuthService.getCurrentUser();
            if (!user) {
                set({ userProfile: null, memberships: [], currentOrg: null, isLoading: false });
                return;
            }

            try {
                // 1. Fetch UserProfile
                const { data: profileList } = await client.models.UserProfile.list({
                    filter: { userSub: { eq: user.userId } }
                });
                const userProfile = profileList[0] || null;

                // 2. Fetch Memberships
                const { data: memberList } = await client.models.Membership.list({
                    filter: { userSub: { eq: user.userId } },
                    selectionSet: ['id', 'orgId', 'role', 'status', 'organization.*']
                });

                const memberships = memberList.map(m => ({
                    id: m.id,
                    orgId: m.orgId,
                    userSub: m.userSub,
                    role: m.role as any,
                    status: m.status as any,
                    organization: m.organization ? {
                        id: m.organization.id,
                        name: m.organization.name,
                        slug: m.organization.slug,
                        status: m.organization.status,
                        subscriptionTier: m.organization.subscriptionTier
                    } : undefined
                }));

                // 3. Resolve Active Org
                let activeOrg: Organization | null = null;
                const savedOrgId = localStorage.getItem('vantage_active_org');

                if (savedOrgId) {
                    const match = memberships.find(m => m.orgId === savedOrgId);
                    if (match && match.organization) activeOrg = match.organization;
                }

                if (!activeOrg && memberships.length > 0) {
                    const first = memberships.find(m => m.organization);
                    if (first && first.organization) activeOrg = first.organization;
                }

                set({
                    userProfile: userProfile ? {
                        userSub: userProfile.userSub,
                        email: userProfile.email,
                        displayName: userProfile.displayName || '',
                        owner: userProfile.owner || ''
                    } : null,
                    memberships,
                    currentOrg: activeOrg
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
        set({ userProfile: null, memberships: [], currentOrg: null, objectives: [], users: [] });
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
            set({ currentOrg: match.organization, isLoading: true });
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
            // Update filtering to use 'orgId' (Standardized)
            const { data: objs } = await client.models.StrategicObjective.list({
                filter: { orgId: { eq: org.id } },
                selectionSet: [
                    'id', 'orgId', 'name', 'ownerId', 'strategicValue', 'targetDate', 'status', 'currentHealth', 'riskScore',
                    'outcomes.id', 'outcomes.goal', 'outcomes.benefit', 'outcomes.ownerId', 'outcomes.startDate', 'outcomes.targetDate', 'outcomes.heartbeatCadence.*',
                    'outcomes.keyResults.id', 'outcomes.keyResults.description', 'outcomes.keyResults.ownerId', 'outcomes.keyResults.startDate', 'outcomes.keyResults.targetDate', 'outcomes.keyResults.heartbeatCadence.*',
                    'outcomes.keyResults.initiatives.id', 'outcomes.keyResults.initiatives.name', 'outcomes.keyResults.initiatives.ownerId', 'outcomes.keyResults.initiatives.link', 'outcomes.keyResults.initiatives.status', 'outcomes.keyResults.initiatives.startDate', 'outcomes.keyResults.initiatives.targetEndDate', 'outcomes.keyResults.initiatives.heartbeatCadence.*'
                ]
            });
            set({ objectives: objs as unknown as StrategicObjective[] });
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
        if (!org) return;

        try {
            const { data: newObj } = await client.models.StrategicObjective.create({
                orgId: org.id,
                name,
                ownerId,
                strategicValue,
                targetDate,
                status: 'Active',
                currentHealth: 'Green',
                riskScore: 0
            });

            if (newObj) {
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
                    // Deep nesting skipped for MVP
                }
            }
            await get().fetchObjectives();
        } catch (e) {
            console.error("Create failed", e);
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

    updateUserRole: async (userId, role) => {
        // Placeholder or implement via manageOrg or direct Membership update
    },
    removeUser: async (userId) => {
        // Placeholder
    },
    addHeartbeat: async (targetId, targetType, heartbeat) => {
        // Placeholder
    }
}));
