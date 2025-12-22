import type { StrategicObjective, Heartbeat, Risk, AuditLogEntry } from '../types';

// Agent Interfaces
export interface CollectorAgent {
    generatePrompt(objective: StrategicObjective, lastHeartbeat?: Heartbeat): string;
    parseResponse(responseText: string): Partial<Heartbeat>;
}

export interface SynthesizerAgent {
    analyzeUpdate(heartbeat: Heartbeat, history: Heartbeat[], objective: StrategicObjective): {
        risks: Risk[];
        confidenceScore: number; // mapped from credibility
        summary: string;
    };
}

export interface AuditAgent {
    logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void;
}

// Mock Implementations

export const MockCollector: CollectorAgent = {
    generatePrompt: (objective, lastHeartbeat) => {
        if (!lastHeartbeat) {
            return `Hi ${objective.ownerId}, please provide the first status update for ${objective.name}. What is the current outlook?`;
        }
        return `Hi ${objective.ownerId}, last period you reported ${lastHeartbeat.healthSignal}. What has changed? Is the target date of ${objective.targetDate} still realistic?`;
    },
    parseResponse: (text) => {
        const health = text.toLowerCase().includes('delayed') || text.toLowerCase().includes('risk') ? 'red' : 'green';
        return {
            narrative: text,
            healthSignal: health,
            confidence: 'Medium'
        };
    }
};

export const MockSynthesizer: SynthesizerAgent = {
    analyzeUpdate: (heartbeat, _history, _objective) => {
        const risks: Risk[] = [];

        if (heartbeat.healthSignal === 'green' && heartbeat.narrative.length < 20) {
            risks.push({
                description: 'Update is too brief for a Green status.',
                severity: 'medium',
                mitigation: 'Request more detail.'
            });
        }

        if (heartbeat.healthSignal === 'green' && heartbeat.narrative.toLowerCase().includes('blocker')) {
            risks.push({
                description: 'Narrative mentions blockers but health is Green.',
                severity: 'high',
                mitigation: 'Clarify status.'
            });
        }

        return {
            risks: risks,
            confidenceScore: risks.length > 0 ? 60 : 90,
            summary: `Analyzed update. Found ${risks.length} potential risks.`
        };
    }
};

export const MockAudit: AuditAgent = {
    logEvent: (entry) => {
        console.log('[AUDIT AGENT]', entry);
    }
};
