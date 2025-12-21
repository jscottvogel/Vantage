import { useState } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { X, Target, Briefcase, Layers, ArrowRight, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from './ui/button';
import { KeyResultHeartbeatDialog } from './KeyResultHeartbeatDialog';
import type { KeyResultHeartbeat } from '../types';

interface ObjectiveDetailDialogProps {
    objectiveId: string;
    onClose: () => void;
    onSelectInitiative: (initiativeId: string) => void;
}

export function ObjectiveDetailDialog({ objectiveId, onClose, onSelectInitiative }: ObjectiveDetailDialogProps) {
    const store = useStore();
    const objective = store.objectives.find(o => o.id === objectiveId);

    const [selectedKR, setSelectedKR] = useState<{ krId: string } | null>(null);

    if (!objective) return null;

    const getLatestHeartbeat = (heartbeats: KeyResultHeartbeat[]) => {
        if (!heartbeats || heartbeats.length === 0) return null;
        return heartbeats[heartbeats.length - 1];
    };

    const trendIcon = (trend: string) => {
        switch (trend) {
            case 'Improving': return <TrendingUp className="w-3 h-3 text-green-600" />;
            case 'Declining': return <TrendingDown className="w-3 h-3 text-red-600" />;
            default: return <Minus className="w-3 h-3 text-gray-400" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl relative max-h-[90vh] overflow-hidden flex flex-col">
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
                    <X className="w-5 h-5" />
                </button>

                <CardHeader className="flex-shrink-0 border-b bg-muted/20">
                    <CardTitle className="text-2xl">{objective.name}</CardTitle>
                    <CardDescription>
                        Target: {new Date(objective.targetDate).toLocaleDateString()} • {objective.strategicValue} Value
                    </CardDescription>
                </CardHeader>

                <CardContent className="overflow-y-auto p-6 space-y-8">
                    {objective.outcomes.map((outcome, oIdx) => (
                        <div key={outcome.id} className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                                <Layers className="w-5 h-5" />
                                <h3>Outcome {oIdx + 1}: {outcome.goal}</h3>
                            </div>
                            <div className="pl-6 text-sm text-muted-foreground mb-2">
                                Benefit: {outcome.benefit}
                            </div>

                            <div className="pl-6 grid gap-4">
                                {outcome.keyResults.map((kr) => {
                                    const latestHB = getLatestHeartbeat(kr.heartbeats);
                                    return (
                                        <div key={kr.id} className="border rounded-md p-4 bg-background shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-start gap-2">
                                                    <Target className="w-4 h-4 mt-1 text-blue-500" />
                                                    <div>
                                                        <div className="font-medium">{kr.description}</div>
                                                        <div className="text-xs text-muted-foreground">Owner: {store.users.find(u => u.id === kr.ownerId)?.name || kr.ownerId}</div>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedKR({ krId: kr.id })}>
                                                    <Activity className="w-3 h-3 mr-1" />
                                                    Update Confidence
                                                </Button>
                                            </div>

                                            {/* KR Heartbeat Summary */}
                                            {latestHB && (
                                                <div className="ml-6 mb-4 p-3 bg-slate-50 border rounded-md text-sm space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={latestHB.overallConfidence === 'High' ? 'default' : latestHB.overallConfidence === 'Medium' ? 'secondary' : 'destructive'} className="rounded-sm">
                                                            Confidence: {latestHB.overallConfidence}
                                                        </Badge>
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            {trendIcon(latestHB.confidenceTrend)}
                                                            <span className="ml-1">{latestHB.confidenceTrend}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground border-l pl-2">
                                                            {new Date(latestHB.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted-foreground italic text-xs">"{latestHB.heartbeatSummary}"</p>
                                                    {latestHB.confidenceDrivers.length > 0 && (
                                                        <div className="text-xs flex gap-1 flex-wrap">
                                                            <span className="font-semibold text-green-700">Drivers:</span>
                                                            {latestHB.confidenceDrivers.slice(0, 2).map((d, i) => (
                                                                <span key={i} className="bg-green-50 text-green-700 px-1 py-0.5 rounded border border-green-100">{d}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Initiatives List */}
                                            <div className="ml-6 space-y-2">
                                                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                                    <Briefcase className="w-3 h-3" /> Supporting Initiatives
                                                </div>
                                                {kr.initiatives.length === 0 ? (
                                                    <div className="text-sm text-muted-foreground italic">No initiatives defined.</div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {kr.initiatives.map((init) => (
                                                            <div key={init.id}
                                                                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer transition-colors group"
                                                                onClick={() => onSelectInitiative(init.id)}
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="font-medium text-sm">{init.name}</div>
                                                                    <div className="flex gap-2">
                                                                        <Badge variant="outline" className="text-[10px] h-5">{init.status}</Badge>
                                                                        {init.heartbeats.length > 0 && (
                                                                            <Badge variant="secondary" className="text-[10px] h-5">
                                                                                {init.heartbeats.length} Signals
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </CardContent>

                {selectedKR && (
                    <KeyResultHeartbeatDialog
                        objectiveId={objectiveId}
                        keyResultId={selectedKR.krId}
                        onClose={() => setSelectedKR(null)}
                    />
                )}
            </Card>
        </div>
    );
}
