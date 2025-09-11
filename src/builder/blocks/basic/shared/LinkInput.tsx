/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ExternalLinkIcon } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';

export interface LinkInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const LinkInput: React.FC<LinkInputProps> = ({
    label,
    value,
    onChange,
    placeholder = "https://example.com",
    className = 'h-10',
    style = {
        borderColor: '#e5e5e5',
        borderRadius: '0.5rem',
    },
}) => {
    return (
        <div className="flex flex-col gap-2 text-[#333333]">
            <div className="flex items-center justify-between">
                <label className="text-sm">{label}</label>
                <ExternalLinkIcon className="size-5" />
            </div>
            <Input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={className}
                style={style}
                placeholder={placeholder}
            />
        </div>
    );
};
