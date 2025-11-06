import React, { useState, useEffect } from 'react';
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
		setIsBuilderOpen(true);
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

	// Handle inert attribute for background dialogs to prevent focus issues
	useEffect(() => {
		if (!isBuilderOpen) {
			return;
		}

		const inertElements: HTMLElement[] = [];

		// Use setTimeout to ensure DOM is ready after portal renders
		const timeoutId = setTimeout(() => {
			// Find all dialog content elements that might be in the background
			const dialogContents = document.querySelectorAll('[role="dialog"]');

			dialogContents.forEach((dialog) => {
				const dialogElement = dialog as HTMLElement;
				// Don't make the builder itself inert
				if (
					!dialogElement.querySelector('#quillcrm-email-builder') &&
					!dialogElement.closest('#quillcrm-email-builder')
				) {
					// Store original inert state
					const wasInert = dialogElement.hasAttribute('inert');
					if (!wasInert) {
						dialogElement.setAttribute('inert', '');
						inertElements.push(dialogElement);
					}
				}
			});

			// Also set the workflow sidebar to inert if it exists
			const sidebar = document.querySelector('.qcrm-workflow-sidebar');
			if (sidebar && !sidebar.closest('#quillcrm-email-builder')) {
				const sidebarElement = sidebar as HTMLElement;
				sidebarElement.setAttribute('inert', '');
				inertElements.push(sidebarElement);
			}

			// Focus the builder wrapper to ensure focus is moved away from background
			const builderWrapper = document.getElementById(
				'builder-portal-wrapper'
			);
			if (builderWrapper) {
				builderWrapper.focus();
			}
		}, 50);

		// Cleanup: remove inert when builder closes
		return () => {
			clearTimeout(timeoutId);
			inertElements.forEach((element) => {
				element.removeAttribute('inert');
			});
		};
	}, [isBuilderOpen]);

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
					{createPortal(
						// eslint-disable-next-line react/forbid-dom-props
						<div
							id="builder-portal-wrapper"
							tabIndex={-1}
							// Add data attribute to help Radix UI dialogs ignore this element
							data-state="open"
							data-builder-portal="true"
							role="dialog"
							aria-modal="true"
							aria-label="Email Template Builder"
							// Inline styles required for portal z-index layering
							style={{
								position: 'fixed',
								inset: 0,
								zIndex: 160000,
								pointerEvents: 'auto',
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
