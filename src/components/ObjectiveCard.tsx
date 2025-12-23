
import type { StrategicObjective } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Target, Briefcase, Layers, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';

interface ObjectiveCardProps {
    objective: StrategicObjective;
    onDrillDown: (id: string) => void;
}

export function ObjectiveCard({ objective, onDrillDown }: ObjectiveCardProps) {
    // Access users from store to resolve IDs
    const users = useStore(state => state.users);

    // Get latest Heartbeat directly from Objective
    const latestHeartbeat = objective.heartbeats && objective.heartbeats.length > 0
        ? objective.heartbeats[objective.heartbeats.length - 1]
        : null;

    const healthColor = {
        'Red': 'bg-red-100 text-red-800 border-red-200',
        'Amber': 'bg-amber-100 text-amber-800 border-amber-200',
        'Green': 'bg-green-100 text-green-800 border-green-200',
    }[objective.currentHealth] || 'bg-gray-100 text-gray-800 border-gray-200';

    // Helper to safely get first Outcome
    const firstOutcome = objective.outcomes && objective.outcomes.length > 0 ? objective.outcomes[0] : null;

    // Resolve Owner Name
    const getOwnerName = (id: string) => {
        const user = users.find(u => u.id === id);
        return user ? user.name : id;
    };

    // Calculate stats
    const totalOutcomes = objective.outcomes?.length || 0;
    const totalInitiatives = objective.outcomes?.reduce((chk, out) =>
        chk + (out.keyResults?.reduce((acc, kr) => acc + (kr.initiatives?.length || 0), 0) || 0), 0
    ) || 0;

    return (
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full overflow-hidden border-t-4"
            style={{ borderTopColor: healthColor.includes('red') ? '#ef4444' : healthColor.includes('amber') ? '#f59e0b' : '#22c55e' }}
            onClick={() => onDrillDown(objective.id)}>
            <CardHeader className="pb-3 pt-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-bold leading-tight tracking-tight text-foreground/90">
                                {objective.name}
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Briefcase className="w-3 h-3" />
                            <span>Owner: {getOwnerName(objective.ownerId)}</span>
                        </div>
                    </div>
                    {objective.riskScore > 50 && (
                        <div className="flex-shrink-0 animate-pulse" title="High Risk">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 pb-4">

                {/* Status Pills */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border-transparent", healthColor)}>
                        Health: {objective.currentHealth}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                        {objective.strategicValue} Value
                    </Badge>
                </div>

                {/* Primary Goal Snippet */}
                {firstOutcome && (
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Layers className="w-3 h-3" />
                            <span>Primary Goal</span>
                        </div>
                        <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground/80">
                            {firstOutcome.goal}
                        </p>
                    </div>
                )}

                {/* Latest Check-in Pulse */}
                <div className="mt-auto pt-2">
                    {latestHeartbeat ? (
                        <div className="relative pl-3 border-l-2 border-primary/20 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <Activity className="w-3 h-3" /> Latest Signal
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(latestHeartbeat.periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <Badge variant={latestHeartbeat.confidence === 'High' ? 'default' : latestHeartbeat.confidence === 'Medium' ? 'secondary' : 'destructive'}
                                        className="text-[10px] h-5 px-1.5 rounded-sm shadow-sm">
                                        {latestHeartbeat.confidence} Conf.
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                                    "{latestHeartbeat.narrative}"
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground italic pl-3 border-l-2 border-dashed border-muted py-1">
                            No signals recorded yet.
                        </div>
                    )}
                </div>

            </CardContent>

            <div className="bg-muted/50 px-6 py-2.5 border-t flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                    {totalInitiatives > 0 && (
                        <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" /> {totalInitiatives} Initiatives
                        </span>
                    )}
                    {totalOutcomes > 1 && (
                        <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" /> +{totalOutcomes - 1} Outcomes
                        </span>
                    )}
                </div>
                <span className="font-mono opacity-80">
                    Due {new Date(objective.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                </span>
            </div>
        </Card>
    );
}
