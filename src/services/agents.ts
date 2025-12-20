import type { BusinessOutcome, StatusUpdate, RiskSignal, AuditLogEntry } from '../types';

// Agent Interfaces
export interface CollectorAgent {
    generatePrompt(outcome: BusinessOutcome, lastUpdate?: StatusUpdate): string;
    parseResponse(responseText: string): Partial<StatusUpdate>;
}

export interface SynthesizerAgent {
    analyzeUpdate(update: StatusUpdate, history: StatusUpdate[], outcome: BusinessOutcome): {
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
    generatePrompt: (outcome, lastUpdate) => {
        if (!lastUpdate) {
            return `Hi ${outcome.ownerId}, please provide the first status update for ${outcome.name}. What is the current outlook?`;
        }
        return `Hi ${outcome.ownerId}, last week you reported ${lastUpdate.health}. What has changed? Is the target date of ${outcome.targetDate} still realistic?`;
    },
    parseResponse: (text) => {
        const health = text.toLowerCase().includes('delayed') || text.toLowerCase().includes('risk') ? 'Red' : 'Green';
        return {
            narrative: text,
            health: health,
            confidence: 'Medium'
        };
    }
};

export const MockSynthesizer: SynthesizerAgent = {
    analyzeUpdate: (update, _history, _outcome) => {
        const risks: RiskSignal[] = [];

        if (update.health === 'Green' && update.narrative.length < 20) {
            risks.push({
                id: crypto.randomUUID(),
                type: 'Ambiguity',
                severity: 'Medium',
                description: 'Update is too brief for a Green status.',
                detectedAt: new Date().toISOString()
            });
        }

        if (update.health === 'Green' && update.narrative.toLowerCase().includes('blocker')) {
            risks.push({
                id: crypto.randomUUID(),
                type: 'Consistency',
                severity: 'High',
                description: 'Narrative mentions blockers but health is Green.',
                detectedAt: new Date().toISOString()
            });
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
    }
};
