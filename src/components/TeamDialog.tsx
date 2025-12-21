import { useState } from 'react';
import { useStore } from '../store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X } from 'lucide-react';

interface TeamDialogProps {
    onClose: () => void;
}

export function TeamDialog({ onClose }: TeamDialogProps) {
    const users = useStore(state => state.users);
    const inviteUser = useStore(state => state.inviteUser);
    const [email, setEmail] = useState('');

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            inviteUser(email, 'Member');
            setEmail('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </button>
                <CardHeader>
                    <CardTitle>Team Management</CardTitle>
                    <CardDescription>Invite stakeholders to your workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="flex gap-2 mb-6">
                        <input
                            type="email"
                            placeholder="colleague@company.com"
                            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Button type="submit" size="sm">Invite</Button>
                    </form>

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">Current Members</h4>
                        <div className="grid gap-2">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                    <span className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
                                        {user.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
