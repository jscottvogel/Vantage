import type { StrategicObjective, StatusUpdate, KeyResultHeartbeat, ConfidenceTrend } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Target, Briefcase, Layers, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';

interface ObjectiveCardProps {
    objective: StrategicObjective;
    lastUpdate?: StatusUpdate;
    onDrillDown: (id: string) => void;
}

export function ObjectiveCard({ objective, onDrillDown }: ObjectiveCardProps) {
    // Access users from store to resolve IDs
    const users = useStore(state => state.users);

    // Find latest KR Heartbeat
    let latestHeartbeat: KeyResultHeartbeat | null = null;
    if (objective.outcomes) {
        for (const o of objective.outcomes) {
            for (const kr of o.keyResults) {
                if (kr.heartbeats && kr.heartbeats.length > 0) {
                    const last = kr.heartbeats[kr.heartbeats.length - 1];
                    if (!latestHeartbeat || new Date(last.timestamp) > new Date(latestHeartbeat.timestamp)) {
                        latestHeartbeat = last;
                    }
                }
            }
        }
    }

    const trendIcon = (trend: ConfidenceTrend | string) => {
        switch (trend) {
            case 'Improving': return <TrendingUp className="w-3 h-3 text-green-600" />;
            case 'Declining': return <TrendingDown className="w-3 h-3 text-red-600" />;
            default: return <Minus className="w-3 h-3 text-gray-400" />;
        }
    };

    const healthColor = {
        'Red': 'bg-red-100 text-red-800 border-red-200',
        'Amber': 'bg-amber-100 text-amber-800 border-amber-200',
        'Green': 'bg-green-100 text-green-800 border-green-200',
    }[objective.currentHealth];

    // Helper to safely get first Outcome & KR
    const firstOutcome = objective.outcomes.length > 0 ? objective.outcomes[0] : null;
    const firstKR = firstOutcome && firstOutcome.keyResults.length > 0 ? firstOutcome.keyResults[0] : null;

    // Resolve Owner Name
    const getOwnerName = (id: string) => {
        const user = users.find(u => u.id === id);
        return user ? user.name : id;
    };

    // Calculate stats
    const totalOutcomes = objective.outcomes.length;
    const totalInitiatives = objective.outcomes.reduce((chk, out) =>
        chk + out.keyResults.reduce((acc, kr) => acc + kr.initiatives.length, 0), 0
    );

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
                                    <Target className="w-3 h-3" /> Confidence Signal
                                </span>
                                <div className="flex items-center text-xs">
                                    {trendIcon(latestHeartbeat.confidenceTrend)}
                                    <span className="ml-1 text-muted-foreground">{latestHeartbeat.confidenceTrend}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Badge variant={latestHeartbeat.overallConfidence === 'High' ? 'default' : latestHeartbeat.overallConfidence === 'Medium' ? 'secondary' : 'destructive'} className="text-[10px] h-5">
                                    {latestHeartbeat.overallConfidence}
                                </Badge>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                                    "{latestHeartbeat.heartbeatSummary}"
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
                    {/* Last Update Snippet - HIDDEN FOR NOW
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {lastUpdate ? new Date(lastUpdate.timestamp).toLocaleDateString() : 'No updates'}
                            </span>
                        </div>
                        <p className="line-clamp-2 text-foreground/90">
                            {lastUpdate?.narrative || "No update provided yet."}
                        </p>
                    </div>
                    */}

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
