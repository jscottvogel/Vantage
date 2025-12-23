import { useState } from 'react';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { X, HeartPulse, Plus, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Heartbeat, Initiative, LeadingIndicator, Evidence, Risk, CadenceSchedule } from '../types';

const formatCadence = (schedule: CadenceSchedule | string) => {
    if (typeof schedule === 'string') return schedule;
    return `${schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} on ${schedule.dueDay}s`;
}

interface InitiativeDetailDialogProps {
    objectiveId: string;
    initiativeId: string;
    onClose: () => void;
}

export function InitiativeDetailDialog({ objectiveId, initiativeId, onClose }: InitiativeDetailDialogProps) {
    const store = useStore();
    const objective = store.objectives.find(o => o.id === objectiveId);

    // Deep find initiative
    let initiative: Initiative | undefined;
    if (objective) {
        for (const outcome of objective.outcomes) {
            for (const kr of outcome.keyResults) {
                const found = kr.initiatives.find(i => i.id === initiativeId);
                if (found) {
                    initiative = found;
                    break;
                }
            }
            if (initiative) break;
        }
    }

    const [isAddingHeartbeat, setIsAddingHeartbeat] = useState(false);

    // Form State
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [healthSignal, setHealthSignal] = useState<'green' | 'yellow' | 'red'>('green');
    const [confidence, setConfidence] = useState(0.7);

    const [indicators, setIndicators] = useState<LeadingIndicator[]>([]);
    const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
    const [risks, setRisks] = useState<Risk[]>([]);

    if (!initiative || !objective) return null;

    const handleAddIndicator = () => {
        setIndicators([...indicators, { name: '', value: 0, previousValue: 0, trend: 'stable' }]);
    };

    const updateIndicator = (index: number, field: keyof LeadingIndicator, value: any) => {
        const newInd = [...indicators];
        newInd[index] = { ...newInd[index], [field]: value };
        setIndicators(newInd);
    };

    const handleAddEvidence = () => {
        setEvidenceList([...evidenceList, { type: 'metric', description: '', sourceLink: '' }]);
    };

    const updateEvidence = (index: number, field: keyof Evidence, value: any) => {
        const newEv = [...evidenceList];
        newEv[index] = { ...newEv[index], [field]: value };
        setEvidenceList(newEv);
    };

    const handleAddRisk = () => {
        setRisks([...risks, { description: '', severity: 'medium', mitigation: '' }]);
    };

    const updateRisk = (index: number, field: keyof Risk, value: any) => {
        const newRisks = [...risks];
        newRisks[index] = { ...newRisks[index], [field]: value };
        setRisks(newRisks);
    };

    const submitHeartbeat = (e: React.FormEvent) => {
        e.preventDefault();

        // Map slider (0-1) to Enum
        let confidenceEnum: 'High' | 'Medium' | 'Low' = 'Medium';
        if (confidence >= 0.8) confidenceEnum = 'High';
        else if (confidence <= 0.4) confidenceEnum = 'Low';

        const newHeartbeat: Heartbeat = {
            id: `HB-${new Date().toISOString().split('T')[0]}`,
            initiativeId: initiative!.id,
            periodStart,
            periodEnd,
            healthSignal,
            leadingIndicators: indicators,
            evidence: evidenceList,
            risks: risks,
            confidence: confidenceEnum,
            confidenceToExpectedImpact: confidence,
            narrative: "Manual entry", // Default for now until form has a field
            ownerAttestation: {
                attestedBy: store.currentUser?.name || 'Unknown',
                attestedOn: new Date().toISOString().split('T')[0]
            }
        };
        store.addHeartbeat(initiativeId, 'initiative', newHeartbeat);
        setIsAddingHeartbeat(false);
    };

    const healthColors = {
        'green': 'bg-green-100 text-green-800 border-green-200',
        'yellow': 'bg-amber-100 text-amber-800 border-amber-200',
        'red': 'bg-red-100 text-red-800 border-red-200',
    };

    const trendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
            case 'degrading': return <TrendingDown className="w-4 h-4 text-red-600" />;
            default: return <Minus className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl relative max-h-[90vh] overflow-hidden flex flex-col">
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
                    <X className="w-5 h-5" />
                </button>

                <CardHeader className="flex-shrink-0 border-b bg-muted/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{initiative.status}</Badge>
                        <span className="text-muted-foreground text-sm">Owner: {initiative.ownerId}</span>
                    </div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        {initiative.name}
                        {initiative.link && (
                            <a href={initiative.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </CardTitle>
                    <CardDescription className="flex gap-4">
                        <span>Has {initiative.supportedKeyResults?.length || 0} supported KRs</span>
                        <span>Cadence: {formatCadence(initiative.heartbeatCadence)}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="overflow-y-auto p-6 space-y-8">
                    {!isAddingHeartbeat ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <HeartPulse className="w-5 h-5 text-red-500" />
                                    Heartbeat History
                                </h3>
                                <Button onClick={() => setIsAddingHeartbeat(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Heartbeat
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {initiative.heartbeats.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                        No heartbeats recorded yet. Start tracking signals!
                                    </div>
                                ) : (
                                    initiative.heartbeats.map((hb) => (
                                        <Card key={hb.id}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${healthColors[hb.healthSignal]}`}>
                                                            {hb.healthSignal}
                                                        </div>
                                                        <span className="text-sm font-medium">
                                                            Period: {hb.periodStart} - {hb.periodEnd}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        Confidence: {((hb.confidenceToExpectedImpact || 0) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="text-sm space-y-4">
                                                {/* Indicators Grid */}
                                                {hb.leadingIndicators && hb.leadingIndicators.length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {hb.leadingIndicators.map((ind, i) => (
                                                            <div key={i} className="bg-muted p-2 rounded flex flex-col">
                                                                <span className="text-xs text-muted-foreground line-clamp-1" title={ind.name}>{ind.name}</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="font-mono font-bold text-lg">{ind.value}</span>
                                                                    {trendIcon(ind.trend)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Risks */}
                                                {hb.risks && hb.risks.length > 0 && (
                                                    <div>
                                                        <span className="text-xs font-semibold uppercase text-muted-foreground">Risks</span>
                                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                                            {hb.risks.map((r, i) => (
                                                                <li key={i} className="text-foreground/90">
                                                                    <span className="font-medium">{r.description}</span>
                                                                    <span className="text-muted-foreground text-xs ml-2">({r.mitigation})</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="text-xs text-muted-foreground text-right border-t pt-2">
                                                    Attested by {hb.ownerAttestation?.attestedBy || 'Unknown'} on {hb.ownerAttestation?.attestedOn || 'Unknown'}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <form onSubmit={submitHeartbeat} className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h3 className="text-lg font-semibold">New Heartbeat</h3>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingHeartbeat(false)}>Cancel</Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Period Start</label>
                                    <input type="date" required className="flex h-9 w-full rounded-md border border-input px-3"
                                        value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Period End</label>
                                    <input type="date" required className="flex h-9 w-full rounded-md border border-input px-3"
                                        value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Health Signal</label>
                                <div className="flex gap-4">
                                    {['green', 'yellow', 'red'].map((color) => (
                                        <label key={color} className="flex items-center gap-2 cursor-pointer border p-3 rounded-md has-[:checked]:bg-muted">
                                            <input type="radio" name="health" value={color} checked={healthSignal === color} onChange={() => setHealthSignal(color as any)} />
                                            <span className="capitalize font-medium">{color}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Indicators */}
                            <div className="space-y-3 border p-4 rounded-md">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium">Leading Indicators</label>
                                    <Button type="button" size="sm" variant="outline" onClick={handleAddIndicator}>Add Indicator</Button>
                                </div>
                                {indicators.map((ind, i) => (
                                    <div key={i} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <input placeholder="Name" className="flex h-8 w-full rounded-md border px-2 text-sm"
                                                value={ind.name} onChange={e => updateIndicator(i, 'name', e.target.value)} />
                                        </div>
                                        <div className="w-20">
                                            <input type="number" placeholder="Val" className="flex h-8 w-full rounded-md border px-2 text-sm"
                                                value={ind.value} onChange={e => updateIndicator(i, 'value', Number(e.target.value))} />
                                        </div>
                                        <div className="w-24">
                                            <select className="flex h-8 w-full rounded-md border px-2 text-sm"
                                                value={ind.trend} onChange={e => updateIndicator(i, 'trend', e.target.value)}>
                                                <option value="stable">Stable</option>
                                                <option value="improving">Improving</option>
                                                <option value="degrading">Degrading</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Evidence */}
                            <div className="space-y-3 border p-4 rounded-md">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium">Evidence</label>
                                    <Button type="button" size="sm" variant="outline" onClick={handleAddEvidence}>Add Evidence</Button>
                                </div>
                                {evidenceList.map((ev, i) => (
                                    <div key={i} className="flex gap-2 items-end">
                                        <div className="w-24">
                                            <select className="flex h-8 w-full rounded-md border px-2 text-sm"
                                                value={ev.type} onChange={e => updateEvidence(i, 'type', e.target.value)}>
                                                <option value="metric">Metric</option>
                                                <option value="artifact">Artifact</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <input placeholder="Description" className="flex h-8 w-full rounded-md border px-2 text-sm"
                                                value={ev.description} onChange={e => updateEvidence(i, 'description', e.target.value)} />
                                        </div>
                                        <div className="flex-1">
                                            <input placeholder="Link" className="flex h-8 w-full rounded-md border px-2 text-sm"
                                                value={ev.sourceLink} onChange={e => updateEvidence(i, 'sourceLink', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Risks */}
                            <div className="space-y-3 border p-4 rounded-md">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium">Risks</label>
                                    <Button type="button" size="sm" variant="outline" onClick={handleAddRisk}>Add Risk</Button>
                                </div>
                                {risks.map((risk, i) => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <input placeholder="Risk Description" className="flex h-8 w-full rounded-md border px-2 text-sm"
                                            value={risk.description} onChange={e => updateRisk(i, 'description', e.target.value)} />
                                        <input placeholder="Mitigation" className="flex h-8 w-full rounded-md border px-2 text-sm"
                                            value={risk.mitigation} onChange={e => updateRisk(i, 'mitigation', e.target.value)} />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confidence: {(confidence * 100).toFixed(0)}%</label>
                                <input type="range" min="0" max="1" step="0.05" className="w-full"
                                    value={confidence} onChange={e => setConfidence(parseFloat(e.target.value))} />
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="submit">Submit Signal</Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card >
        </div >
    );
}
