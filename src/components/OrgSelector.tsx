import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from './ui/button';

export function OrgSelector() {
    const { memberships, currentOrg, switchOrganization } = useStore();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSelect = (orgId: string) => {
        switchOrganization(orgId);
        navigate(`/dashboard`);
        setIsOpen(false);
    };

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [containerRef]);

    return (
        <div className="relative" ref={containerRef}>
            <Button
                variant="outline"
                role="combobox"
                className="w-[200px] justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                {currentOrg?.name || "Select Organization"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-[200px] z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    <div className="px-2 py-1.5 text-sm font-semibold">Organizations</div>
                    <div className="h-px bg-muted my-1" />
                    {memberships.map((m) => (
                        <div
                            key={m.orgId}
                            onClick={() => handleSelect(m.orgId)}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                            <span className="flex-1">{m.organization?.name}</span>
                            {currentOrg?.id === m.orgId && <Check className="ml-2 h-4 w-4" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
