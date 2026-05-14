/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
/**
 * internal dependencies
 */
import { MerageTagsIcon } from '@doublescale/components';
import { Input } from '@/components/ui/input';

export interface InputWithMergeTagsProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'url' | 'email';
    className?: string;
    style?: React.CSSProperties;
    fieldName: string;
}

export const InputWithMergeTags: React.FC<InputWithMergeTagsProps> = ({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    className = 'pr-8 h-10 !text-white !border-none !ring-0 !ring-offset-0 !rounded-lg placeholder:!text-white/50',
    style = {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    fieldName,
}) => {
    const { setMergeTagsVisible, setMergeTagCallback } =
        useDispatch('doublescale/core');

    const handleMergeTagClick = () => {
        setMergeTagCallback((tagValue: string) => {
            onChange(value + tagValue);
        });
        setMergeTagsVisible(true);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-white">
                <label className="text-sm">{label}</label>
                <span
                    className="cursor-pointer hover:opacity-80"
                    onClick={handleMergeTagClick}
                >
                    <MerageTagsIcon />
                </span>
            </div>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={className}
                style={style}
                placeholder={placeholder}
            />
        </div>
    );
};
