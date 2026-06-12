/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useEffect, useState } from 'react';
/**
 * internal dependencies
 */
import { cn } from '@/lib/utils';
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
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: "'Times New Roman', serif", label: 'Times New Roman' },
    { value: "'Courier New', monospace", label: 'Courier New' },
    { value: 'Georgia, serif', label: 'Georgia' },
    {
        value: "'Helvetica Neue', Helvetica, sans-serif",
        label: 'Helvetica',
    },
];

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;

const labelClass = 'text-white';
const triggerClass =
    'h-10 w-full rounded-lg !border-none !ring-0 !ring-offset-0 !text-white shadow-none focus-visible:ring-1 focus-visible:ring-white/30';
const sizeInputClass =
    'h-10 !rounded-lg !border-none !ring-0 !ring-offset-0 !text-white pr-8 shadow-none focus-visible:ring-1 focus-visible:ring-white/30';

const clampFontSize = (value: number) =>
    Math.min(Math.max(value, MIN_FONT_SIZE), MAX_FONT_SIZE);

export const FontControl: React.FC<FontControlProps> = ({
    fontFamily,
    fontSize,
    onFontFamilyChange,
    onFontSizeChange,
    className,
}) => {
    const [fontSizeDraft, setFontSizeDraft] = useState(String(fontSize));

    useEffect(() => {
        setFontSizeDraft(String(fontSize));
    }, [fontSize]);

    const commitFontSize = (raw: string) => {
        const parsed = parseInt(raw, 10);
        if (Number.isNaN(parsed)) {
            setFontSizeDraft(String(fontSize));
            return;
        }

        const clampedValue = clampFontSize(parsed);
        setFontSizeDraft(String(clampedValue));
        if (clampedValue !== fontSize) {
            onFontSizeChange(clampedValue);
        }
    };

    const fontList =
        !fontFamily || FONT_FAMILIES.some((f) => f.value === fontFamily)
            ? FONT_FAMILIES
            : [...FONT_FAMILIES, { value: fontFamily, label: fontFamily }];

    return (
        <div className={className}>
            <div className="flex flex-col gap-4">
                <div className={cn('flex w-full flex-col gap-2', labelClass)}>
                    <label className="text-sm">
                        {__('Font Family', 'doublescale')}
                    </label>
                    <Select value={fontFamily} onValueChange={onFontFamilyChange}>
                        <SelectTrigger className={triggerClass} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <SelectValue
                                placeholder={__('Select', 'doublescale')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {fontList.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                    {font.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className={cn('flex w-full flex-col gap-2', labelClass)}>
                    <label className="text-sm">
                        {__('Font Size', 'doublescale')}
                    </label>
                    <Input
                        type="number"
                        value={fontSizeDraft}
                        onChange={(e) => {
                            setFontSizeDraft(e.target.value);
                            if (
                                e.target.value !== '' &&
                                e.target.validity.valid
                            ) {
                                commitFontSize(e.target.value);
                            }
                        }}
                        onBlur={() => commitFontSize(fontSizeDraft)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                commitFontSize(fontSizeDraft);
                                e.currentTarget.blur();
                            }
                        }}
                        className={sizeInputClass}
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        min={MIN_FONT_SIZE}
                        max={MAX_FONT_SIZE}
                        step={1}
                    />
                </div>
            </div>
        </div>
    );
};
