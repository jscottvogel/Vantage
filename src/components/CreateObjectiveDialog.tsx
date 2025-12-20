import { useState } from 'react';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Plus, Trash2, User as UserIcon, Link as LinkIcon, Briefcase } from 'lucide-react';

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

export function CreateObjectiveDialog({ onClose }: CreateObjectiveDialogProps) {
    const [name, setName] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [strategicValue, setStrategicValue] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [goal, setGoal] = useState('');
    const [benefit, setBenefit] = useState('');

    // Complex nested state
    const [keyResults, setKeyResults] = useState<KeyResultForm[]>([
        { description: '', ownerId: '', initiatives: [] }
    ]);

    const currentUser = useStore(state => state.currentUser);
    const createObjective = useStore(state => state.createObjective);
    const objectives = useStore(state => state.objectives);
    const maxActive = useStore(state => state.maxActiveObjectives);
    const users = useStore(state => state.users);

    const activeCount = objectives.filter(i => i.status === 'Active').length;
    const isOverCap = activeCount >= maxActive;

    // KR Handlers
    const handleAddKR = () => {
        setKeyResults([...keyResults, { description: '', ownerId: '', initiatives: [] }]);
    };

    const handleUpdateKR = (index: number, field: keyof KeyResultForm, value: any) => {
        const newKRs = [...keyResults];
        newKRs[index] = { ...newKRs[index], [field]: value };
        setKeyResults(newKRs);
    };

    const handleRemoveKR = (index: number) => {
        const newKRs = keyResults.filter((_, i) => i !== index);
        setKeyResults(newKRs);
    };

    // Initiative Handlers
    const handleAddInitiative = (krIndex: number) => {
        const newKRs = [...keyResults];
        newKRs[krIndex].initiatives.push({ name: '', ownerId: '', link: '' });
        setKeyResults(newKRs);
    };

    const handleUpdateInitiative = (krIndex: number, initIndex: number, field: keyof InitiativeForm, value: string) => {
        const newKRs = [...keyResults];
        newKRs[krIndex].initiatives[initIndex] = {
            ...newKRs[krIndex].initiatives[initIndex],
            [field]: value
        };
        setKeyResults(newKRs);
    };

    const handleRemoveInitiative = (krIndex: number, initIndex: number) => {
        const newKRs = [...keyResults];
        newKRs[krIndex].initiatives = newKRs[krIndex].initiatives.filter((_, i) => i !== initIndex);
        setKeyResults(newKRs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && targetDate && currentUser && goal && benefit) {
            const validKRs = keyResults.filter(kr => kr.description.trim().length > 0);
            createObjective(name, currentUser.id, strategicValue, targetDate, goal, benefit, validKRs);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl relative my-8 max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle>New Strategic Objective</CardTitle>
                    <CardDescription>Define the outcome, key results, and supporting initiatives.</CardDescription>
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
                        <div className="space-y-4 border-b pb-4">
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Goal</label>
                                    <textarea
                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="What are we trying to achieve?"
                                        value={goal}
                                        onChange={e => setGoal(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Benefit</label>
                                    <textarea
                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="Business value?"
                                        value={benefit}
                                        onChange={e => setBenefit(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Key Results Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold tracking-tight">Key Results & Initiatives</h3>
                                <Button type="button" variant="secondary" size="sm" onClick={handleAddKR}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Key Result
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {keyResults.map((kr, index) => (
                                    <div key={index} className="border rounded-lg p-4 bg-muted/20 relative group">
                                        {/* Remove KR Button */}
                                        {keyResults.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveKR(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}

                                        {/* KR Inputs */}
                                        <div className="space-y-3 mb-4 pr-8">
                                            <div className="flex gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">Key Result Description</label>
                                                    <input
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-medium"
                                                        placeholder={`e.g. Reduce Latency by 20%`}
                                                        value={kr.description}
                                                        onChange={e => handleUpdateKR(index, 'description', e.target.value)}
                                                        required={index === 0}
                                                    />
                                                </div>
                                                <div className="w-1/3 space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">Owner</label>
                                                    <div className="relative">
                                                        <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <select
                                                            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 px-3 py-1 text-sm appearance-none"
                                                            value={kr.ownerId}
                                                            onChange={e => handleUpdateKR(index, 'ownerId', e.target.value)}
                                                        >
                                                            <option value="">Select Owner</option>
                                                            {users.map(u => (
                                                                <option key={u.id} value={u.id}>{u.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Initiatives Sub-Section */}
                                        <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Supporting Initiatives</span>
                                                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => handleAddInitiative(index)}>
                                                    <Plus className="w-3 h-3 mr-1" /> Add Initiative
                                                </Button>
                                            </div>

                                            {kr.initiatives.map((init, iIndex) => (
                                                <div key={iIndex} className="flex gap-2 items-center text-sm">
                                                    <input
                                                        className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                                                        placeholder="Initiative Name"
                                                        value={init.name}
                                                        onChange={e => handleUpdateInitiative(index, iIndex, 'name', e.target.value)}
                                                    />
                                                    <select
                                                        className="flex h-8 w-32 rounded-md border border-input bg-background px-2 text-xs"
                                                        value={init.ownerId}
                                                        onChange={e => handleUpdateInitiative(index, iIndex, 'ownerId', e.target.value)}
                                                    >
                                                        <option value="">Owner</option>
                                                        {users.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="relative w-32">
                                                        <LinkIcon className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-background pl-6 px-2 text-xs"
                                                            placeholder="Link URL"
                                                            value={init.link}
                                                            onChange={e => handleUpdateInitiative(index, iIndex, 'link', e.target.value)}
                                                        />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveInitiative(index, iIndex)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Date</label>
                                <input
                                    type="date"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={targetDate}
                                    onChange={e => setTargetDate(e.target.value)}
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

                        <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Create Objective</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
