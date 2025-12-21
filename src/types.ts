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
    role: 'Admin' | 'Member';
    tenantId: string;
    status: 'Active' | 'Invited' | 'Disabled';
}

export type InitiativeStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type HeartbeatCadence = 'weekly' | 'bi-weekly' | 'monthly';
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
    supportedKeyResults: SupportedKeyResult[];
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
    initiativeId: string;
    periodStart: string;
    periodEnd: string;
    healthSignal: HealthSignal;
    leadingIndicators: LeadingIndicator[];
    evidence: Evidence[];
    risks: Risk[];
    confidenceToExpectedImpact: number;
    ownerAttestation: OwnerAttestation;
}

export type Confidence = 'High' | 'Medium' | 'Low';
export type ConfidenceTrend = 'Improving' | 'Stable' | 'Declining';

export interface HeartbeatLink {
    initiativeId: string;
    influenceLevel: 'Primary' | 'Supporting';
}

export interface KeyResultHeartbeat {
    id: string;
    keyResultId: string;
    keyResultStatement: string; // Snapshot of description
    timestamp: string;

    overallConfidence: Confidence;
    confidenceTrend: ConfidenceTrend;

    primaryInitiatives: HeartbeatLink[];
    confidenceDrivers: string[];
    riskDrivers: string[];

    knownUnknowns: string[];
    informationGaps: string[];
    confidenceLimitations: string;

    heartbeatSummary: string;
    sourceInitiativeHeartbeatIds: string[];
}

export interface KeyResult {
    id: string;
    description: string;
    ownerId: string; // References User.id
    initiatives: Initiative[];
    heartbeats: KeyResultHeartbeat[];
}

export interface Outcome {
    id: string;
    goal: string;
    benefit: string;
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

    // Computed/Derived
    currentHealth: UpdateHealth;
    riskScore: number; // 0-100
    lastUpdatedDate?: string;

    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface StatusUpdate {
    id: string;
    objectiveId: string;
    authorId: string;
    timestamp: string;

    health: UpdateHealth;
    confidence: ConfidenceLevel;
    narrative: string; // The human written text
    blockers?: string;

    // AI Analysis
    aiCredibilityScore?: number; // 0-100
    aiRiskFlags?: RiskSignal[];
}

export interface RiskSignal {
    id: string;
    type: SignalType;
    severity: RiskLevel;
    description: string;
    detectedAt: string;
    sourceUpdateId?: string;
}

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
