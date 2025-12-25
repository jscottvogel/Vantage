import { useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { ObjectiveCard } from './ObjectiveCard';
import { Button } from './ui/button';
import { Plus, Filter, Users, LogOut, Settings, AlertTriangle } from 'lucide-react';
import { CreateObjectiveDialog } from './CreateObjectiveDialog';
import { TeamDialog } from './TeamDialog';
import { ObjectiveDetailDialog } from './ObjectiveDetailDialog';
import { InitiativeDetailDialog } from './InitiativeDetailDialog';
import { OrgSelector } from './OrgSelector';

export function Dashboard() {
    const objectives = useStore(state => state.objectives);
    const logout = useStore(state => state.logout);
    const user = useStore(state => state.userProfile);

    // Modal State
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isTeamOpen, setTeamOpen] = useState(false);

    // Drill Down State
    const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
    const [selectedInitiative, setSelectedInitiative] = useState<{ objId: string, initId: string } | null>(null);



    // Derived Stats
    const totalObjectives = objectives.length;
    const criticalRisks = objectives.filter(o => o.riskScore > 75 || o.currentHealth === 'Red').length;
    const onTrack = objectives.filter(o => o.currentHealth === 'Green').length;
    const needsAttention = objectives.filter(o => o.currentHealth === 'Amber').length;

    return (
        <div className="min-h-screen bg-background p-6 lg:p-10 space-y-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
                <div className="space-y-1 flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Strategic Dashboard</h1>
                        <p className="text-muted-foreground text-sm">Overview for {user?.displayName} • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <OrgSelector />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                    <div className="h-6 w-px bg-border mx-2 hidden md:block" />
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
                    <Button variant="secondary" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button size="sm" onClick={() => setCreateOpen(true)} className="shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Objective
                    </Button>
                </div>
            </header>

            {/* Summary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Total Objectives</span>
                    <span className="text-2xl font-bold">{totalObjectives}</span>
                </div>
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2">
                    <span className="text-sm font-medium text-green-700">On Track</span>
                    <span className="text-2xl font-bold text-green-800">{onTrack}</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2">
                    <span className="text-sm font-medium text-amber-700">Needs Attention</span>
                    <span className="text-2xl font-bold text-amber-800">{needsAttention}</span>
                </div>
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2">
                    <span className="text-sm font-medium text-red-700">Critical / At Risk</span>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-800">{criticalRisks}</span>
                        {criticalRisks > 0 && <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />}
                    </div>
                </div>
            </div>

            <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {objectives.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-6 border-2 border-dashed rounded-xl bg-muted/20">
                        <div className="max-w-lg space-y-4">
                            <h2 className="text-2xl font-bold">Welcome to Vantage, {user?.displayName}</h2>
                            <p className="text-muted-foreground">
                                You don't have any objectives tracked yet. Define your first strategic objective to start establishing delivery truth.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button size="lg" onClick={() => setCreateOpen(true)}>
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create First Objective
                                </Button>
                                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => useStore.getState().resetData()}>
                                    Start Over (Reset All Data)
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    objectives.map((obj) => (
                        <ObjectiveCard
                            key={obj.id}
                            objective={obj}
                            onDrillDown={(id) => setSelectedObjectiveId(id)}
                        />
                    ))
                )}
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
