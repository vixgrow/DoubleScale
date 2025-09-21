/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
/**
 * internal dependencies
 */
import { MergeTagsIcon } from '@quillcrm/components';
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
    className = 'pr-8 h-10',
    style = {
        borderColor: '#e5e5e5',
        borderRadius: '0.5rem',
    },
    fieldName,
}) => {
    const { setMergeTagsVisible, setMergeTagCallback } =
        useDispatch('quillcrm/core');

    const handleMergeTagClick = () => {
        setMergeTagCallback((tagValue: string) => {
            onChange(value + tagValue);
        });
        setMergeTagsVisible(true);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[#333333]">
                <label className="text-sm">{label}</label>
                <div
                    className="cursor-pointer hover:opacity-80"
                    onClick={handleMergeTagClick}
                >
                    <MergeTagsIcon />
                </div>
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
