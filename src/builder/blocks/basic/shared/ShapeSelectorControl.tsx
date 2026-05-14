/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface ShapeSelectorControlProps {
    value: string | number;
    onChange: (value: string) => void;
    label?: string;
    showLabel?: boolean;
    showCustomInput?: boolean;
    onShapeChange?: (shape: 'rectangle' | 'rounded' | 'circle') => void;
    className?: string;
}

const PRESET_SQUARE = '0';
const PRESET_ROUNDED = '8';
const PRESET_PILL = '9999';

function toNumeric(value: string | number): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (value === '') {
        return 0;
    }
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? 0 : n;
}

function displayString(value: string | number): string {
    if (typeof value === 'number') {
        return String(value);
    }
    return value;
}

export const ShapeSelectorControl: React.FC<ShapeSelectorControlProps> = ({
    value,
    onChange,
    label = __('Shape', 'doublescale'),
    showLabel = true,
    showCustomInput = true,
    onShapeChange,
    className,
}) => {
    const n = toNumeric(value);

    const handleShapeClick = (
        borderRadius: string,
        shape?: 'rectangle' | 'rounded' | 'circle'
    ) => {
        onChange(borderRadius);
        if (onShapeChange && shape) {
            onShapeChange(shape);
        }
    };

    const isSquare = n === 0;
    const isRoundedPreset = n === 8;
    const isPillPreset = n === 9999;

    return (
        <div className={cn('flex w-full items-end gap-3', className)}>
            <div className="flex min-w-0 flex-1 flex-col gap-2 text-white">
                {showLabel ? <label className="text-sm text-white">{label}</label> : null}
                <div className="flex flex-1 items-center justify-between rounded-lg h-10" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <button
                        type="button"
                        className={cn(
                            'flex flex-1 cursor-pointer items-center justify-center rounded-md border border-transparent px-2 py-2 h-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                            isSquare ? 'border-white' : 'hover:bg-white/10'
                        )}
                        onClick={() => handleShapeClick(PRESET_SQUARE, 'rectangle')}
                        aria-label={__('Square corners', 'doublescale')}
                    >
                        <span className="h-4 w-8 shrink-0 bg-white" />
                    </button>
                    <button
                        type="button"
                        className={cn(
                            'flex flex-1 cursor-pointer items-center justify-center rounded-md border border-transparent px-2 py-2 h-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                            isRoundedPreset ? 'border-white' : 'hover:bg-white/10'
                        )}
                        onClick={() => handleShapeClick(PRESET_ROUNDED, 'rounded')}
                        aria-label={__('Rounded corners', 'doublescale')}
                    >
                        <span className="h-4 w-8 shrink-0 rounded-md bg-white" />
                    </button>
                    <button
                        type="button"
                        className={cn(
                            'flex flex-1 cursor-pointer items-center justify-center rounded-md border border-transparent px-2 py-2 h-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                            isPillPreset ? 'border-white' : 'hover:bg-white/10'
                        )}
                        onClick={() => handleShapeClick(PRESET_PILL, 'circle')}
                        aria-label={__('Pill shape', 'doublescale')}
                    >
                        <span className="h-4 w-10 shrink-0 rounded-full bg-white" />
                    </button>
                </div>
            </div>
            {showCustomInput ? (
                <div className="relative w-[100px] shrink-0">
                    <div className="relative flex items-center rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <Input
                            type="text"
                            inputMode="numeric"
                            value={displayString(value)}
                            onChange={(e) => {
                                const inputValue = e.target.value;
                                if (inputValue === '' || /^\d+$/.test(inputValue)) {
                                    const numValue = parseInt(inputValue, 10);
                                    if (
                                        inputValue === '' ||
                                        (numValue >= 0 && numValue <= 9999)
                                    ) {
                                        onChange(inputValue);
                                    }
                                }
                            }}
                            onKeyDown={(e) => {
                                if (
                                    [8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(
                                        e.keyCode
                                    ) !== -1 ||
                                    (e.keyCode === 65 && e.ctrlKey === true) ||
                                    (e.keyCode === 67 && e.ctrlKey === true) ||
                                    (e.keyCode === 86 && e.ctrlKey === true) ||
                                    (e.keyCode === 88 && e.ctrlKey === true)
                                ) {
                                    return;
                                }
                                if (
                                    (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
                                    (e.keyCode < 96 || e.keyCode > 105)
                                ) {
                                    e.preventDefault();
                                }
                            }}
                            className="h-10 !rounded-lg !border-none !ring-0 !ring-offset-0 !bg-transparent pr-9 !text-white shadow-none focus-visible:ring-1 focus-visible:ring-white/30"
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            px
                        </span>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
