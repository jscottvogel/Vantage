import type { Initiative, StatusUpdate } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Clock, TrendingUp, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface InitiativeCardProps {
    initiative: Initiative;
    lastUpdate?: StatusUpdate;
    onDrillDown: (id: string) => void;
}

export function InitiativeCard({ initiative, lastUpdate, onDrillDown }: InitiativeCardProps) {
    const healthColor = {
        'Red': 'bg-red-100 text-red-800 border-red-200',
        'Amber': 'bg-amber-100 text-amber-800 border-amber-200',
        'Green': 'bg-green-100 text-green-800 border-green-200',
    }[initiative.currentHealth];

    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onDrillDown(initiative.id)}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {initiative.name}
                        {initiative.riskScore > 50 && (
                            <Badge variant="destructive" className="ml-2 text-[10px] h-5">Risk: High</Badge>
                        )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Owner: {initiative.ownerId}</p>
                </div>
                <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", healthColor)}>
                    {initiative.currentHealth}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Last Update Snippet */}
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {lastUpdate ? new Date(lastUpdate.timestamp).toLocaleDateString() : 'No updates'}
                            </span>
                            {lastUpdate?.aiCredibilityScore && lastUpdate.aiCredibilityScore < 70 && (
                                <span className="text-xs text-amber-600 flex items-center" title="Low credibility detected by AI">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Low Signal
                                </span>
                            )}
                        </div>
                        <p className="line-clamp-2 text-foreground/90">
                            {lastUpdate?.narrative || "No update provided yet."}
                        </p>
                        {lastUpdate?.aiRiskFlags && lastUpdate.aiRiskFlags.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                                <div className="flex items-center gap-1 text-xs text-orange-600">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>{lastUpdate.aiRiskFlags.length} Risk Signals Detected</span>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto" title="View Evidence">
                                        <HelpCircle className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Target: {new Date(initiative.targetDate).toLocaleDateString()}</span>
                        <span className="flex items-center">
                            {initiative.strategicValue} Value
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
