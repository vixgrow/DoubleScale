/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import {
    PaddingBottomIcon,
    PaddingLeftIcon,
    PaddingRightIcon,
    PaddingTopIcon,
} from '@doublescale/components';
import { Input } from '@/components/ui/input';

export interface PaddingValue {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface PaddingControlProps {
    value: PaddingValue;
    onChange: (value: PaddingValue) => void;
    label?: string;
}

export const PaddingControl: React.FC<PaddingControlProps> = ({
    value,
    onChange,
    label = __('Padding', 'doublescale'),
}) => {
    const handlePaddingChange = (
        direction: keyof PaddingValue,
        newValue: number
    ) => {
        // Apply min/max constraints based on direction
        let constrainedValue = newValue;

        if (direction === 'left' || direction === 'right') {
            // Left and right: min 0, max 120
            constrainedValue = Math.max(0, Math.min(120, newValue));
        } else if (direction === 'top' || direction === 'bottom') {
            // Top and bottom: min 0, max 240
            constrainedValue = Math.max(0, Math.min(240, newValue));
        }

        onChange({
            ...value,
            [direction]: constrainedValue,
        });
    };

    return (
        <div>
            <label className="text-sm text-[#333333] mb-2 block">
                {label}
            </label>
            <div className="grid grid-cols-2 gap-2">
                <div className="relative flex items-center">
                    <div className="absolute left-2 text-[#333333]">
                        <PaddingLeftIcon />
                    </div>
                    <Input
                        type="number"
                        min="0"
                        max="120"
                        value={value.left || 0}
                        onChange={(e) =>
                            handlePaddingChange('left', parseInt(e.target.value) || 0)
                        }
                        className="h-10"
                        style={{
                            borderColor: '#e5e5e5',
                            borderRadius: '0.5rem',
                            paddingLeft: '32px',
                        }}
                    />
                </div>
                <div className="relative flex items-center">
                    <div className="absolute left-2 text-[#333333]">
                        <PaddingRightIcon />
                    </div>
                    <Input
                        type="number"
                        min="0"
                        max="120"
                        value={value.right || 0}
                        onChange={(e) =>
                            handlePaddingChange('right', parseInt(e.target.value) || 0)
                        }
                        className="h-10"
                        style={{
                            borderColor: '#e5e5e5',
                            borderRadius: '0.5rem',
                            paddingLeft: '32px',
                        }}
                    />
                </div>
                <div className="relative flex items-center">
                    <div className="absolute left-2 text-[#333333]">
                        <PaddingTopIcon />
                    </div>
                    <Input
                        type="number"
                        min="0"
                        max="240"
                        value={value.top || 0}
                        onChange={(e) =>
                            handlePaddingChange('top', parseInt(e.target.value) || 0)
                        }
                        className="h-10"
                        style={{
                            borderColor: '#e5e5e5',
                            borderRadius: '0.5rem',
                            paddingLeft: '32px',
                        }}
                    />
                </div>
                <div className="relative flex items-center">
                    <div className="absolute left-2 text-[#333333]">
                        <PaddingBottomIcon />
                    </div>
                    <Input
                        type="number"
                        min="0"
                        max="240"
                        value={value.bottom || 0}
                        onChange={(e) =>
                            handlePaddingChange('bottom', parseInt(e.target.value) || 0)
                        }
                        className="h-10"
                        style={{
                            borderColor: '#e5e5e5',
                            borderRadius: '0.5rem',
                            paddingLeft: '32px',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
