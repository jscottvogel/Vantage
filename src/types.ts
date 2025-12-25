export type OutcomeStatus = 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
export type StrategicValue = 'High' | 'Medium' | 'Low';
export type UpdateHealth = 'Red' | 'Amber' | 'Green';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type SignalType = 'Sentiment' | 'Cadence' | 'Ambiguity' | 'Consistency';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Stable';

export type SubscriptionTier = 'Free' | 'Pro' | 'Enterprise';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    subscriptionTier: SubscriptionTier;
    ssoSettings?: {
        provider: string; // e.g., 'Okta', 'AzureAD'
        metadataUrl: string;
        enabled: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Member' | 'Owner' | 'BillingAdmin';
    tenantId: string;
    status: 'Active' | 'Invited' | 'Disabled';
}

export type InitiativeStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type Frequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';

export interface CadenceSchedule {
    frequency: Frequency;
    dueDay: string; // e.g., 'Friday'
    dueTime: string; // e.g., '17:00'
}

export type HeartbeatCadence = CadenceSchedule; // Keep alias for now to minimize refactor noise, or replace usages. Let's redirect.
export type MetricDirection = 'increase' | 'decrease' | 'maintain';

export interface ExpectedImpact {
    metric: string;
    direction: MetricDirection;
    estimatedDelta: number;
}

export interface SupportedKeyResult {
    krId: string;
    expectedImpact: ExpectedImpact;
}

export interface Initiative {
    id: string;
    name: string;
    ownerId: string;
    status: InitiativeStatus;
    startDate: string;
    targetEndDate: string;
    heartbeatCadence: HeartbeatCadence;
    supportedKeyResults?: SupportedKeyResult[];
    heartbeats: Heartbeat[];
    link?: string;
}

export type Trend = 'improving' | 'stable' | 'degrading';
export type HealthSignal = 'green' | 'yellow' | 'red';
export type EvidenceType = 'metric' | 'artifact';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface LeadingIndicator {
    name: string;
    value: number;
    previousValue: number;
    trend: Trend;
}

export interface Evidence {
    type: EvidenceType;
    description: string;
    sourceLink: string;
}

export interface Risk {
    description: string;
    severity: RiskSeverity;
    mitigation: string;
}

export interface OwnerAttestation {
    attestedBy: string;
    attestedOn: string;
}

export interface Heartbeat {
    id: string;

    // Associations (Optional)
    objectiveId?: string;
    keyResultId?: string;
    initiativeId?: string;

    // Core Data
    periodStart: string;
    periodEnd: string;
    healthSignal: HealthSignal;
    confidence?: ConfidenceLevel;
    narrative: string;

    confidenceToExpectedImpact?: number;

    // Supporting Data
    leadingIndicators?: LeadingIndicator[];
    evidence?: Evidence[];
    risks?: Risk[];

    ownerAttestation?: OwnerAttestation;

    // Metadata (Created via AppSync usually, but good to have in type)
    createdAt?: string;
    updatedAt?: string;
}

export interface KeyResult {
    id: string;
    description: string;
    ownerId: string; // References User.id
    startDate: string;
    targetDate: string;
    heartbeatCadence: HeartbeatCadence;
    initiatives: Initiative[];
    heartbeats: Heartbeat[];
}

export interface Outcome {
    id: string;
    goal: string;
    benefit: string;
    ownerId?: string;
    startDate: string;
    targetDate: string;
    heartbeatCadence: HeartbeatCadence;
    keyResults: KeyResult[];
}

export interface StrategicObjective {
    id: string;
    name: string;
    ownerId: string; // Accountable human
    sponsorId?: string; // Executive sponsor
    status: OutcomeStatus;
    strategicValue: StrategicValue;
    targetDate: string; // ISO Date

    // New Layer
    outcomes: Outcome[];

    // Unified Heartbeats
    heartbeats: Heartbeat[];

    // Computed/Derived
    currentHealth: UpdateHealth;
    riskScore: number; // 0-100
    lastUpdatedDate?: string;

    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

// Remove StatusUpdate, RiskSignal as they are now merged or unused


export interface AuditLogEntry {
    id: string;
    tenantId: string;
    actorId: string;
    action: string;
    resourceId: string;
    resourceType: 'StrategicObjective' | 'Update' | 'User';
    details: string; // JSON string of changes
    timestamp: string;
}
