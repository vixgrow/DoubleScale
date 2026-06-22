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

// Applied only when the field is left empty/invalid — there is no min/max bound
// on what the user can type.
const DEFAULT_FONT_SIZE = 16;

const labelClass = 'text-white';
const triggerClass =
    'h-10 w-full rounded-lg !border-none !ring-0 !ring-offset-0 !text-white shadow-none focus-visible:ring-1 focus-visible:ring-white/30';
const sizeInputClass =
    'h-10 !rounded-lg !border-none !ring-0 !ring-offset-0 !text-white pr-8 shadow-none focus-visible:ring-1 focus-visible:ring-white/30';

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

    // Fall back to the default only when the field is empty or not a number —
    // otherwise honour whatever the user typed (no min/max clamping).
    const commitFontSize = (raw: string) => {
        const parsed = parseInt(raw, 10);
        const next = Number.isNaN(parsed) ? DEFAULT_FONT_SIZE : parsed;
        setFontSizeDraft(String(next));
        if (next !== fontSize) {
            onFontSizeChange(next);
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
                            const raw = e.target.value;
                            setFontSizeDraft(raw);
                            // No min/max: live-apply any number the user types.
                            // The empty/invalid -> default fallback runs on
                            // blur/Enter (see commitFontSize) so the field stays
                            // freely editable while typing.
                            if (raw === '') return;
                            const parsed = parseInt(raw, 10);
                            if (!Number.isNaN(parsed)) {
                                onFontSizeChange(parsed);
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
                        step={1}
                    />
                </div>
            </div>
        </div>
    );
};
