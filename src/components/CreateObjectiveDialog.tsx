import { useState } from 'react';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Plus, Trash2, Layers } from 'lucide-react';

interface CreateObjectiveDialogProps {
    onClose: () => void;
}

interface InitiativeForm {
    name: string;
    ownerId: string;
    link: string;
}

interface KeyResultForm {
    description: string;
    ownerId: string;
    initiatives: InitiativeForm[];
}

interface OutcomeForm {
    goal: string;
    benefit: string;
    keyResults: KeyResultForm[];
}

export function CreateObjectiveDialog({ onClose }: CreateObjectiveDialogProps) {
    const [name, setName] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [strategicValue, setStrategicValue] = useState<'High' | 'Medium' | 'Low'>('Medium');

    // State is now a list of Outcomes
    const [outcomes, setOutcomes] = useState<OutcomeForm[]>([
        { goal: '', benefit: '', keyResults: [{ description: '', ownerId: '', initiatives: [] }] }
    ]);

    const currentUser = useStore(state => state.currentUser);
    const createObjective = useStore(state => state.createObjective);
    const objectives = useStore(state => state.objectives);
    const maxActive = useStore(state => state.maxActiveObjectives);
    const users = useStore(state => state.users);

    const activeCount = objectives.filter(i => i.status === 'Active').length;
    const isOverCap = activeCount >= maxActive;

    // Outcome Handlers
    const handleAddOutcome = () => {
        setOutcomes([...outcomes, { goal: '', benefit: '', keyResults: [{ description: '', ownerId: '', initiatives: [] }] }]);
    };

    const handleUpdateOutcome = (index: number, field: keyof OutcomeForm, value: any) => {
        const newOutcomes = [...outcomes];
        newOutcomes[index] = { ...newOutcomes[index], [field]: value };
        setOutcomes(newOutcomes);
    };

    const handleRemoveOutcome = (index: number) => {
        const newOutcomes = outcomes.filter((_, i) => i !== index);
        setOutcomes(newOutcomes);
    };

    // KR Handlers (Nested in Outcome)
    const handleAddKR = (outcomeIndex: number) => {
        const newOutcomes = [...outcomes];
        newOutcomes[outcomeIndex].keyResults.push({ description: '', ownerId: '', initiatives: [] });
        setOutcomes(newOutcomes);
    };

    const handleUpdateKR = (outcomeIndex: number, krIndex: number, field: keyof KeyResultForm, value: any) => {
        const newOutcomes = [...outcomes];
        newOutcomes[outcomeIndex].keyResults[krIndex] = {
            ...newOutcomes[outcomeIndex].keyResults[krIndex],
            [field]: value
        };
        setOutcomes(newOutcomes);
    };

    const handleRemoveKR = (outcomeIndex: number, krIndex: number) => {
        const newOutcomes = [...outcomes];
        newOutcomes[outcomeIndex].keyResults = newOutcomes[outcomeIndex].keyResults.filter((_, i) => i !== krIndex);
        setOutcomes(newOutcomes);
    };

    // Initiative Handlers (Doubly Nested)
    const handleAddInitiative = (outcomeIndex: number, krIndex: number) => {
        const newOutcomes = [...outcomes];
        newOutcomes[outcomeIndex].keyResults[krIndex].initiatives.push({ name: '', ownerId: '', link: '' });
        setOutcomes(newOutcomes);
    };

    const handleUpdateInitiative = (outcomeIndex: number, krIndex: number, initIndex: number, field: keyof InitiativeForm, value: string) => {
        const newOutcomes = [...outcomes];
        newOutcomes[outcomeIndex].keyResults[krIndex].initiatives[initIndex] = {
            ...newOutcomes[outcomeIndex].keyResults[krIndex].initiatives[initIndex],
            [field]: value
        };
        setOutcomes(newOutcomes);
    };

    const handleRemoveInitiative = (outcomeIndex: number, krIndex: number, initIndex: number) => {
        const newOutcomes = [...outcomes];
        newOutcomes[outcomeIndex].keyResults[krIndex].initiatives = newOutcomes[outcomeIndex].keyResults[krIndex].initiatives.filter((_, i) => i !== initIndex);
        setOutcomes(newOutcomes);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && targetDate && currentUser) {
            // Basic validation: Ensure at least one outcome with a goal
            const validOutcomes = outcomes.filter(o => o.goal.trim().length > 0);
            createObjective(name, currentUser.id, strategicValue, targetDate, validOutcomes);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-4xl relative my-8 max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle>New Strategic Objective</CardTitle>
                    <CardDescription>Define the objective, outcomes, key results, and supporting initiatives.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isOverCap && (
                        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-4 text-amber-800 text-sm flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                            <div>
                                <strong>Soft Cap Reached:</strong> You have {activeCount} active objectives.
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Core Objective Data */}
                        <div className="border-b pb-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Objective Name</label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="e.g. Expand into APAC Region"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Strategic Value</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={strategicValue}
                                        onChange={e => setStrategicValue(e.target.value as any)}
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Date</label>
                                <input
                                    type="date"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm max-w-sm"
                                    value={targetDate}
                                    onChange={e => setTargetDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Outcomes Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold tracking-tight">Outcomes</h3>
                                <Button type="button" variant="secondary" size="sm" onClick={handleAddOutcome}>
                                    <Layers className="w-4 h-4 mr-2" /> Add Outcome
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {outcomes.map((outcome, oIndex) => (
                                    <div key={oIndex} className="border-2 border-primary/10 rounded-lg p-4 bg-background relative">
                                        {outcomes.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveOutcome(oIndex)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}

                                        {/* Outcome Fields */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goal (The 'What')</label>
                                                <textarea
                                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    placeholder="What are we trying to achieve?"
                                                    value={outcome.goal}
                                                    onChange={e => handleUpdateOutcome(oIndex, 'goal', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Benefit (The 'Why')</label>
                                                <textarea
                                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    placeholder="Business value?"
                                                    value={outcome.benefit}
                                                    onChange={e => handleUpdateOutcome(oIndex, 'benefit', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Key Results Section (Nested) */}
                                        <div className="bg-muted/30 p-4 rounded-md space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-semibold text-muted-foreground">Key Results & Initiatives</h4>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => handleAddKR(oIndex)} className="h-6">
                                                    <Plus className="w-3 h-3 mr-1" /> Add Key Result
                                                </Button>
                                            </div>

                                            {outcome.keyResults.map((kr, kIndex) => (
                                                <div key={kIndex} className="bg-background border rounded-md p-3 shadow-sm">
                                                    {/* KR Inputs */}
                                                    <div className="flex gap-3 mb-2 items-start">
                                                        <div className="flex-1 space-y-1">
                                                            <input
                                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-medium"
                                                                placeholder="Key Result Description"
                                                                value={kr.description}
                                                                onChange={e => handleUpdateKR(oIndex, kIndex, 'description', e.target.value)}
                                                                required={oIndex === 0 && kIndex === 0}
                                                            />
                                                        </div>
                                                        <div className="w-1/3">
                                                            <select
                                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm appearance-none"
                                                                value={kr.ownerId}
                                                                onChange={e => handleUpdateKR(oIndex, kIndex, 'ownerId', e.target.value)}
                                                            >
                                                                <option value="">Owner</option>
                                                                {users.map(u => (
                                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {outcome.keyResults.length > 1 && (
                                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveKR(oIndex, kIndex)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* Initiatives (Doubly Nested) */}
                                                    <div className="pl-4 border-l-2 border-primary/10 ml-1 space-y-2 mt-2">
                                                        {kr.initiatives.map((init, iIndex) => (
                                                            <div key={iIndex} className="flex gap-2 items-center text-xs">
                                                                <input
                                                                    className="flex h-7 flex-1 rounded-md border border-input bg-background px-2"
                                                                    placeholder="Initiative Name"
                                                                    value={init.name}
                                                                    onChange={e => handleUpdateInitiative(oIndex, kIndex, iIndex, 'name', e.target.value)}
                                                                />
                                                                <select
                                                                    className="flex h-7 w-24 rounded-md border border-input bg-background px-2"
                                                                    value={init.ownerId}
                                                                    onChange={e => handleUpdateInitiative(oIndex, kIndex, iIndex, 'ownerId', e.target.value)}
                                                                >
                                                                    <option value="">Owner</option>
                                                                    {users.map(u => (
                                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    className="flex h-7 w-32 rounded-md border border-input bg-background px-2"
                                                                    placeholder="Link"
                                                                    value={init.link}
                                                                    onChange={e => handleUpdateInitiative(oIndex, kIndex, iIndex, 'link', e.target.value)}
                                                                />
                                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveInitiative(oIndex, kIndex, iIndex)}>
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button type="button" variant="link" size="sm" className="h-6 p-0 text-xs text-muted-foreground" onClick={() => handleAddInitiative(oIndex, kIndex)}>
                                                            <Plus className="w-3 h-3 mr-1" /> Add Initiative
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Create Objective</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
