/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
} from 'lucide-react';

/**
 * internal dependencies
 */
import { cn } from '@/lib/utils';

export interface AlignmentControlProps {
    value: 'left' | 'center' | 'right' | 'full';
    onChange: (value: 'left' | 'center' | 'right' | 'full') => void;
    label?: string;
    includeFull?: boolean;
}

export const AlignmentControl: React.FC<AlignmentControlProps> = ({
    value,
    onChange,
    label = __('Alignment on desktop', 'quillcrm'),
    includeFull = false,
}) => {
    return (
        <div className="flex flex-col gap-2 text-[#333333]">
            <label className="text-sm">{label}</label>
            <div className="flex items-center justify-between border rounded-lg">
                <AlignLeft
                    className={cn(
                        'size-12 py-3 px-5 w-full cursor-pointer',
                        value === 'left' &&
                        'bg-[#C6DFF366] border border-primary rounded-l-lg'
                    )}
                    onClick={() => onChange('left')}
                />
                <AlignCenter
                    className={cn(
                        'size-12 py-3 px-5 w-full cursor-pointer',
                        value === 'center' &&
                        'bg-[#C6DFF366] border border-primary'
                    )}
                    onClick={() => onChange('center')}
                />
                <AlignRight
                    className={cn(
                        'size-12 py-3 px-5 w-full cursor-pointer',
                        value === 'right' &&
                        'bg-[#C6DFF366] border border-primary',
                        !includeFull && 'rounded-r-lg'
                    )}
                    onClick={() => onChange('right')}
                />
                {includeFull && (
                    <div
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer flex items-center justify-center',
                            value === 'full' &&
                            'bg-[#C6DFF366] border border-primary rounded-r-lg'
                        )}
                        onClick={() => onChange('full')}
                    >
                        <span className="text-sm font-medium">Full</span>
                    </div>
                )}
            </div>
        </div>
    );
};
