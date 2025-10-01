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
    value: string;
    onChange: (value: string) => void;
    label?: string;
    showCustomInput?: boolean;
    onShapeChange?: (shape: 'rectangle' | 'rounded' | 'circle') => void;
}

export const ShapeSelectorControl: React.FC<ShapeSelectorControlProps> = ({
    value,
    onChange,
    label = __('Shape', 'quillcrm'),
    showCustomInput = true,
    onShapeChange,
}) => {
    const handleShapeClick = (borderRadius: string, shape?: 'rectangle' | 'rounded' | 'circle') => {
        onChange(borderRadius);
        if (onShapeChange && shape) {
            onShapeChange(shape);
        }
    };

    return (
        <div className="flex gap-3 items-end w-full">
            <div className="flex flex-col gap-2 text-[#333333] w-2/3">
                <label className="text-sm">{label}</label>
                <div className="flex items-center justify-between border rounded-lg">
                    <div
                        className={cn(
                            'py-2 px-2 w-full text-center cursor-pointer',
                            value === '0' &&
                            'bg-[#C6DFF366] border border-primary rounded-lg'
                        )}
                        onClick={() => handleShapeClick('0', 'rectangle')}
                    >
                        <div className="bg-accent py-3 px-5"></div>
                    </div>
                    <div
                        className={cn(
                            'py-2 px-2 w-full text-center cursor-pointer',
                            value === '8' &&
                            'bg-[#C6DFF366] border border-primary rounded-lg'
                        )}
                        onClick={() => handleShapeClick('8', 'rounded')}
                    >
                        <div className="bg-accent py-3 px-5 rounded-lg"></div>
                    </div>
                    <div
                        className={cn(
                            'py-2 px-2 w-full text-center cursor-pointer',
                            value === '9999' &&
                            'bg-[#C6DFF366] border border-primary rounded-lg'
                        )}
                        onClick={() => handleShapeClick('9999', 'circle')}
                    >
                        <div className="bg-accent py-3 px-5 rounded-full"></div>
                    </div>
                </div>
            </div>
            {showCustomInput && (
                <div className="w-1/3">
                    <div className="relative flex items-center">
                        <Input
                            type="text"
                            value={value}
                            onChange={(e) => {
                                const inputValue = e.target.value;
                                // Only allow numbers and empty string
                                if (inputValue === '' || /^\d+$/.test(inputValue)) {
                                    // Check if value is within max limit
                                    const numValue = parseInt(inputValue, 10);
                                    if (inputValue === '' || (numValue >= 0 && numValue <= 9999)) {
                                        onChange(inputValue);
                                    }
                                }
                            }}
                            onKeyDown={(e) => {
                                // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
                                if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                                    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                    (e.keyCode === 65 && e.ctrlKey === true) ||
                                    (e.keyCode === 67 && e.ctrlKey === true) ||
                                    (e.keyCode === 86 && e.ctrlKey === true) ||
                                    (e.keyCode === 88 && e.ctrlKey === true)) {
                                    return;
                                }
                                // Ensure that it is a number and stop the keypress
                                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                    e.preventDefault();
                                }
                            }}
                            className="pr-8 h-[43.2px]"
                            style={{
                                borderColor: '#e5e5e5',
                                borderRadius: '0.5rem',
                            }}
                        />
                        <span className="absolute right-3 text-gray-400">px</span>
                    </div>
                </div>
            )}
        </div>
    );
};
