/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { Button } from '@/components/ui/button';
import ConfigAPI from '@quillcrm/config';

interface TestButtonProps {
	label?: string;
	settings?: {
		ajax_action?: string;
		button_text?: string;
	};
	allValues?: { [key: string]: any };
	onResult?: (result: any) => void;
}

const TestButton: React.FC<TestButtonProps> = ({
	label,
	settings,
	allValues,
	onResult,
}) => {
	const [isLoading, setIsLoading] = useState(false);

	const handleButtonClick = useCallback(async () => {
		if (!settings?.ajax_action) {
			onResult?.(null);
			return;
		}

		setIsLoading(true);
		try {
			const body = new FormData();
			body.append('action', settings.ajax_action);
			body.append('nonce', ConfigAPI.getNonce());

			// Include all current step values in the request
			if (allValues) {
				// Send webhook_url
				if (allValues.webhook_url) {
					body.append('webhook_url', allValues.webhook_url);
				} else {
					alert('Webhook URL is required');
					return;
				}

				// Send data_fields array
				if (
					allValues.data_fields &&
					Array.isArray(allValues.data_fields)
				) {
					body.append(
						'data_fields',
						JSON.stringify(allValues.data_fields)
					);
				}

				// Send any other values
				Object.keys(allValues).forEach((key) => {
					if (key !== 'webhook_url' && key !== 'data_fields') {
						const fieldValue = allValues[key];
						if (fieldValue !== null && fieldValue !== undefined) {
							if (typeof fieldValue === 'object') {
								body.append(key, JSON.stringify(fieldValue));
							} else {
								body.append(key, String(fieldValue));
							}
						}
					}
				});
			}

			const response = await fetch(ConfigAPI.getAjaxUrl(), {
				method: 'POST',
				body,
			});

			const data = await response.json();

			if (data.success) {
				onResult?.(data.data);
				console.log('TestButton callback success:', data.data);
			} else {
				console.error('TestButton callback failed:', data.data);
				onResult?.(null);
			}
		} catch (error) {
			console.error('TestButton callback error:', error);
			onResult?.(null);
		} finally {
			setIsLoading(false);
		}
	}, [settings, allValues, onResult]);

	return (
		<Button
			onClick={handleButtonClick}
			variant="secondaryDeepBlue"
			disabled={isLoading}
		>
			{isLoading
				? __('Loading...', 'quillcrm')
				: settings?.button_text || label}
		</Button>
	);
};

export default TestButton;
