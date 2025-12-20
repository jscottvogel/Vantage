import { useState } from 'react';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

interface CreateObjectiveDialogProps {
    onClose: () => void;
}

export function CreateObjectiveDialog({ onClose }: CreateObjectiveDialogProps) {
    const [name, setName] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [strategicValue, setStrategicValue] = useState<'High' | 'Medium' | 'Low'>('Medium');

    // New Fields
    const [goal, setGoal] = useState('');
    const [benefit, setBenefit] = useState('');
    const [keyResults, setKeyResults] = useState<string[]>(['']);

    const currentUser = useStore(state => state.currentUser);
    const createObjective = useStore(state => state.createObjective);
    const objectives = useStore(state => state.objectives);
    const maxActive = useStore(state => state.maxActiveObjectives);

    const activeCount = objectives.filter(i => i.status === 'Active').length;
    const isOverCap = activeCount >= maxActive;

    const handleAddKR = () => {
        setKeyResults([...keyResults, '']);
    };

    const handleUpdateKR = (index: number, value: string) => {
        const newKRs = [...keyResults];
        newKRs[index] = value;
        setKeyResults(newKRs);
    };

    const handleRemoveKR = (index: number) => {
        const newKRs = keyResults.filter((_, i) => i !== index);
        setKeyResults(newKRs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && targetDate && currentUser && goal && benefit) {
            const validKRs = keyResults.filter(kr => kr.trim().length > 0);
            createObjective(name, currentUser.id, strategicValue, targetDate, goal, benefit, validKRs);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-lg relative my-8">
                <CardHeader>
                    <CardTitle>New Strategic Objective</CardTitle>
                    <CardDescription>Define the outcome, rationale, and key results.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isOverCap && (
                        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-4 text-amber-800 text-sm flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                            <div>
                                <strong>Soft Cap Reached:</strong> You have {activeCount} active objectives (Plan limit: {maxActive}).
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <label className="text-sm font-medium">Goal (The 'What')</label>
                            <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="What are we trying to achieve?"
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Benefit (The 'Why')</label>
                            <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="What is the business value?"
                                value={benefit}
                                onChange={e => setBenefit(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex justify-between items-center">
                                Key Results (The 'How')
                                <Button type="button" variant="ghost" size="sm" onClick={handleAddKR} className="h-6">
                                    <Plus className="w-3 h-3 mr-1" /> Add KR
                                </Button>
                            </label>
                            <div className="space-y-2">
                                {keyResults.map((kr, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                            placeholder={`KR #${index + 1}`}
                                            value={kr}
                                            onChange={e => handleUpdateKR(index, e.target.value)}
                                            // Make first one required
                                            required={index === 0}
                                        />
                                        {keyResults.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveKR(index)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
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
