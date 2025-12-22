import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendNotification } from '../functions/send-notification/resource';

const schema = a.schema({
    NotificationResponse: a.customType({
        success: a.boolean().required(),
        message: a.string(),
    }),
    User: a.model({
        email: a.string().required(),
        name: a.string(),
        role: a.string(),
        tenantId: a.string(),
        tenantId: a.string(),
        status: a.string(),
    })
        .authorization(allow => [allow.owner(), allow.authenticated()]),

    Organization: a.model({
        name: a.string().required(),
        subscriptionTier: a.string(),
        domain: a.string(),
        // We will use the 'id' of this model as the tenantId
    })
        .authorization(allow => [allow.authenticated()]), // Any auth user can read (we filter by ID in app)

    // Custom Type for Schedules
    CadenceSchedule: a.customType({
        frequency: a.string().required(), // daily, weekly, etc
        dueDay: a.string().required(),   // Monday, Friday
        dueTime: a.string().required(),  // 17:00
    }),

    // Top Level Objective
    StrategicObjective: a.model({
        name: a.string().required(),
        ownerId: a.string().required(),
        strategicValue: a.string().required(), // High, Medium, Low
        targetDate: a.string().required(),
        status: a.string().required(), // Active, Draft, etc.
        currentHealth: a.string(),     // Green, Amber, Red
        riskScore: a.integer(),

        tenantId: a.string(), // For multi-tenancy filtering

        outcomes: a.hasMany('Outcome', 'objectiveId'),
        heartbeats: a.hasMany('Heartbeat', 'objectiveId'),
    })
        .authorization(allow => [allow.owner(), allow.authenticated()]),

    Outcome: a.model({
        objectiveId: a.id().required(),
        objective: a.belongsTo('StrategicObjective', 'objectiveId'),

        goal: a.string().required(),
        benefit: a.string().required(),
        startDate: a.string(),
        targetDate: a.string(),

        heartbeatCadence: a.ref('CadenceSchedule'),

        keyResults: a.hasMany('KeyResult', 'outcomeId'),
    })
        .authorization(allow => [allow.owner(), allow.authenticated()]),

    KeyResult: a.model({
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
        .authorization(allow => [allow.owner(), allow.authenticated()]),

    Initiative: a.model({
        keyResultId: a.id().required(),
        keyResult: a.belongsTo('KeyResult', 'keyResultId'),

        name: a.string().required(),
        ownerId: a.string(),
        link: a.string(),
        status: a.string(), // active, completed

        startDate: a.string(),
        targetEndDate: a.string(),

        heartbeatCadence: a.ref('CadenceSchedule'),

        heartbeats: a.hasMany('Heartbeat', 'initiativeId'),
    })
        .authorization(allow => [allow.owner(), allow.authenticated()]),

    // Heartbeat Support Types
    LeadingIndicator: a.customType({
        name: a.string().required(),
        value: a.float().required(),
        previousValue: a.float(),
        trend: a.string(), // improving, stable, degrading
    }),

    Evidence: a.customType({
        type: a.string().required(), // metric, artifact
        description: a.string(),
        sourceLink: a.string(),
    }),

    Risk: a.customType({
        description: a.string().required(),
        severity: a.string().required(), // low, medium, high
        mitigation: a.string(),
    }),

    OwnerAttestation: a.customType({
        attestedBy: a.string().required(),
        attestedOn: a.string().required(),
    }),

    // Heartbeats
    Heartbeat: a.model({
        // Polymorphic-ish relationships (Optional FKs)
        objectiveId: a.id(),
        objective: a.belongsTo('StrategicObjective', 'objectiveId'),

        keyResultId: a.id(),
        keyResult: a.belongsTo('KeyResult', 'keyResultId'),

        initiativeId: a.id(),
        initiative: a.belongsTo('Initiative', 'initiativeId'),

        // Core Data
        periodStart: a.string().required(),
        periodEnd: a.string().required(),

        healthSignal: a.string().required(), // green, yellow, red
        confidence: a.string(), // High, Medium, Low (Added for alignment)

        narrative: a.string().required(), // Summary / Update text

        confidenceToExpectedImpact: a.integer(), // Optional score

        // Supporting Data
        leadingIndicators: a.ref('LeadingIndicator').array(),
        evidence: a.ref('Evidence').array(),
        risks: a.ref('Risk').array(),

        ownerAttestation: a.ref('OwnerAttestation'),
    })
        .authorization(allow => [allow.owner(), allow.authenticated()]),

    sendHeartbeatNotification: a
        .mutation()
        .arguments({
            recipientEmail: a.string().required(),
            link: a.string().required(),
            subject: a.string().required(),
            messageBody: a.string().required()
        })
        .returns(a.ref('NotificationResponse'))
        .authorization(allow => [allow.authenticated()])
        .handler(a.handler.function(sendNotification)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
    },
});
