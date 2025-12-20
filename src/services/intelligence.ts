import { MockCollector, MockSynthesizer, MockAudit } from './agents';
import type { BusinessOutcome, StatusUpdate } from '../types';

export class IntelligenceLoop {
    static async processUpdate(outcome: BusinessOutcome, rawText: string, authorId: string): Promise<StatusUpdate> {
        // 1. Capture & Parse
        const draft = MockCollector.parseResponse(rawText);

        const update: StatusUpdate = {
            id: crypto.randomUUID(),
            outcomeId: outcome.id,
            authorId: authorId,
            timestamp: new Date().toISOString(),
            health: draft.health || 'Green',
            confidence: draft.confidence || 'Medium',
            narrative: draft.narrative || rawText,
        };

        // 2. Synthesize & Analyze
        const analysis = MockSynthesizer.analyzeUpdate(update, [], outcome);

        update.aiRiskFlags = analysis.riskFlags;
        update.aiCredibilityScore = analysis.credibilityScore;

        // 3. Audit
        MockAudit.logEvent({
            tenantId: outcome.tenantId,
            actorId: 'system-synthesizer',
            action: 'analyze_update',
            resourceId: update.id,
            resourceType: 'Update',
            details: JSON.stringify(analysis)
        });

        return update;
    }
}
