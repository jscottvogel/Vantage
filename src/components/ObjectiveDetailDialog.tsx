import { useState } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { X, Target, Briefcase, Layers, ArrowRight, Activity, TrendingUp, TrendingDown, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { KeyResultHeartbeatDialog } from './KeyResultHeartbeatDialog';
import type { KeyResultHeartbeat, Initiative, KeyResult } from '../types';

interface ObjectiveDetailDialogProps {
    objectiveId: string;
    onClose: () => void;
    onSelectInitiative: (initiativeId: string) => void;
}

export function ObjectiveDetailDialog({ objectiveId, onClose, onSelectInitiative }: ObjectiveDetailDialogProps) {
    const store = useStore();
    const objective = store.objectives.find(o => o.id === objectiveId);

    const [selectedKR, setSelectedKR] = useState<{ krId: string } | null>(null);
    const [addingToKR, setAddingToKR] = useState<string | null>(null);

    // KR CRUD State
    const [addingKRToOutcome, setAddingKRToOutcome] = useState<string | null>(null);
    const [newKRDescription, setNewKRDescription] = useState('');
    const [newKROwnerId, setNewKROwnerId] = useState(store.currentUser?.id || store.users[0]?.id || '');

    const [editingKR, setEditingKR] = useState<string | null>(null);
    const [editKRDescription, setEditKRDescription] = useState('');
    const [editKROwnerId, setEditKROwnerId] = useState('');

    const [newInitName, setNewInitName] = useState('');
    const [newInitOwnerId, setNewInitOwnerId] = useState(store.currentUser?.id || store.users[0]?.id || '');

    if (!objective) return null;

    const handleAddKeyResult = (outcomeId: string) => {
        if (!newKRDescription.trim()) return;

        const newKR: KeyResult = {
            id: crypto.randomUUID(),
            description: newKRDescription,
            ownerId: newKROwnerId,
            initiatives: [],
            heartbeats: []
        };

        store.addKeyResult(objectiveId, outcomeId, newKR);
        setAddingKRToOutcome(null);
        setNewKRDescription('');
        setNewKROwnerId(store.currentUser?.id || store.users[0]?.id || '');
    };

    const startEditingKR = (kr: KeyResult) => {
        setEditingKR(kr.id);
        setEditKRDescription(kr.description);
        setEditKROwnerId(kr.ownerId);
    };

    const handleUpdateKeyResult = (outcomeId: string, krId: string) => {
        if (!editKRDescription.trim()) return;
        store.updateKeyResult(objectiveId, outcomeId, krId, {
            description: editKRDescription,
            ownerId: editKROwnerId
        });
        setEditingKR(null);
    };

    const handleDeleteKeyResult = (outcomeId: string, krId: string) => {
        // if (confirm('Delete this Key Result? This will remove all associated initiatives and heartbeats.')) {
        store.removeKeyResult(objectiveId, outcomeId, krId);
        // }
    };

    const getLatestHeartbeat = (heartbeats: KeyResultHeartbeat[]) => {
        if (!heartbeats || heartbeats.length === 0) return null;
        return heartbeats[heartbeats.length - 1];
    };

    const trendIcon = (trend: string) => {
        switch (trend) {
            case 'Improving': return <TrendingUp className="w-3 h-3 text-green-600" />;
            case 'Declining': return <TrendingDown className="w-3 h-3 text-red-600" />;
            default: return <Minus className="w-3 h-3 text-gray-400" />;
        }
    };

    const handleAddInitiative = (krId: string) => {
        if (!newInitName.trim()) return;

        const newInitiative: Initiative = {
            id: crypto.randomUUID(),
            name: newInitName,
            // Default values
            ownerId: newInitOwnerId || store.currentUser?.id || 'Unassigned',
            status: 'active',
            startDate: new Date().toISOString(),
            targetEndDate: objective.targetDate,
            heartbeatCadence: 'weekly',
            supportedKeyResults: [],
            heartbeats: []
        };

        store.addInitiative(objectiveId, krId, newInitiative);
        setAddingToKR(null);
        setNewInitName('');
        setNewInitOwnerId(store.currentUser?.id || store.users[0]?.id || '');
    };

    const handleDeleteInitiative = (krId: string, initId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        store.removeInitiative(objectiveId, krId, initId);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl relative max-h-[90vh] overflow-hidden flex flex-col">
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
                    <X className="w-5 h-5" />
                </button>

                <CardHeader className="flex-shrink-0 border-b bg-muted/20">
                    <CardTitle className="text-2xl">{objective.name}</CardTitle>
                    <CardDescription>
                        Target: {new Date(objective.targetDate).toLocaleDateString()} • {objective.strategicValue} Value
                    </CardDescription>
                </CardHeader>

                <CardContent className="overflow-y-auto p-6 space-y-8">
                    {objective.outcomes.map((outcome, oIdx) => (
                        <div key={outcome.id} className="space-y-4">
                            <div className="flex items-center justify-between text-lg font-semibold text-primary">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-5 h-5" />
                                    <h3>Outcome {oIdx + 1}: {outcome.goal}</h3>
                                </div>
                                {addingKRToOutcome !== outcome.id && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingKRToOutcome(outcome.id)}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Key Result
                                    </Button>
                                )}
                            </div>
                            <div className="pl-6 text-sm text-muted-foreground mb-2">
                                Benefit: {outcome.benefit}
                            </div>

                            {/* Add KR Form */}
                            {addingKRToOutcome === outcome.id && (
                                <div className="ml-6 border rounded-md p-4 bg-muted/20 mb-4">
                                    <div className="flex flex-col gap-3">
                                        <input
                                            autoFocus
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                                            placeholder="Key Result Description"
                                            value={newKRDescription}
                                            onChange={e => setNewKRDescription(e.target.value)}
                                        />
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={newKROwnerId}
                                                onChange={e => setNewKROwnerId(e.target.value)}
                                            >
                                                {store.users.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                            <Button size="sm" onClick={() => handleAddKeyResult(outcome.id)}>Save</Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setAddingKRToOutcome(null); setNewKRDescription(''); }}>Cancel</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pl-6 grid gap-4">
                                {outcome.keyResults.map((kr) => {
                                    const latestHB = getLatestHeartbeat(kr.heartbeats);
                                    const isEditing = editingKR === kr.id;

                                    return (
                                        <div key={kr.id} className="border rounded-md p-4 bg-background shadow-sm group/kr">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-start gap-2 flex-1">
                                                    <Target className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                                                    {isEditing ? (
                                                        <div className="flex-1 flex flex-col gap-2 mr-4">
                                                            <input
                                                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                                                value={editKRDescription}
                                                                onChange={e => setEditKRDescription(e.target.value)}
                                                            />
                                                            <select
                                                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                                                value={editKROwnerId}
                                                                onChange={e => setEditKROwnerId(e.target.value)}
                                                            >
                                                                {store.users.map(u => (
                                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                                ))}
                                                            </select>
                                                            <div className="flex gap-2">
                                                                <Button size="sm" onClick={() => handleUpdateKeyResult(outcome.id, kr.id)}>Save</Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setEditingKR(null)}>Cancel</Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1">
                                                            <div className="font-medium flex items-center justify-between">
                                                                {kr.description}

                                                                {/* KR Actions */}
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/kr:opacity-100 transition-opacity">
                                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => startEditingKR(kr)}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteKeyResult(outcome.id, kr.id)}>
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">Owner: {store.users.find(u => u.id === kr.ownerId)?.name || kr.ownerId}</div>
                                                        </div>
                                                    )}
                                                </div>
                                                {!isEditing && (
                                                    <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0" onClick={() => setSelectedKR({ krId: kr.id })}>
                                                        <Activity className="w-3 h-3 mr-1" />
                                                        Update Confidence
                                                    </Button>
                                                )}
                                            </div>

                                            {/* KR Heartbeat Summary */}
                                            {latestHB && (
                                                <div className="ml-6 mb-4 p-3 bg-slate-50 border rounded-md text-sm space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={latestHB.overallConfidence === 'High' ? 'default' : latestHB.overallConfidence === 'Medium' ? 'secondary' : 'destructive'} className="rounded-sm">
                                                            Confidence: {latestHB.overallConfidence}
                                                        </Badge>
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            {trendIcon(latestHB.confidenceTrend)}
                                                            <span className="ml-1">{latestHB.confidenceTrend}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground border-l pl-2">
                                                            {new Date(latestHB.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted-foreground italic text-xs">"{latestHB.heartbeatSummary}"</p>
                                                    {latestHB.confidenceDrivers.length > 0 && (
                                                        <div className="text-xs flex gap-1 flex-wrap">
                                                            <span className="font-semibold text-green-700">Drivers:</span>
                                                            {latestHB.confidenceDrivers.slice(0, 2).map((d, i) => (
                                                                <span key={i} className="bg-green-50 text-green-700 px-1 py-0.5 rounded border border-green-100">{d}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Initiatives List */}
                                            <div className="ml-6 space-y-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3" /> Supporting Initiatives
                                                    </div>
                                                    {addingToKR !== kr.id && (
                                                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setAddingToKR(kr.id)}>
                                                            <Plus className="w-3 h-3 mr-1" /> Add
                                                        </Button>
                                                    )}
                                                </div>

                                                {addingToKR === kr.id && (
                                                    <div className="flex items-center gap-2 mb-2 p-2 bg-muted/20 rounded border">
                                                        <input
                                                            autoFocus
                                                            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                                                            placeholder="Initiative Name"
                                                            value={newInitName}
                                                            onChange={e => setNewInitName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleAddInitiative(kr.id)}
                                                        />
                                                        <select
                                                            className="flex h-8 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                                            value={newInitOwnerId}
                                                            onChange={e => setNewInitOwnerId(e.target.value)}
                                                        >
                                                            {store.users.map(u => (
                                                                <option key={u.id} value={u.id}>{u.name}</option>
                                                            ))}
                                                        </select>
                                                        <Button size="sm" onClick={() => handleAddInitiative(kr.id)}>Save</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => { setAddingToKR(null); setNewInitName(''); }}>Cancel</Button>
                                                    </div>
                                                )}

                                                {kr.initiatives.length === 0 && addingToKR !== kr.id ? (
                                                    <div className="text-sm text-muted-foreground italic">No initiatives defined.</div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {kr.initiatives.map((init) => (
                                                            <div key={init.id}
                                                                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer transition-colors group relative"
                                                                onClick={() => onSelectInitiative(init.id)}
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="font-medium text-sm pr-6">{init.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground">Owner: {store.users.find(u => u.id === init.ownerId)?.name || init.ownerId}</div>
                                                                    <div className="flex gap-2">
                                                                        <Badge variant="outline" className="text-[10px] h-5">{init.status}</Badge>
                                                                        {init.heartbeats.length > 0 && (
                                                                            <Badge variant="secondary" className="text-[10px] h-5">
                                                                                {init.heartbeats.length} Signals
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(e) => handleDeleteInitiative(kr.id, init.id, e)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </CardContent>

                {selectedKR && (
                    <KeyResultHeartbeatDialog
                        objectiveId={objectiveId}
                        keyResultId={selectedKR.krId}
                        onClose={() => setSelectedKR(null)}
                    />
                )}
            </Card>
        </div>
    );
}
