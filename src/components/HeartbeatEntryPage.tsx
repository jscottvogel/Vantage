import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { KeyResultHeartbeatDialog } from './KeyResultHeartbeatDialog';

export function HeartbeatEntryPage() {
    const { type, id } = useParams<{ type: 'kr' | 'initiative'; id: string }>();
    const store = useStore();

    // Find the item
    let title = '';
    let description = '';
    let parentObjectiveId = '';
    let contextId = ''; // KR ID or Initiative ID

    if (type === 'kr') {
        for (const obj of store.objectives) {
            for (const out of obj.outcomes || []) {
                const foundKR = out.keyResults.find(kr => kr.id === id);
                if (foundKR) {
                    title = "Key Result Heartbeat";
                    description = foundKR.description;
                    parentObjectiveId = obj.id;
                    contextId = foundKR.id;
                    break;
                }
            }
        }
    } else if (type === 'initiative') {
        for (const obj of store.objectives) {
            for (const out of obj.outcomes || []) {
                for (const kr of out.keyResults || []) {
                    const foundInit = kr.initiatives.find(i => i.id === id);
                    if (foundInit) {
                        title = "Initiative Heartbeat";
                        description = foundInit.name;
                        parentObjectiveId = obj.id;
                        contextId = foundInit.id;
                        break;
                    }
                }
            }
        }
    }

    if (!contextId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20">
                <Card>
                    <CardHeader className="text-center">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                        <CardTitle>Item Not Found</CardTitle>
                        <CardDescription>Could not find the requested {type === 'kr' ? 'Key Result' : 'Initiative'}.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button onClick={() => window.location.href = '/'}>Go to Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 p-4 md:p-8 flex items-center justify-center">
            {type === 'kr' && (
                <KeyResultHeartbeatDialog
                    objectiveId={parentObjectiveId}
                    keyResultId={contextId}
                    onClose={() => window.location.href = '/'} // Redirect to dash on close
                />
            )}

            {type === 'initiative' && (
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
                    <h2 className="text-xl font-bold mb-4">{title}</h2>
                    <p className="mb-6">{description}</p>
                    <p className="text-muted-foreground italic">Initiative Heartbeat Entry is not yet fully implemented as a standalone component.</p>
                    <Button onClick={() => window.location.href = '/'}>Return to Dashboard</Button>
                </div>
            )}
        </div>
    );
}
