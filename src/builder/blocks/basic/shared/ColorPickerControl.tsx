/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';

export interface ColorPickerControlProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
    id?: string;
    className?: string;
}

export const ColorPickerControl: React.FC<ColorPickerControlProps> = ({
    value,
    onChange,
    label,
    placeholder = '#000000',
    id,
    className
}) => {
    return (
        <div className={`flex flex-col gap-2 text-[#333333]`}>
            <label className="text-sm">{label}</label>
            <div className={`flex items-center gap-2 border rounded-lg px-2 ${className}`}>
                <Input
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="rounded-lg"
                    style={{ border: 0 }}
                    placeholder={placeholder}
                />
                <Input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 p-1 rounded-lg"
                    style={{ border: 0 }}
                />
            </div>
        </div>
    );
};
