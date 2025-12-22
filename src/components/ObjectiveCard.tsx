
import type { StrategicObjective } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Target, Briefcase, Layers, Minus } from 'lucide-react';
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

    // Helper to safely get first Outcome & KR
    const firstOutcome = objective.outcomes && objective.outcomes.length > 0 ? objective.outcomes[0] : null;
    const firstKR = firstOutcome && firstOutcome.keyResults && firstOutcome.keyResults.length > 0 ? firstOutcome.keyResults[0] : null;

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
        <Card className="hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full" onClick={() => onDrillDown(objective.id)}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {objective.name}
                        {objective.riskScore > 50 && (
                            <Badge variant="destructive" className="ml-2 text-[10px] h-5">Risk: High</Badge>
                        )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Owner: {objective.ownerId}</p>
                </div>
                <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", healthColor)}>
                    {objective.currentHealth}
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">

                {/* Goal Preview (from First Outcome) */}
                <div className="text-sm space-y-2">
                    {firstOutcome && (
                        <div>
                            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1">
                                <Layers className="w-3 h-3" /> Outcome Goal
                            </span>
                            <p className="text-foreground/90 line-clamp-1">{firstOutcome.goal}</p>
                        </div>
                    )}

                    {firstKR && (
                        <div>
                            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Key Result</span>
                            <div className="flex flex-col">
                                <p className="text-foreground/90 line-clamp-1 flex items-center">
                                    <Target className="w-3 h-3 mr-1 text-primary" />
                                    {firstKR.description}
                                </p>
                                {firstKR.ownerId && (
                                    <p className="text-xs text-muted-foreground ml-4">
                                        Owner: {getOwnerName(firstKR.ownerId)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Latest Confidence Signal */}
                    {latestHeartbeat && (
                        <div className="bg-slate-50 border rounded-md p-2 mt-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                    <Target className="w-3 h-3" /> Latest Signal
                                </span>
                                <div className="flex items-center text-xs">
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Badge variant={latestHeartbeat.confidence === 'High' ? 'default' : latestHeartbeat.confidence === 'Medium' ? 'secondary' : 'destructive'} className="text-[10px] h-5">
                                    {latestHeartbeat.confidence || 'N/A'}
                                </Badge>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                                    "{latestHeartbeat.narrative}"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Counts Badge */}
                    <div className="flex gap-2 mt-2">
                        {totalOutcomes > 1 && (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                                +{totalOutcomes - 1} More Outcomes
                            </Badge>
                        )}
                        {totalInitiatives > 0 && (
                            <div className="text-xs text-muted-foreground flex items-center">
                                <Briefcase className="w-3 h-3 mr-1" />
                                {totalInitiatives} Initiative{totalInitiatives !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1" />

                <div className="space-y-4 pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Target: {new Date(objective.targetDate).toLocaleDateString()}</span>
                        <span className="flex items-center">
                            {objective.strategicValue} Value
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
