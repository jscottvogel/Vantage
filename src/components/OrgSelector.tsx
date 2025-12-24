import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, Check, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function OrgSelector() {
    const { memberships, currentOrg } = useStore();
    const navigate = useNavigate();

    const handleSelect = (orgSlug: string) => {
        navigate(`/org/${orgSlug}/dashboard`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" role="combobox" className="w-[200px] justify-between">
                    {currentOrg?.name || "Select Organization"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                {memberships.map((m) => (
                    <DropdownMenuItem
                        key={m.orgId}
                        onSelect={() => m.organization && handleSelect(m.organization.slug)}
                        className="flex justify-between"
                    >
                        {m.organization?.name}
                        {currentOrg?.id === m.orgId && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
