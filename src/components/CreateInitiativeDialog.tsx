import { useState } from 'react';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle } from 'lucide-react';

interface CreateInitiativeDialogProps {
    onClose: () => void;
}

export function CreateInitiativeDialog({ onClose }: CreateInitiativeDialogProps) {
    const [name, setName] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [strategicValue, setStrategicValue] = useState<'High' | 'Medium' | 'Low'>('Medium');

    const currentUser = useStore(state => state.currentUser);
    const createInitiative = useStore(state => state.createInitiative);
    const initiatives = useStore(state => state.initiatives);
    const maxActive = useStore(state => state.maxActiveInitiatives);

    const activeCount = initiatives.filter(i => i.status === 'Active').length;
    const isOverCap = activeCount >= maxActive;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && targetDate && currentUser) {
            createInitiative(name, currentUser.id, strategicValue, targetDate);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md relative">
                <CardHeader>
                    <CardTitle>New Initiative</CardTitle>
                    <CardDescription>Track a new delivery object.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isOverCap && (
                        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-4 text-amber-800 text-sm flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                            <div>
                                <strong>Soft Cap Reached:</strong> You have {activeCount} active initiatives (Plan limit: {maxActive}).
                                You can still create this, but please consider upgrading or archiving old items properly.
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Initiative Name</label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="e.g. Cloud Migration Phase 2"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                            <Button type="submit">Create Initiative</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
