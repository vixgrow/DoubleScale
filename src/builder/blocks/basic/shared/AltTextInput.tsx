/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';

export interface AltTextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const AltTextInput: React.FC<AltTextInputProps> = ({
    value,
    onChange,
    placeholder = "Describe the image",
    className = 'h-10 !text-white !border-none !ring-0 !ring-offset-0 !rounded-lg',
    style = {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
}) => {
    return (
        <div className="flex flex-col gap-2 text-white">
            <label className="text-sm">{__('Alt Text', 'doublescale')}</label>
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={className}
                style={style}
                placeholder={placeholder}
            />
        </div>
    );
};
