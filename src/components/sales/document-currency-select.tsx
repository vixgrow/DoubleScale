/**
 * Per-document currency picker. `null` means inherit the global setting.
 */

import React from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { FormField } from '@doublescale/components';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { CURRENCY_OPTIONS, getGlobalCurrency } from '@/constants/currencies';

const INHERIT_VALUE = '__default__';

export interface DocumentCurrencySelectProps {
	value: string | null;
	onChange: (code: string | null) => void;
	locked?: boolean;
	/** Overrides the default lock tooltip. */
	lockTitle?: string;
	className?: string;
	triggerClassName?: string;
}

export const DocumentCurrencySelect: React.FC<DocumentCurrencySelectProps> = ({
	value,
	onChange,
	locked = false,
	lockTitle,
	className = '!mb-0',
	triggerClassName = 'h-10 w-full rounded-lg border-[#D0D0D0] bg-white',
}) => {
	const global = getGlobalCurrency();
	const selectValue = value || INHERIT_VALUE;
	const title = locked
		? lockTitle ||
			__(
				'Currency is locked once a document is sent or a payment has been recorded.',
				'doublescale'
			)
		: undefined;

	return (
		<FormField label={__('Currency', 'doublescale')} className={className}>
			<div title={title}>
				<Select
					value={selectValue}
					onValueChange={(next) =>
						onChange(next === INHERIT_VALUE ? null : next)
					}
					disabled={locked}
				>
					<SelectTrigger className={triggerClassName}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={INHERIT_VALUE}>
							{sprintf(
								/* translators: %s: default currency code, e.g. EUR */
								__('Use default (%s)', 'doublescale'),
								global
							)}
						</SelectItem>
						{CURRENCY_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</FormField>
	);
};
