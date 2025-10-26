import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import Builder from '@/builder/index';

export interface OpenBuilderProps {
	/**
	 * Initial email body data (JSON string or parsed object)
	 */
	initialEmailBody?: string | object;
	/**
	 * Callback when builder data is saved
	 */
	onSave: (emailBodyJson: string) => void;
	/**
	 * Button text (optional)
	 */
	buttonText?: string;
	/**
	 * Button variant (optional)
	 */
	buttonVariant?:
		| 'default'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'link';
	/**
	 * Button className (optional)
	 */
	buttonClassName?: string;
	/**
	 * Unique key for the builder (helps with data persistence issues)
	 */
	builderKey?: string;
}

const OpenBuilder: React.FC<OpenBuilderProps> = ({
	initialEmailBody,
	onSave,
	buttonText = __('Open Builder', 'quillcrm'),
	buttonVariant = 'default',
	buttonClassName = 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2',
	builderKey = 'default',
}) => {
	const [isBuilderOpen, setIsBuilderOpen] = useState(false);

	const handleOpenBuilder = () => {
		console.log('OpenBuilder: Button clicked, opening builder...');
		setIsBuilderOpen(true);
		console.log('OpenBuilder: isBuilderOpen set to true');
	};

	const handleBuilderSave = (builderData: any) => {
		const preparedDataEmailBody = {
			type: 'builder',
			value: builderData,
		};
		const emailBodyJson = JSON.stringify(preparedDataEmailBody);
		onSave(emailBodyJson);
		setIsBuilderOpen(false);
		return Promise.resolve();
	};

	const handleBuilderClose = () => {
		setIsBuilderOpen(false);
	};

	const getBuilderInitialData = () => {
		if (!initialEmailBody) {
			return undefined;
		}

		try {
			// If it's already an object, use it directly
			if (typeof initialEmailBody === 'object') {
				return initialEmailBody;
			}

			// If it's a string, parse it
			const emailBodyJson = JSON.parse(initialEmailBody);

			// If the data has a 'type' and 'value' wrapper, extract the value
			if (emailBodyJson.type === 'builder' && emailBodyJson.value) {
				return emailBodyJson.value;
			}

			// Otherwise return as-is (in case it's already in the correct format)
			return emailBodyJson;
		} catch (error) {
			console.error('Failed to parse email body:', error);
			return undefined;
		}
	};

	// Determine button text based on whether we have existing content
	const getButtonText = () => {
		if (buttonText) {
			return buttonText;
		}

		const hasContent =
			initialEmailBody &&
			(typeof initialEmailBody === 'string'
				? initialEmailBody.trim() !== ''
				: true);

		return hasContent
			? __('Edit Template', 'quillcrm')
			: __('Open Builder', 'quillcrm');
	};

	return (
		<>
			<Button
				variant={buttonVariant}
				onClick={handleOpenBuilder}
				className={buttonClassName}
			>
				{getButtonText()}
			</Button>

			{/* Builder Modal - Rendered in portal to ensure full screen */}
			{isBuilderOpen && (
				<>
					{console.log(
						'OpenBuilder: Rendering builder with isBuilderOpen =',
						isBuilderOpen
					)}
					{createPortal(
						<div
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => e.stopPropagation()}
							onMouseDown={(e) => e.stopPropagation()}
							onKeyDown={(e) => {
								// Prevent escape key from closing parent dialogs
								if (e.key === 'Escape') {
									e.stopPropagation();
								}
							}}
						>
							<Builder
								key={`${builderKey}-${initialEmailBody || 'new-email'}`}
								initialData={getBuilderInitialData()}
								onSave={handleBuilderSave}
								onClose={handleBuilderClose}
							/>
						</div>,
						document.body
					)}
				</>
			)}
		</>
	);
};

export default OpenBuilder;
