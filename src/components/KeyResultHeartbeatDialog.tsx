import { useState } from 'react';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KeyResultHeartbeat, HeartbeatLink, Confidence, ConfidenceTrend } from '../types';

interface KeyResultHeartbeatDialogProps {
    objectiveId: string;
    keyResultId: string;
    onClose: () => void;
}

export function KeyResultHeartbeatDialog({ objectiveId, keyResultId, onClose }: KeyResultHeartbeatDialogProps) {
    const store = useStore();
    const objective = store.objectives.find(o => o.id === objectiveId);

    // Deep find KeyResult
    let keyResult: any;
    if (objective) {
        for (const outcome of objective.outcomes) {
            const found = outcome.keyResults.find(k => k.id === keyResultId);
            if (found) {
                keyResult = found;
                break;
            }
        }
    }

    // Collect all initiatives across this Key Result
    // (Actually a KR has direct initiatives, so we can just use those)
    const availableInitiatives = keyResult ? keyResult.initiatives : [];

    const [overallConfidence, setOverallConfidence] = useState<Confidence>('Medium');
    const [confidenceTrend, setConfidenceTrend] = useState<ConfidenceTrend>('Stable');

    const [primaryLinks, setPrimaryLinks] = useState<HeartbeatLink[]>([]);

    // Multi-value text fields
    const [confidenceDrivers, setConfidenceDrivers] = useState<string[]>(['']);
    const [riskDrivers, setRiskDrivers] = useState<string[]>(['']);
    const [knownUnknowns, setKnownUnknowns] = useState<string[]>(['']);
    const [gaps, setGaps] = useState<string[]>(['']);

    const [limitations, setLimitations] = useState('');
    const [summary, setSummary] = useState('');

    if (!keyResult) return null;

    const handleAddLink = (initId: string) => {
        if (!primaryLinks.find(pl => pl.initiativeId === initId)) {
            setPrimaryLinks([...primaryLinks, { initiativeId: initId, influenceLevel: 'Primary' }]);
        }
    };

    const handleRemoveLink = (initId: string) => {
        setPrimaryLinks(primaryLinks.filter(pl => pl.initiativeId !== initId));
    };

    const updateLinkLevel = (initId: string, level: 'Primary' | 'Supporting') => {
        setPrimaryLinks(primaryLinks.map(pl => pl.initiativeId === initId ? { ...pl, influenceLevel: level } : pl));
    };

    // Helper for string arrays
    const updateArray = (setter: any, arr: string[], index: number, val: string) => {
        const newArr = [...arr];
        newArr[index] = val;
        setter(newArr);
    };
    const addToArray = (setter: any, arr: string[]) => setter([...arr, '']);
    const removeFromArray = (setter: any, arr: string[], index: number) => setter(arr.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter empty strings
        const cleanConf = confidenceDrivers.filter(s => s.trim());
        const cleanRisk = riskDrivers.filter(s => s.trim());
        const cleanUnknowns = knownUnknowns.filter(s => s.trim());
        const cleanGaps = gaps.filter(s => s.trim());

        const newHeartbeat: KeyResultHeartbeat = {
            id: `KRHB-${new Date().toISOString().split('T')[0]}`,
            keyResultId,
            keyResultStatement: keyResult.description,
            timestamp: new Date().toISOString(),
            overallConfidence,
            confidenceTrend,
            primaryInitiatives: primaryLinks,
            confidenceDrivers: cleanConf,
            riskDrivers: cleanRisk,
            knownUnknowns: cleanUnknowns,
            informationGaps: cleanGaps,
            confidenceLimitations: limitations,
            heartbeatSummary: summary,
            sourceInitiativeHeartbeatIds: [] // Todo linking
        };

        store.addKeyResultHeartbeat(objectiveId, keyResultId, newHeartbeat);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl relative max-h-[90vh] overflow-y-auto flex flex-col">
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
                    <X className="w-5 h-5" />
                </button>

                <CardHeader className="bg-muted/20 border-b">
                    <CardTitle>Add Key Result Heartbeat</CardTitle>
                    <CardDescription>Assess confidence in achieving: "{keyResult.description}"</CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Section 1: Aggregated Confidence */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Overall Confidence</label>
                                <div className="flex gap-2">
                                    {['High', 'Medium', 'Low'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setOverallConfidence(c as Confidence)}
                                            className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${overallConfidence === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confidence Trend</label>
                                <div className="flex gap-2">
                                    {[
                                        { val: 'Improving', icon: <TrendingUp className="w-4 h-4 text-green-600 mb-1" /> },
                                        { val: 'Stable', icon: <Minus className="w-4 h-4 text-gray-500 mb-1" /> },
                                        { val: 'Declining', icon: <TrendingDown className="w-4 h-4 text-red-600 mb-1" /> }
                                    ].map((opt) => (
                                        <button
                                            key={opt.val}
                                            type="button"
                                            onClick={() => setConfidenceTrend(opt.val as ConfidenceTrend)}
                                            className={`flex-1 py-2 px-2 rounded-md border text-sm font-medium flex flex-col items-center justify-center transition-colors ${confidenceTrend === opt.val ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-muted'}`}
                                        >
                                            {opt.icon}
                                            {opt.val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Narrative */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Heartbeat Summary (Executive View)</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="2-4 sentences explaining the current outlook..."
                                value={summary}
                                onChange={e => setSummary(e.target.value)}
                                required
                            />
                        </div>

                        {/* Section 3: Drivers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium flex items-center gap-2 text-green-700">Confidence Drivers</label>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => addToArray(setConfidenceDrivers, confidenceDrivers)}>+</Button>
                                </div>
                                {confidenceDrivers.map((d, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input className="flex h-8 w-full rounded-md border text-sm px-2" placeholder="Why are we confident?" value={d} onChange={e => updateArray(setConfidenceDrivers, confidenceDrivers, i, e.target.value)} />
                                        {confidenceDrivers.length > 1 && <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeFromArray(setConfidenceDrivers, confidenceDrivers, i)}><X className="w-3 h-3" /></Button>}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium flex items-center gap-2 text-red-700">Risk Drivers</label>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => addToArray(setRiskDrivers, riskDrivers)}>+</Button>
                                </div>
                                {riskDrivers.map((d, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input className="flex h-8 w-full rounded-md border text-sm px-2" placeholder="What is increasing risk?" value={d} onChange={e => updateArray(setRiskDrivers, riskDrivers, i, e.target.value)} />
                                        {riskDrivers.length > 1 && <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeFromArray(setRiskDrivers, riskDrivers, i)}><X className="w-3 h-3" /></Button>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 4: Uncertainty & Gaps */}
                        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-amber-900 uppercase tracking-widest">Uncertainty & Gaps</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-amber-800">Known Unknowns</label>
                                    {knownUnknowns.map((d, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input className="flex h-8 w-full rounded-md border border-amber-200 text-sm px-2" value={d} onChange={e => updateArray(setKnownUnknowns, knownUnknowns, i, e.target.value)} />
                                            {knownUnknowns.length > 1 && <Button type="button" size="icon" variant="ghost" className="h-8 w-8 hover:bg-amber-100" onClick={() => removeFromArray(setKnownUnknowns, knownUnknowns, i)}><X className="w-3 h-3" /></Button>}
                                        </div>
                                    ))}
                                    <Button type="button" size="sm" variant="link" className="text-amber-700 h-6 p-0" onClick={() => addToArray(setKnownUnknowns, knownUnknowns)}>+ Add Unknown</Button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-amber-800">Information Gaps</label>
                                    {gaps.map((d, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input className="flex h-8 w-full rounded-md border border-amber-200 text-sm px-2" value={d} onChange={e => updateArray(setGaps, gaps, i, e.target.value)} />
                                            {gaps.length > 1 && <Button type="button" size="icon" variant="ghost" className="h-8 w-8 hover:bg-amber-100" onClick={() => removeFromArray(setGaps, gaps, i)}><X className="w-3 h-3" /></Button>}
                                        </div>
                                    ))}
                                    <Button type="button" size="sm" variant="link" className="text-amber-700 h-6 p-0" onClick={() => addToArray(setGaps, gaps)}>+ Add Gap</Button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-amber-800">Confidence Limitations (Explicit Statement)</label>
                                <input
                                    className="flex h-9 w-full rounded-md border border-amber-200 text-sm px-3"
                                    placeholder="e.g. Confidence is limited by pending user feedback results..."
                                    value={limitations}
                                    onChange={e => setLimitations(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Section 5: Primary Initiatives */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Contributing Initiatives</label>

                            <div className="flex gap-2 flex-wrap">
                                {availableInitiatives.map((init: any) => (
                                    <div
                                        key={init.id}
                                        onClick={() => primaryLinks.find(pl => pl.initiativeId === init.id) ? handleRemoveLink(init.id) : handleAddLink(init.id)}
                                        className={`cursor-pointer px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${primaryLinks.find(pl => pl.initiativeId === init.id) ? 'bg-indigo-100 border-indigo-300 text-indigo-800 ring-1 ring-indigo-300' : 'bg-background hover:border-gray-400'}`}
                                    >
                                        {init.name}
                                    </div>
                                ))}
                            </div>

                            {primaryLinks.length > 0 && (
                                <div className="bg-muted/30 p-3 rounded-md space-y-2">
                                    {primaryLinks.map((link) => {
                                        const initName = availableInitiatives.find((AI: any) => AI.id === link.initiativeId)?.name;
                                        return (
                                            <div key={link.initiativeId} className="flex items-center justify-between text-sm">
                                                <span>{initName}</span>
                                                <select
                                                    className="h-8 rounded-md border text-xs px-2"
                                                    value={link.influenceLevel}
                                                    onChange={e => updateLinkLevel(link.initiativeId, e.target.value as any)}
                                                >
                                                    <option value="Primary">Primary</option>
                                                    <option value="Supporting">Supporting</option>
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end gap-2 border-t">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Submit Heartbeat</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
