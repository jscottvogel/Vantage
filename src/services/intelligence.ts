import { MockCollector, MockSynthesizer, MockAudit } from './agents';
import type { StrategicObjective, Heartbeat } from '../types';

export class IntelligenceLoop {
    static async processUpdate(objective: StrategicObjective, rawText: string, authorId: string): Promise<Heartbeat> {
        // 1. Capture & Parse
        const draft = MockCollector.parseResponse(rawText);

        const heartbeat: Heartbeat = {
            id: crypto.randomUUID(),
            objectiveId: objective.id,
            // authorId: authorId, // Heartbeat doesn't have authorId at top level, stored in ownerAttestation usually
            periodStart: new Date().toISOString(), // Todo: determine period
            periodEnd: new Date().toISOString(),
            healthSignal: draft.healthSignal || 'green',
            confidence: draft.confidence || 'Medium',
            narrative: draft.narrative || rawText,
            confidenceToExpectedImpact: 0,
            leadingIndicators: [],
            evidence: [],
            risks: [],
            ownerAttestation: {
                attestedBy: authorId,
                attestedOn: new Date().toISOString()
            }
        };

        // 2. Synthesize & Analyze
        const analysis = MockSynthesizer.analyzeUpdate(heartbeat, [], objective);

        heartbeat.risks = analysis.risks;
        // heartbeat.aiCredibilityScore = analysis.confidenceScore; // Not in Heartbeat model yet, ignore.

        // 3. Audit
        MockAudit.logEvent({
            tenantId: objective.tenantId,
            actorId: 'system-synthesizer',
            action: 'analyze_update',
            resourceId: heartbeat.id,
            resourceType: 'StrategicObjective', // Mapped to closest resource type 
            details: JSON.stringify(analysis)
        });

        return heartbeat;
    }
}
