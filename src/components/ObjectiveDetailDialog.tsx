import { useState } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { X, Target, Briefcase, Layers, ArrowRight, Activity, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { KeyResultHeartbeatDialog } from './KeyResultHeartbeatDialog';
import { NotificationService } from '../services/notification';
import type { Heartbeat, Initiative, KeyResult, CadenceSchedule } from '../types';

const formatCadence = (schedule: CadenceSchedule | string | undefined | null) => {
    if (!schedule) return 'N/A';
    if (typeof schedule === 'string') return schedule;
    // Defensive check for frequency, just in case
    if (!schedule.frequency) return 'N/A';
    return `${schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} on ${schedule.dueDay}s`;
}

interface ObjectiveDetailDialogProps {
    objectiveId: string;
    onClose: () => void;
    onSelectInitiative: (initiativeId: string) => void;
}

export function ObjectiveDetailDialog({ objectiveId, onClose, onSelectInitiative }: ObjectiveDetailDialogProps) {
    const store = useStore();
    const objective = store.objectives.find(o => o.id === objectiveId);
    const activeUsers = store.users.filter(u => u.status === 'Active');

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
            startDate: new Date().toISOString(),
            targetDate: objective.targetDate,
            heartbeatCadence: { frequency: 'weekly', dueDay: 'Friday', dueTime: '17:00' },
            initiatives: [],
            heartbeats: []
        };

        store.addKeyResult(objectiveId, outcomeId, newKR);
        setAddingKRToOutcome(null);
        setNewKRDescription('');
        setNewKROwnerId(store.currentUser?.id || activeUsers[0]?.id || '');
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

    const handleNotifyOwner = async (type: 'kr' | 'initiative', id: string, name: string, ownerEmail: string) => {
        const link = `${window.location.origin}/heartbeat/${type}/${id}`;

        // Use real service
        // Note: ownerEmail is just an ID in standard User object right now, we need to find the User object to get the email if possible
        // But for now we will assume the ID *might* be an email or we simulated it.
        // Let's lookup the user from store.
        const user = store.users.find(u => u.id === ownerEmail);
        const email = user?.email || ownerEmail; // Fallback if ownerId is the email

        if (!email.includes('@')) {
            alert(`Cannot notify: Invalid email for owner '${ownerEmail}'`);
            return;
        }

        const result = await NotificationService.sendHeartbeatNotification(email, link, name);

        if (result.success) {
            alert(`Notification sent to ${email}!`);
        } else {
            console.error(result.error);
            alert('Failed to send notification. detailed error in console.');
        }
    };

    const handleDeleteKeyResult = (outcomeId: string, krId: string) => {
        // if (confirm('Delete this Key Result? This will remove all associated initiatives and heartbeats.')) {
        store.removeKeyResult(objectiveId, outcomeId, krId);
        // }
    };

    const handleAddInitiative = (krId: string) => {
        if (!newInitName.trim()) return;

        const newInit: Initiative = {
            id: crypto.randomUUID(),
            name: newInitName,
            ownerId: newInitOwnerId,
            status: 'active',
            startDate: new Date().toISOString(),
            targetEndDate: objective.targetDate,
            heartbeatCadence: { frequency: 'weekly', dueDay: 'Friday', dueTime: '17:00' },
            supportedKeyResults: [],
            heartbeats: [],
            link: ''
        };

        store.addInitiative(objectiveId, selectedKR?.krId || krId, newInit); // Fallback to passed krId if selected null
        setAddingToKR(null);
        setNewInitName('');
    };

    const handleDeleteInitiative = (krId: string, initId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        store.removeInitiative(objectiveId, krId, initId);
    };

    const getLatestHeartbeat = (heartbeats: Heartbeat[]) => {
        if (!heartbeats || heartbeats.length === 0) return null;
        // Sort by periodEnd desc
        return [...heartbeats].sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())[0];
    };

    const getOwnerName = (id: string) => {
        // Fallback: If ID matches current user's Auth ID (legacy data), return their name
        if (store.currentUser && id === store.currentUser.id) return store.currentUser.name;

        const user = store.users.find(u => u.id === id);
        return user ? user.name : id;
    };

    const healthIcon = (signal: string) => {
        switch (signal) {
            case 'green': return <div className="w-3 h-3 rounded-full bg-green-500" />;
            case 'yellow': return <div className="w-3 h-3 rounded-full bg-amber-500" />;
            case 'red': return <div className="w-3 h-3 rounded-full bg-red-500" />;
            default: return <div className="w-3 h-3 rounded-full bg-gray-300" />;
        }
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
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-5 h-5" />
                                        <h3>Outcome {oIdx + 1}: {outcome.goal}</h3>
                                    </div>
                                    {outcome.ownerId && (
                                        <span className="text-xs text-muted-foreground ml-7 font-normal">
                                            Owner: {getOwnerName(outcome.ownerId)}
                                        </span>
                                    )}
                                </div>
                                {addingKRToOutcome !== outcome.id && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingKRToOutcome(outcome.id)}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Key Result
                                    </Button>
                                )}
                            </div>
                            <div className="pl-6 text-sm text-muted-foreground mb-2 flex flex-col gap-1">
                                <div>Benefit: {outcome.benefit}</div>
                                <div className="text-xs space-x-3">
                                    <span>Start: {new Date(outcome.startDate).toLocaleDateString()}</span>
                                    <span>Target: {new Date(outcome.targetDate).toLocaleDateString()}</span>
                                    <Badge variant="outline" className="text-[10px] h-4">{formatCadence(outcome.heartbeatCadence)}</Badge>
                                </div>
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
                                                {activeUsers.map(u => (
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
                                                                {activeUsers.map(u => (
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
                                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                                                                <span>Owner: {getOwnerName(kr.ownerId)}</span>
                                                                <span>Target: {new Date(kr.targetDate).toLocaleDateString()}</span>
                                                                <Badge variant="outline" className="text-[10px] h-4">{formatCadence(kr.heartbeatCadence)}</Badge>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-5 text-[10px] px-1 text-blue-600 hover:text-blue-800"
                                                                    onClick={() => handleNotifyOwner('kr', kr.id, kr.description, kr.ownerId)}
                                                                >
                                                                    Notify Owner
                                                                </Button>
                                                            </div>
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
                                                        {healthIcon(latestHB.healthSignal)}
                                                        <Badge variant={latestHB.confidence === 'High' ? 'default' : latestHB.confidence === 'Medium' ? 'secondary' : 'destructive'} className="rounded-sm">
                                                            Confidence: {latestHB.confidence || 'N/A'}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground border-l pl-2">
                                                            {new Date(latestHB.periodEnd).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted-foreground italic text-xs line-clamp-2">"{latestHB.narrative}"</p>
                                                    {latestHB.risks && latestHB.risks.length > 0 && (
                                                        <div className="text-xs flex gap-1 flex-wrap">
                                                            <span className="font-semibold text-red-700">Risks:</span>
                                                            <span className="text-red-700">{latestHB.risks.length} identified</span>
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
                                                            {activeUsers.map(u => (
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
                                                        {kr.initiatives.map((init) => {
                                                            const latestInitHB = getLatestHeartbeat(init.heartbeats);
                                                            return (
                                                                <div key={init.id}
                                                                    className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer transition-colors group relative"
                                                                    onClick={() => onSelectInitiative(init.id)}
                                                                >
                                                                    <div className="space-y-1">
                                                                        <div className="font-medium text-sm pr-6">{init.name}</div>
                                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                                                            <span>Owner: {getOwnerName(init.ownerId)}</span>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-4 p-0 text-[10px] text-blue-600 hover:text-blue-800"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleNotifyOwner('initiative', init.id, init.name, init.ownerId);
                                                                                }}
                                                                            >
                                                                                Notify Owner
                                                                            </Button>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <Badge variant="outline" className="text-[10px] h-5">{init.status}</Badge>
                                                                            {init.heartbeats.length > 0 && (
                                                                                <Badge variant="secondary" className="text-[10px] h-5">
                                                                                    {init.heartbeats.length} Signals
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {latestInitHB && (
                                                                            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-dashed">
                                                                                {healthIcon(latestInitHB.healthSignal)}
                                                                                <Badge variant={latestInitHB.confidence === 'High' ? 'default' : latestInitHB.confidence === 'Medium' ? 'secondary' : 'destructive'} className="text-[10px] h-5">
                                                                                    Conf: {latestInitHB.confidence || 'N/A'}
                                                                                </Badge>
                                                                            </div>
                                                                        )}
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
                                                            );
                                                        })}
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
