/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@quillcrm/components';

interface MessageComposerProps {
	value: string;
	onChange: (value: string) => void;
	label?: string;
	placeholder?: string;
	maxLength?: number;
	required?: boolean;
	helpText?: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
	value,
	onChange,
	label = __('Message', 'quillcrm'),
	placeholder = __('Enter your message here...', 'quillcrm'),
	maxLength = 1600,
	required = true,
	helpText,
}) => {
	const characterCount = value?.length || 0;
	const remainingChars = maxLength - characterCount;
	const isNearLimit = remainingChars < 100;
	const isOverLimit = remainingChars < 0;

	return (
		<FormField label={label} required={required}>
			<div className="space-y-2">
				<Textarea
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					rows={6}
					maxLength={maxLength}
					className="resize-y"
				/>
				<div className="flex justify-between items-center text-sm">
					<div className="text-muted-foreground">
						{helpText && <span>{helpText}</span>}
					</div>
					<div
						className={`font-medium ${
							isOverLimit
								? 'text-red-500'
								: isNearLimit
									? 'text-yellow-500'
									: 'text-muted-foreground'
						}`}
					>
						{characterCount} / {maxLength} {__('characters', 'quillcrm')}
					</div>
				</div>
			</div>
		</FormField>
	);
};

export default MessageComposer;