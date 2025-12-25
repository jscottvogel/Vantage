import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check } from 'lucide-react';

export function OrganizationSettings() {
    const { currentOrg: org, updateOrganization } = useStore();
    const [name, setName] = useState(org?.name || '');
    const [isSaved, setIsSaved] = useState(false);

    const planName = org?.subscriptionTier || 'Free';

    // Sync local state when store is populated
    useEffect(() => {
        if (org?.name) {
            setName(org.name);
        }
    }, [org?.name]);

    if (!org) return <div>No Organization Found</div>;

    const handleSave = () => {
        updateOrganization({ name });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>
                <p className="text-muted-foreground">Manage your organization profile and subscription.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Organization Profile</CardTitle>
                    <CardDescription>Update your organization's display name.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Organization Name</label>
                        <div className="flex gap-2">
                            <input
                                id="org-name"
                                name="org-name"
                                className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                            <Button onClick={handleSave}>
                                {isSaved ? <Check className="w-4 h-4 mr-2" /> : null}
                                {isSaved ? 'Saved' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Subscription Plan</CardTitle>
                    <CardDescription>Manage your current plan and billing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border p-4 rounded-lg bg-slate-50">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{planName} Plan</span>
                                {planName === 'Free' && <Badge variant="secondary">Current</Badge>}
                                {planName === 'Pro' && <Badge>Current</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {planName === 'Free'
                                    ? 'Limited to 2 active objectives.'
                                    : 'Unlimited objectives and advanced AI insights.'}
                            </p>
                        </div>
                        {planName === 'Free' ? (
                            <Button onClick={() => updateOrganization({ subscriptionTier: 'Pro' })}>
                                Upgrade to Pro
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => updateOrganization({ subscriptionTier: 'Free' })}>
                                Downgrade to Free
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="opacity-70 pointer-events-none grayscale">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>SSO Configuration</CardTitle>
                        <Badge variant="outline">Enterprise (Coming Soon)</Badge>
                    </div>
                    <CardDescription>Configure SAML/OIDC for your workforce.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Identity Provider</label>
                            <input id="sso-provider" name="sso-provider" disabled className="flex h-10 w-full max-w-sm rounded-md border border-input bg-muted px-3 py-2 text-sm" placeholder="e.g. Okta" />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Metadata URL</label>
                            <input id="sso-url" name="sso-url" disabled className="flex h-10 w-full max-w-sm rounded-md border border-input bg-muted px-3 py-2 text-sm" placeholder="https://..." />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
