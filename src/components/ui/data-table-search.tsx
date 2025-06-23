import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface DataTableSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function DataTableSearch({ value, onChange, placeholder = "Search..." }: DataTableSearchProps) {
    return (
        <div className="relative w-1/2 max-w-sm">
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="rounded-lg border-[#E4E4E7]"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
    );
}