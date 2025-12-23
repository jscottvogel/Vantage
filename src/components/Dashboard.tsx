import { useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { ObjectiveCard } from './ObjectiveCard';
import { Button } from './ui/button';
import { Plus, Filter, Users, LogOut, Settings } from 'lucide-react';
import { CreateObjectiveDialog } from './CreateObjectiveDialog';
import { TeamDialog } from './TeamDialog';
import { ObjectiveDetailDialog } from './ObjectiveDetailDialog';
import { InitiativeDetailDialog } from './InitiativeDetailDialog';

export function Dashboard() {
    const objectives = useStore(state => state.objectives);
    // updates removed from store
    const logout = useStore(state => state.logout);
    const user = useStore(state => state.currentUser);

    // Modal State
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isTeamOpen, setTeamOpen] = useState(false);

    // Drill Down State
    const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
    const [selectedInitiative, setSelectedInitiative] = useState<{ objId: string, initId: string } | null>(null);

    // Initial onboarding empty state
    if (objectives.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="max-w-lg text-center space-y-6">
                    <h1 className="text-3xl font-bold">Welcome to Vantage, {user?.name}</h1>
                    <p className="text-muted-foreground">
                        You don't have any objectives tracked yet. Define your first strategic objective to start establishing delivery truth.
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                        <Button size="lg" className="w-full" onClick={() => setCreateOpen(true)}>
                            <Plus className="w-5 h-5 mr-2" />
                            Create First Objective
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={logout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
                {isCreateOpen && <CreateObjectiveDialog onClose={() => setCreateOpen(false)} />}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Status Overview</h1>
                    <p className="text-muted-foreground">Monday Morning Readout • {user?.name}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={logout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setTeamOpen(true)}>
                        <Users className="w-4 h-4 mr-2" />
                        Team
                    </Button>
                    <Link to="/admin">
                        <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Objective
                    </Button>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {objectives.map((obj) => (
                    <ObjectiveCard
                        key={obj.id}
                        objective={obj}
                        onDrillDown={(id) => setSelectedObjectiveId(id)}
                    />
                ))}
            </main>

            {isCreateOpen && <CreateObjectiveDialog onClose={() => setCreateOpen(false)} />}
            {isTeamOpen && <TeamDialog onClose={() => setTeamOpen(false)} />}

            {selectedObjectiveId && (
                <ObjectiveDetailDialog
                    objectiveId={selectedObjectiveId}
                    onClose={() => setSelectedObjectiveId(null)}
                    onSelectInitiative={(initId) => setSelectedInitiative({ objId: selectedObjectiveId, initId })}
                />
            )}

            {selectedInitiative && (
                <InitiativeDetailDialog
                    objectiveId={selectedInitiative.objId}
                    initiativeId={selectedInitiative.initId}
                    onClose={() => setSelectedInitiative(null)}
                />
            )}
        </div>
    );
}
