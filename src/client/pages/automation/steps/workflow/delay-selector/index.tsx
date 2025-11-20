/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { getAction } from '@quillcrm/utils';
import './style.scss';

interface DelaySelectorProps {
	value: string;
	onChange: (value: string) => void;
	onSave: (actionKey: string) => void;
}

const DELAY_ACTION_KEYS = ['delay', 'delay-until-datetime'] as const;

const DelaySelector: React.FC<DelaySelectorProps> = ({
	value,
	onChange,
	onSave,
}) => {
	const [isSaving, setIsSaving] = useState(false);

	const delayActions = DELAY_ACTION_KEYS.map((key) => ({
		key,
		action: getAction(key),
	})).filter(({ action }) => !!action);

	const handleSelect = async (actionKey: string) => {
		onChange(actionKey);
		setIsSaving(true);
		try {
			await onSave(actionKey);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="py-4">
			<div className="flex flex-col gap-4">
				{delayActions.map(({ key, action }) => (
					<Card key={key} className="shadow-none border">
						<CardHeader className="px-4 py-3 border-b">
							<CardTitle className="text-base font-semibold text-[#1F2937]">
								{action?.label || __('Delay', 'quillcrm')}
							</CardTitle>
							{action?.description && (
								<p className="text-sm text-muted-foreground mt-1">
									{action.description}
								</p>
							)}
						</CardHeader>
						<CardContent className="px-4 py-3 flex justify-end">
							<Button
								onClick={() => handleSelect(key)}
								disabled={isSaving}
								className={`text-primary bg-transparent shadow-none font-semibold rounded-full px-4 py-2 hover:bg-primary/10 ${
									value === key
										? 'border-2 border-primary'
										: 'border'
								}`}
							>
								{isSaving && value === key
									? __('Saving...', 'quillcrm')
									: __('Select', 'quillcrm')}
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
};

export default DelaySelector;

