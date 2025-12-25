import { useState } from 'react';
import { useStore } from '../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Mail, Shield } from 'lucide-react';

export function UserManagement() {
    const { users, currentUser, inviteUser, updateUserRole, removeUser } = useStore();
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'Admin' | 'Member'>('Member');

    const handleInvite = () => {
        if (!inviteEmail.trim()) return;
        inviteUser(inviteEmail, inviteRole);
        setIsInviting(false);
        setInviteEmail('');
        setInviteRole('Member');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                <p className="text-muted-foreground">Manage access and roles for your organization.</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>Manage who has access to this workspace.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setIsInviting(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Invite User
                    </Button>
                </CardHeader>
                <CardContent>
                    {isInviting && (
                        <div className="mb-6 p-4 border rounded-lg bg-muted/20 space-y-4">
                            <h4 className="font-semibold text-sm">Invite New User</h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    id="invite-email"
                                    name="invite-email"
                                    autoFocus
                                    className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="email@company.com"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                />
                                <select
                                    id="invite-role"
                                    name="invite-role"
                                    className="flex h-10 w-full sm:w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value as 'Admin' | 'Member')}
                                >
                                    <option value="Member">Member</option>
                                    <option value="Admin">Admin</option>
                                </select>
                                <div className="flex gap-2">
                                    <Button onClick={handleInvite}>Send Invite</Button>
                                    <Button variant="ghost" onClick={() => setIsInviting(false)}>Cancel</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {users.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {user.name}
                                            {user.id === currentUser?.id && <Badge variant="secondary" className="text-[10px] h-5">You</Badge>}
                                            {user.status === 'Invited' && <Badge variant="outline" className="text-[10px] h-5">Pending</Badge>}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Mail className="w-3 h-3" /> {user.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end gap-1">
                                        {user.id === currentUser?.id ? (
                                            <span className="text-sm font-medium px-2 py-1 bg-muted rounded flex items-center gap-1">
                                                <Shield className="w-3 h-3" /> {user.role}
                                            </span>
                                        ) : (
                                            <select
                                                className="text-sm bg-transparent border-none font-medium text-right focus:ring-0 cursor-pointer hover:text-primary"
                                                value={user.role}
                                                onChange={(e) => updateUserRole(user.id, e.target.value as 'Admin' | 'Member')}
                                            >
                                                <option value="Member">Member</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        )}
                                    </div>

                                    {user.id !== currentUser?.id && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeUser(user.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
