import type { Initiative, StatusUpdate, RiskSignal, AuditLogEntry } from '../types';

// Agent Interfaces
export interface CollectorAgent {
    generatePrompt(initiative: Initiative, lastUpdate?: StatusUpdate): string;
    parseResponse(responseText: string): Partial<StatusUpdate>;
}

export interface SynthesizerAgent {
    analyzeUpdate(update: StatusUpdate, history: StatusUpdate[], initiative: Initiative): {
        riskFlags: RiskSignal[];
        credibilityScore: number;
        summary: string;
    };
}

export interface AuditAgent {
    logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void;
}

// Mock Implementations

export const MockCollector: CollectorAgent = {
    generatePrompt: (initiative, lastUpdate) => {
        if (!lastUpdate) {
            return `Hi ${initiative.ownerId}, please provide the first status update for ${initiative.name}. What is the current outlook?`;
        }
        return `Hi ${initiative.ownerId}, last week you reported ${lastUpdate.health}. What has changed? Is the target date of ${initiative.targetDate} still realistic?`;
    },
    parseResponse: (text) => {
        // Simple mock heuristic
        const health = text.toLowerCase().includes('delayed') || text.toLowerCase().includes('risk') ? 'Red' : 'Green';
        return {
            narrative: text,
            health: health,
            confidence: 'Medium'
        };
    }
};

export const MockSynthesizer: SynthesizerAgent = {
    analyzeUpdate: (update, _history, _initiative) => {
        const risks: RiskSignal[] = [];

        // Check for Drift
        if (update.health === 'Green' && update.narrative.length < 20) {
            risks.push({
                id: crypto.randomUUID(),
                type: 'Ambiguity',
                severity: 'Medium',
                description: 'Update is too brief for a Green status.',
                detectedAt: new Date().toISOString()
            });
        }

        // Check for "Green but blocked" consistency
        if (update.health === 'Green' && update.narrative.toLowerCase().includes('blocker')) {
            risks.push({
                id: crypto.randomUUID(),
                type: 'Consistency',
                severity: 'High',
                description: 'Narrative mentions blockers but health is Green.',
                detectedAt: new Date().toISOString()
            });
        }

        // Check for "Red but confident" (just an example pattern)
        if (update.health === 'Red' && update.confidence === 'High') {
            // No risk flag, just noting logic was here.
        }

        return {
            riskFlags: risks,
            credibilityScore: risks.length > 0 ? 60 : 90,
            summary: `Analyzed update. Found ${risks.length} potential risks.`
        };
    }
};

export const MockAudit: AuditAgent = {
    logEvent: (entry) => {
        console.log('[AUDIT AGENT]', entry);
        // In real app, push to DynamoDB
    }
};
