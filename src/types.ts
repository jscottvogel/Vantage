export type OutcomeStatus = 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
export type StrategicValue = 'High' | 'Medium' | 'Low';
export type UpdateHealth = 'Red' | 'Amber' | 'Green';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type SignalType = 'Sentiment' | 'Cadence' | 'Ambiguity' | 'Consistency';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Stable';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Member';
    tenantId: string;
}

export interface Initiative {
    id: string;
    name: string;
    ownerId: string;
    link?: string;
}

export interface KeyResult {
    id: string;
    description: string;
    ownerId: string; // References User.id
    initiatives: Initiative[];
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
