/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { Bold, Italic, Strikethrough, Underline } from 'lucide-react';
/**
 * internal dependencies
 */
import { cn } from '@/lib/utils';

export interface TextFormattingControlProps {
    value: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strikethrough?: boolean;
    };
    onChange: (updates: Partial<TextFormattingControlProps['value']>) => void;
    className?: string;
}

export const TextFormattingControl: React.FC<TextFormattingControlProps> = ({
    value,
    onChange,
    className,
}) => {
    return (
        <div className={cn('flex flex-col gap-2 text-[#333333]', className)}>
            <label className="text-sm">
                {__('Decoration', 'quillcrm')}
            </label>
            <div className="flex items-center justify-between border rounded-lg">
                <Bold
                    className={cn(
                        'size-12 py-3 px-5 w-full cursor-pointer',
                        value.bold &&
                        'bg-[#C6DFF366] border border-primary rounded-l-lg'
                    )}
                    onClick={() => onChange({ bold: !value.bold })}
                />
                <Italic
                    className={cn(
                        'size-12 py-3 px-5 w-full cursor-pointer',
                        value.italic &&
                        'bg-[#C6DFF366] border border-primary'
                    )}
                    onClick={() => onChange({ italic: !value.italic })}
                />
                <Strikethrough
                    className={cn(
                        'size-12 py-3 px-5 w-full cursor-pointer',
                        value.strikethrough &&
                        'bg-[#C6DFF366] border border-primary'
                    )}
                    onClick={() => onChange({ strikethrough: !value.strikethrough })}
                />
                <Underline
                    className={cn(
                        'size-12 py-3 px-5 w-full cursor-pointer',
                        value.underline &&
                        'bg-[#C6DFF366] border border-primary rounded-r-lg'
                    )}
                    onClick={() => onChange({ underline: !value.underline })}
                />
            </div>
        </div>
    );
};
