/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import { useRef } from 'react';
import { MergeTagsIcon } from '@quillcrm/components';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';

export interface LinkInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const LinkInput: React.FC<LinkInputProps> = ({
    label,
    value,
    onChange,
    placeholder = "https://example.com",
    className = 'h-10',
    style = {
        borderColor: '#e5e5e5',
        borderRadius: '0.5rem',
    },
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { setMergeTagsVisible, setMergeTagCallback } = useDispatch('quillcrm/core');

    const handleChange = (inputValue: string) => {
        // If the input is empty, just pass it through
        if (!inputValue.trim()) {
            onChange(inputValue);
            return;
        }

        // Check if the URL already has a protocol (http:// or https://)
        const hasProtocol = /^https?:\/\//i.test(inputValue);

        // If no protocol is present and the input is not empty, add https://
        const processedValue = hasProtocol ? inputValue : `https://${inputValue}`;

        onChange(processedValue);
    };

    const handleMergeTagClick = () => {
        setMergeTagCallback((tagValue: string) => {
            const inputElement = inputRef.current;
            if (!inputElement) {
                onChange(tagValue);
                return;
            }

            const { value: currentValue } = inputElement;
            const selectionStart =
                inputElement.selectionStart ?? currentValue.length;
            const selectionEnd =
                inputElement.selectionEnd ?? currentValue.length;

            const newValue =
                currentValue.slice(0, selectionStart) +
                tagValue +
                currentValue.slice(selectionEnd);

            onChange(newValue);

            requestAnimationFrame(() => {
                inputElement.focus();
                const newPosition = selectionStart + tagValue.length;
                inputElement.setSelectionRange(newPosition, newPosition);
            });
        });

        setMergeTagsVisible(true);
    };

    return (
        <div className="flex flex-col gap-2 text-[#333333]">
            <div className="flex items-center justify-between">
                <label className="text-sm">{label}</label>
                <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-[#333333] transition hover:border-[#d1d5db] hover:bg-[#f9fafb]"
                    onClick={handleMergeTagClick}
                    title={__('Insert Merge Tag', 'quillcrm')}
                >
                    <MergeTagsIcon width={20} height={20} />
                </button>
            </div>
            <Input
                type="url"
                ref={inputRef}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                className={className}
                style={style}
                placeholder={placeholder}
            />
        </div>
    );
};
