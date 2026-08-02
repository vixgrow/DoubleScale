/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Lock } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { getAction } from '@doublescale/utils';
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

	const handleSelect = async (actionKey: string, action: any) => {
		// Pro-locked delays are inert — the Select button is disabled below.
		if (action.is_pro) {
			return;
		}

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
		<>
			<div className="doublescale-delay-selector flex flex-col gap-5">
				{delayActions.map(({ key, action }) => (
					<div
						key={key}
						className="doublescale-delay-type-card flex flex-col gap-2.5 rounded-lg border border-border bg-[#F7F8FA] p-4"
					>
						<div className="flex items-center justify-between gap-3">
							<h3 className="m-0 min-w-0 flex-1 p-0 text-sm font-semibold leading-tight text-foreground">
								<span className="inline-flex items-center gap-2">
									{action?.label || __('Delay', 'doublescale')}
									{action?.is_pro && (
										<Lock
											className="h-4 w-4 shrink-0 text-orange-500"
											aria-hidden
										/>
									)}
								</span>
							</h3>
							<Button
								type="button"
								size="sm"
								onClick={() => handleSelect(key, action)}
								disabled={action?.is_pro || isSaving}
								variant="secondaryDeepBlue"
								className=" !shrink-0 !rounded-[4px] !px-2 !py-1"
							>
								{isSaving && value === key
									? __('Saving...', 'doublescale')
									: __('Select', 'doublescale')}
							</Button>
						</div>
						{action?.description && (
							<p className="m-0  p-0 text-sm leading-snug text-muted-foreground max-w-[250px]">
								{action.description}
							</p>
						)}
					</div>
				))}
			</div>
		</>
	);
};

export default DelaySelector;
