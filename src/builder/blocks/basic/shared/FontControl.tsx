/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface FontControlProps {
    fontFamily: string;
    fontSize: number;
    onFontFamilyChange: (fontFamily: string) => void;
    onFontSizeChange: (fontSize: number) => void;
    className?: string;
}

const FONT_FAMILIES = [
    { value: 'Arial', label: 'Arial' },
    { value: "'Times New Roman', serif", label: 'Times New Roman' },
    { value: "'Courier New', monospace", label: 'Courier New' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: "'Helvetica Neue', Helvetica, sans-serif", label: 'Helvetica' },
];

export const FontControl: React.FC<FontControlProps> = ({
    fontFamily,
    fontSize,
    onFontFamilyChange,
    onFontSizeChange,
    className,
}) => {
    return (
        <div className={className}>
            <div className="flex gap-3 items-end w-full">
                <div className="flex flex-col gap-2 text-[#333333] w-2/3">
                    <label className="text-sm">
                        {__('Font', 'doublescale')}
                    </label>
                    <Select
                        value={fontFamily}
                        onValueChange={onFontFamilyChange}
                    >
                        <SelectTrigger className="w-full rounded-lg border-border h-10">
                            <SelectValue
                                placeholder={__('Select font', 'doublescale')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {FONT_FAMILIES.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                    {font.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2 text-[#333333] w-1/3">
                    <label className="text-sm">
                        {__('Size', 'doublescale')}
                    </label>
                    <Input
                        type="number"
                        value={fontSize}
                        onChange={(e) => {
                            const value = parseInt(e.target.value) || 8;
                            const clampedValue = Math.min(Math.max(value, 8), 72);
                            onFontSizeChange(clampedValue);
                        }}
                        className="pr-8 h-10"
                        style={{
                            borderColor: '#e5e5e5',
                            borderRadius: '0.5rem',
                        }}
                        min={8}
                        max={72}
                    />
                </div>
            </div>
        </div>
    );
};
