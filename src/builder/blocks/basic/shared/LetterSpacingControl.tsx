/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface LetterSpacingControlProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const LETTER_SPACING_OPTIONS = [
    { value: '-1px', label: '-1px' },
    { value: '0px', label: 'Normal' },
    { value: '1px', label: '1px' },
    { value: '2px', label: '2px' },
    { value: '3px', label: '3px' },
    { value: '4px', label: '4px' },
    { value: '5px', label: '5px' },
    { value: '6px', label: '6px' },
    { value: '7px', label: '7px' },
    { value: '8px', label: '8px' },
    { value: '9px', label: '9px' },
    { value: '10px', label: '10px' },
    { value: '11px', label: '11px' },
    { value: '12px', label: '12px' },
    { value: '13px', label: '13px' },
    { value: '14px', label: '14px' },
    { value: '15px', label: '15px' },
    { value: '16px', label: '16px' },
    { value: '17px', label: '17px' },
    { value: '18px', label: '18px' },
    { value: '19px', label: '19px' },
    { value: '20px', label: '20px' },
    { value: '21px', label: '21px' },
    { value: '22px', label: '22px' },
    { value: '23px', label: '23px' },
    { value: '24px', label: '24px' },
    { value: '25px', label: '25px' },
    { value: '26px', label: '26px' },
    { value: '27px', label: '27px' },
    { value: '28px', label: '28px' },
    { value: '29px', label: '29px' },
    { value: '30px', label: '30px' },
    { value: '31px', label: '31px' },
    { value: '32px', label: '32px' },
    { value: '33px', label: '33px' },
    { value: '34px', label: '34px' },
    { value: '35px', label: '35px' },
    { value: '36px', label: '36px' },
    { value: '37px', label: '37px' },
    { value: '38px', label: '38px' },
    { value: '39px', label: '39px' },
    { value: '40px', label: '40px' },
    { value: '41px', label: '41px' },
    { value: '42px', label: '42px' },
    { value: '43px', label: '43px' },
    { value: '44px', label: '44px' },
    { value: '45px', label: '45px' },
    { value: '46px', label: '46px' },
];

export const LetterSpacingControl: React.FC<LetterSpacingControlProps> = ({
    value,
    onChange,
    className,
}) => {
    return (
        <div className={className}>
            <div className="flex flex-col gap-2 text-white">
                <label className="text-sm">{__('Letter Spacing', 'doublescale')}</label>
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger
                        className={cn(
                            'h-10 w-full rounded-lg !border-none !ring-0 !ring-offset-0 !text-white',
                            'bg-white/[0.05] shadow-none focus-visible:ring-1 focus-visible:ring-white/30'
                        )}
                    >
                        <SelectValue placeholder={__('Select', 'doublescale')} />
                    </SelectTrigger>
                    <SelectContent>
                        {LETTER_SPACING_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
