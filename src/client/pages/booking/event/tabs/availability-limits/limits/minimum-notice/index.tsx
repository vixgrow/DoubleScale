/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { LimitBaseProps } from '@/types/booking';

import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface MinimumNoticeProps extends LimitBaseProps {}

const unitOptions = [
	{ label: __('Minutes', 'doublescale'), value: 'minutes' },
	{ label: __('Hours', 'doublescale'), value: 'hours' },
	{ label: __('Days', 'doublescale'), value: 'days' },
];

const MinimunmNotice: React.FC<MinimumNoticeProps> = ({
	limits,
	handleChange,
}) => {
	const noticeValue = Number(limits?.general?.minimum_notices ?? 0);
	const rawUnit = limits?.general?.minimum_notice_unit;
	const unitValue =
		rawUnit === 'minutes' || rawUnit === 'hours' || rawUnit === 'days'
			? rawUnit
			: 'hours';

	return (
		<div className="flex gap-2.5 flex-col mt-4">
			<div className="text-[#09090B] text-[16px]">
				{__('Minimum Notice', 'doublescale')}
				<span className="text-red-500">*</span>
			</div>
			<div className="flex flex-row gap-2 w-full items-stretch">
				<Input
					type="number"
					min={0}
					value={Number.isFinite(noticeValue) ? noticeValue : 0}
					onChange={(e) => {
						const v = e.target.value;
						const n = v === '' ? 0 : Number(v);
						handleChange(
							'general',
							'minimum_notices',
							Number.isFinite(n) ? n : 0
						);
					}}
					className="h-[48px] rounded-lg min-w-0 flex-1"
				/>
				<Select
					value={unitValue}
					onValueChange={(value) =>
						handleChange('general', 'minimum_notice_unit', value)
					}
				>
					<SelectTrigger className="h-[48px] w-[11rem] shrink-0 rounded-lg">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{unitOptions.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};

export default MinimunmNotice;
