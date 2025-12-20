import { useState } from 'react';
import type { Initiative, StatusUpdate } from '../types';
import { InitiativeCard } from './InitiativeCard';
import { Button } from './ui/button';
import { Plus, Filter } from 'lucide-react';

// Mock Data
const MOCK_INITIATIVES: Initiative[] = [
    {
        id: '1',
        name: 'Cloud Migration Phase 1',
        ownerId: 'Sarah J.',
        status: 'Active',
        strategicValue: 'High',
        targetDate: '2025-12-01',
        currentHealth: 'Amber',
        riskScore: 65,
        tenantId: 't1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        name: 'Mobile App Redesign',
        ownerId: 'Mike T.',
        status: 'Active',
        strategicValue: 'Medium',
        targetDate: '2026-03-15',
        currentHealth: 'Green',
        riskScore: 20,
        tenantId: 't1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '3',
        name: 'Legacy CRM Sunset',
        ownerId: 'Jessica R.',
        status: 'Active',
        strategicValue: 'Low',
        targetDate: '2025-10-30',
        currentHealth: 'Red',
        riskScore: 85,
        tenantId: 't1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

const MOCK_UPDATES: Record<string, StatusUpdate> = {
    '1': {
        id: 'u1',
        initiativeId: '1',
        authorId: 'Sarah J.',
        timestamp: new Date().toISOString(),
        health: 'Amber',
        confidence: 'High',
        narrative: 'We are facing some latency issues with the database migration. The team is investigating potential fixes but schedule might slip by 1 week.',
        aiRiskFlags: [
            { id: 'r1', type: 'Sentiment', severity: 'Medium', description: 'Uncertainty regarding latency fixes', detectedAt: new Date().toISOString() }
        ],
        aiCredibilityScore: 85
    },
    '2': {
        id: 'u2',
        initiativeId: '2',
        authorId: 'Mike T.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        health: 'Green',
        confidence: 'High',
        narrative: 'Design phase complete. Engineering handoff scheduled for Friday. No blockers.',
        aiCredibilityScore: 95
    },
    '3': {
        id: 'u3',
        initiativeId: '3',
        authorId: 'Jessica R.',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        health: 'Red',
        confidence: 'Medium',
        narrative: 'Vendor has not responded to data export request. Critical dependency.',
        aiRiskFlags: [
            { id: 'r2', type: 'Consistency', severity: 'High', description: 'Dependencies marked as Critical', detectedAt: new Date().toISOString() }
        ],
        aiCredibilityScore: 90
    }
};

export function Dashboard() {
    const [initiatives] = useState<Initiative[]>(MOCK_INITIATIVES);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Status Overview</h1>
                    <p className="text-muted-foreground">Monday Morning Readout</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Initiative
                    </Button>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initiatives.map((init) => (
                    <InitiativeCard
                        key={init.id}
                        initiative={init}
                        lastUpdate={MOCK_UPDATES[init.id]}
                        onDrillDown={(id) => console.log('Drill down to', id)}
                    />
                ))}
            </main>
        </div>
    );
}
