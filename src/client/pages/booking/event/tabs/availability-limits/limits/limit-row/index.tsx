import { LimitsAddIcon, TrashIcon } from '@/components/booking';
import { __ } from '@wordpress/i18n';
import type {
	LimitBaseProps,
	LimitUnit,
	UnitOptions,
} from '@/types/booking';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface LimitRowProps extends LimitBaseProps {
	addLimit: (section: 'frequency' | 'duration') => void;
	removeLimit: (section: 'frequency' | 'duration', index: number) => void;
	unitOptions: UnitOptions;
	setBookingState: (val: any) => void;
	type: 'frequency' | 'duration';
}

const LimitRow: React.FC<LimitRowProps> = ({
	limits,
	handleChange,
	addLimit,
	removeLimit,
	unitOptions,
	setBookingState,
	type,
}) => {
	return (
        <>
            {limits[type].enable && (
				<div className="border-t pt-4">
					{limits[type].limits.map((limit, index) => (
						<div key={index} className='flex items-center gap-2.5 w-full mb-4'>
							<div className="flex items-center w-3/5 h-[48px] rounded-lg border border-input bg-background pr-3 focus-within:ring-2 focus-within:ring-ring">
								<Input
									type='number'
									value={limit.limit}
									min={1}
									onChange={(e) => {
										const updatedLimits = [
											...limits[type].limits,
										];
										updatedLimits[index].limit =
											Number(e.target.value) ||
											(type == 'frequency' ? 1 : 120);
										handleChange(type, 'limits', updatedLimits);
									}}
									className="h-full !rounded-l-lg !rounded-r-none !border-0 shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
								/>
								<span className="text-[#9BA7B7] pl-5">
									{type === 'frequency'
										? __('Bookings', 'doublescale')
										: __('Minutes', 'doublescale')}
								</span>
							</div>
							<Select
								value={limit.unit}
								onValueChange={(value) => {
									const previousUnit =
										limits[type].limits[index].unit;
									const newUnit = value as LimitUnit;
									const updatedLimits = [
										...limits[type].limits,
									];
									updatedLimits[index].unit = newUnit;

									handleChange(type, 'limits', updatedLimits);

									// Enable the previously selected unit
									setBookingState((prev) => ({
										...prev,
										[previousUnit]: {
											...prev[previousUnit],
											disabled: false,
										},
									}));

									// Disable the newly selected unit
									setBookingState((prev) => ({
										...prev,
										[newUnit]: {
											...prev[newUnit],
											disabled: true,
										},
									}));
								}}
							>
								<SelectTrigger className="w-2/5 rounded-lg h-[48px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(unitOptions).map(
										([key, option]) => (
											<SelectItem
												key={key}
												value={key}
												disabled={option.disabled}
											>
												{__('per', 'doublescale')}{' '}
												{option.label}
											</SelectItem>
										)
									)}
								</SelectContent>
							</Select>

							{index === 0 && (
								<Button
									onClick={() => addLimit(type)}
									className="border-none shadow-none p-0 h-8 w-8"
								>
									<LimitsAddIcon />
								</Button>
							)}

							{index !== 0 && (
								<Button
									onClick={() => removeLimit(type, index)}
									className="border-none shadow-none p-0 h-8 w-8"
									variant='destructive'
									size='sm'
								>
									<TrashIcon width={24} height={24} />
								</Button>
							)}
						</div>
					))}
				</div>
			)}
        </>
    );
};

export default LimitRow;
