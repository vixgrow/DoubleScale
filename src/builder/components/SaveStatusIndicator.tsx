import React from 'react';
import { __ } from '@wordpress/i18n';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
	isSaving: boolean;
	lastSaved: Date | null;
	hasUnsavedChanges: boolean;
	error: string | null;
	className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
	isSaving,
	lastSaved,
	hasUnsavedChanges,
	error,
	className,
}) => {
	const getTimeAgo = (date: Date): string => {
		const seconds = Math.floor(
			(new Date().getTime() - date.getTime()) / 1000
		);

		if (seconds < 10) {
			return __('just now', 'quillcrm');
		} else if (seconds < 60) {
			return __('a few seconds ago', 'quillcrm');
		} else if (seconds < 3600) {
			const minutes = Math.floor(seconds / 60);
			return minutes === 1
				? __('1 minute ago', 'quillcrm')
				: `${minutes} ${__('minutes ago', 'quillcrm')}`;
		} else {
			const hours = Math.floor(seconds / 3600);
			return hours === 1
				? __('1 hour ago', 'quillcrm')
				: `${hours} ${__('hours ago', 'quillcrm')}`;
		}
	};

	const getStatusContent = () => {
		if (error) {
			return {
				icon: <AlertCircle className="h-4 w-4" />,
				text: __('Save failed', 'quillcrm'),
				color: 'text-red-600',
			};
		}

		if (isSaving) {
			return {
				icon: <Loader2 className="h-4 w-4 animate-spin" />,
				text: __('Saving...', 'quillcrm'),
				color: 'text-blue-600',
			};
		}

		if (hasUnsavedChanges) {
			return {
				icon: <AlertCircle className="h-4 w-4" />,
				text: __('Unsaved changes', 'quillcrm'),
				color: 'text-orange-600',
			};
		}

		if (lastSaved) {
			return {
				icon: <Check className="h-4 w-4" />,
				text: `${__('Saved', 'quillcrm')} ${getTimeAgo(lastSaved)}`,
				color: 'text-green-600',
			};
		}

		return {
			icon: null,
			text: __('Not saved', 'quillcrm'),
			color: 'text-gray-600',
		};
	};

	const status = getStatusContent();

	return (
		<div
			className={cn(
				'flex items-center gap-2 text-sm',
				status.color,
				className
			)}
			title={error || undefined}
		>
			{status.icon}
			<span>{status.text}</span>
		</div>
	);
};

