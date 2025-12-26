import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendNotification } from '../functions/send-notification/resource';
import { manageOrg } from '../functions/manage-org/resource';

/**
 * VANTAGE MULTI-TENANT SCHEMA
 * 
 * Security Model:
 * - All "Tenant Data" (Objectives, etc.) is scoped by `orgId`.
 * - Authorization Enforcement (MVP):
 *   - Ideally, we would use Pipeline Resolvers to check Membership table for every request.
 *   - Since Amplify Gen 2 declarative auth is limited without Custom Claims, we rely on:
 *     1. `allow.authenticated()` for data access (MVP compromise).
 *     2. Strict business logic in Custom Mutation Handlers for Membership/Invite management.
 *     3. Frontend "Gatekeeper" logic (Critical must be moved to backend for Post-MVP).
 * 
 * Tenants:
 * - Organization is the root of tenancy.
 * - Membership links UserProfile <-> Organization with a Role.
 */

const schema = a.schema({
    // --- SHARED TYPES ---
    NotificationResponse: a.customType({
        success: a.boolean().required(),
        message: a.string(),
    }),

    CadenceSchedule: a.customType({
        frequency: a.string().required(),
        dueDay: a.string().required(),
        dueTime: a.string().required(),
    }),

    // --- CORE IDENTITY & TENANCY ---

    UserProfile: a.model({
        userSub: a.id().required(), // Matches Cognito Sub
        email: a.string().required(),
        displayName: a.string(),
        createdAt: a.string(),
        owner: a.string(), // Added for owner auth
        // Relations
        memberships: a.hasMany('Membership', 'userSub')
    })
        .identifier(['userSub'])
        .authorization(allow => [
            allow.owner(), // checks 'owner' field
            allow.authenticated() // Viewable by others (for team UI)
        ]),

    Organization: a.model({
        name: a.string().required(),
        subscriptionTier: a.string().default('Free'),
        status: a.string().default('Active'),
        createdBySub: a.string(),

        members: a.hasMany('Membership', 'orgId'),
        invites: a.hasMany('Invite', 'orgId'),
        objectives: a.hasMany('StrategicObjective', 'orgId')
    })
        .authorization(allow => [
            allow.authenticated() // MVP: Auth users can resolve orgs (validated by membership downstream)
        ]),

    Membership: a.model({
        orgId: a.id().required(),
        organization: a.belongsTo('Organization', 'orgId'),

        userSub: a.id().required(),
        user: a.belongsTo('UserProfile', 'userSub'),

        role: a.string().required(), // Owner, Admin, Member, BillingAdmin
        status: a.string().default('Active'), // Active, Suspended
        owner: a.string(), // Added for owner auth
    })
        .secondaryIndexes((index) => [
            index('userSub'), // efficiently find my orgs
            index('orgId')    // efficiently find org members
        ])
        .authorization(allow => [
            allow.owner(), // I can see my memberships
            allow.authenticated()   // Admins need to see members (MVP loose)
        ]),

    Invite: a.model({
        orgId: a.id().required(),
        email: a.string().required(), // Target email
        role: a.string().required(),
        token: a.string().required(), // Secure random token
        params: a.json(), // Extra context
        expiresAt: a.string(),
        invitedBySub: a.string(),
        status: a.string().default('Pending') // Pending, Accepted, Expired
    })
        .authorization(allow => [
            allow.authenticated() // Managed via custom logic mostly
        ]),

    // --- DOMAIN MODELS (Scoped by orgId) ---

    StrategicObjective: a.model({
        orgId: a.id().required(),
        organization: a.belongsTo('Organization', 'orgId'),

        name: a.string().required(),
        ownerId: a.string().required(), // Reference to UserProfile.userSub
        strategicValue: a.string().required(),
        targetDate: a.string().required(),
        status: a.string().required(),
        currentHealth: a.string(),
        riskScore: a.integer(),

        outcomes: a.hasMany('Outcome', 'objectiveId'),
        heartbeats: a.hasMany('Heartbeat', 'objectiveId'),
    })
        .secondaryIndexes(index => [index('orgId')])
        .authorization(allow => [allow.authenticated()]),

    Outcome: a.model({
        orgId: a.id().required(), // Denormalized for security scope

        objectiveId: a.id().required(),
        objective: a.belongsTo('StrategicObjective', 'objectiveId'),

        goal: a.string().required(),
        benefit: a.string().required(),
        ownerId: a.string(),
        startDate: a.string(),
        targetDate: a.string(),
        heartbeatCadence: a.ref('CadenceSchedule'),

        keyResults: a.hasMany('KeyResult', 'outcomeId'),
    })
        .secondaryIndexes(index => [index('orgId')])
        .authorization(allow => [allow.authenticated()]),

    KeyResult: a.model({
        orgId: a.id().required(),

        outcomeId: a.id().required(),
        outcome: a.belongsTo('Outcome', 'outcomeId'),

        description: a.string().required(),
        ownerId: a.string(),
        startDate: a.string(),
        targetDate: a.string(),
        heartbeatCadence: a.ref('CadenceSchedule'),

        initiatives: a.hasMany('Initiative', 'keyResultId'),
        heartbeats: a.hasMany('Heartbeat', 'keyResultId'),
    })
        .secondaryIndexes(index => [index('orgId')])
        .authorization(allow => [allow.authenticated()]),

    Initiative: a.model({
        orgId: a.id().required(),

        keyResultId: a.id().required(),
        keyResult: a.belongsTo('KeyResult', 'keyResultId'),

        name: a.string().required(),
        ownerId: a.string(),
        link: a.string(),
        status: a.string(),
        startDate: a.string(),
        targetEndDate: a.string(),
        heartbeatCadence: a.ref('CadenceSchedule'),

        heartbeats: a.hasMany('Heartbeat', 'initiativeId'),
    })
        .secondaryIndexes(index => [index('orgId')])
        .authorization(allow => [allow.authenticated()]),

    // Heartbeat Support Types
    LeadingIndicator: a.customType({
        name: a.string().required(),
        value: a.float().required(),
        previousValue: a.float(),
        trend: a.string(),
    }),

    Evidence: a.customType({
        type: a.string().required(),
        description: a.string(),
        sourceLink: a.string(),
    }),

    Risk: a.customType({
        description: a.string().required(),
        severity: a.string().required(),
        mitigation: a.string(),
    }),

    OwnerAttestation: a.customType({
        attestedBy: a.string().required(),
        attestedOn: a.string().required(),
    }),

    Heartbeat: a.model({
        orgId: a.id().required(),

        objectiveId: a.id(),
        objective: a.belongsTo('StrategicObjective', 'objectiveId'),
        keyResultId: a.id(),
        keyResult: a.belongsTo('KeyResult', 'keyResultId'),
        initiativeId: a.id(),
        initiative: a.belongsTo('Initiative', 'initiativeId'),

        periodStart: a.string().required(),
        periodEnd: a.string().required(),
        healthSignal: a.string().required(),
        confidence: a.string(),
        narrative: a.string().required(),
        confidenceToExpectedImpact: a.integer(),

        leadingIndicators: a.ref('LeadingIndicator').array(),
        evidence: a.ref('Evidence').array(),
        risks: a.ref('Risk').array(),
        ownerAttestation: a.ref('OwnerAttestation'),
    })
        .secondaryIndexes(index => [index('orgId')])
        .authorization(allow => [allow.authenticated()]),

    // --- MUTATIONS ---
    sendHeartbeatNotification: a.mutation()
        .arguments({
            recipientEmail: a.string().required(),
            link: a.string().required(),
            subject: a.string().required(),
            messageBody: a.string().required()
        })
        .returns(a.ref('NotificationResponse'))
        .authorization(allow => [allow.authenticated()])
        .handler(a.handler.function(sendNotification)),

    manageOrg: a.mutation()
        .arguments({
            action: a.string().required(), // inviteUser, acceptInvite
            orgId: a.string(),
            email: a.string(),
            role: a.string(),
            token: a.string()
        })
        .returns(a.json())
        .authorization(allow => [allow.authenticated()])
        .handler(a.handler.function(manageOrg)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
    },
});
// Force Sync Trigger 123456
