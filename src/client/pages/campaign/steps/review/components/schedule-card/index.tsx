/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScheduleIcon } from '@quillcrm/components';
import { DateTimePicker } from '@/components/date-time-picker';

interface ScheduleCardProps {
	sendNow: boolean;
	setSendNow: (value: boolean) => void;
	scheduledAt: Date | null;
	setScheduledAt: (value: Date | null) => void;
	timezoneMode: string;
	setTimezoneMode: (value: string) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
	sendNow,
	setSendNow,
	scheduledAt,
	setScheduledAt,
	timezoneMode,
	setTimezoneMode,
}) => {
	return (
		<div className="border border-gray-200 bg-white rounded-lg p-6">
			{/* Title with icon */}
			<div className="flex items-center gap-2 mb-6 text-[#660FF1]">
				<ScheduleIcon />
				<h3 className="text-lg font-semibold text-[#660FF1]">
					{__(
						'When would you like to send the campaign?',
						'quillcrm'
					)}
				</h3>
			</div>

			<div className="space-y-6">
				{/* Send Now / Schedule for later */}
				<RadioGroup
					value={sendNow ? 'now' : 'later'}
					onValueChange={(value) => setSendNow(value === 'now')}
					className="flex gap-4"
				>
					<Label
						htmlFor="send-now"
						className={`flex items-center space-x-3 flex-1 border rounded-lg p-3 cursor-pointer ${sendNow
							? 'border-secondary bg-[#E3EEFF99] text-secondary'
							: 'border-[#DEE1E6] text-[#09090B]'
							}`}
					>
						<RadioGroupItem value="now" id="send-now" />
						<span className="text-base font-semibold">
							{__('Send now', 'quillcrm')}
						</span>
					</Label>

					<Label
						htmlFor="schedule-later"
						className={`flex items-center space-x-3 flex-1 border rounded-lg p-3 cursor-pointer ${!sendNow
							? 'border-secondary bg-[#E3EEFF99] text-secondary'
							: 'border-[#DEE1E6] text-[#09090B]'
							}`}
					>
						<RadioGroupItem value="later" id="schedule-later" />
						<span className="text-base font-semibold">
							{__('Schedule for later', 'quillcrm')}
						</span>
					</Label>
				</RadioGroup>

				{/* Date and Time Fields */}
				{!sendNow && (
					<>
						<div>
							<label className="block text-base text-[#09090B] mb-2">
								{__('Schedule date & time', 'quillcrm')}
							</label>
							<DateTimePicker
								value={scheduledAt ?? undefined}
								onChange={(value) => setScheduledAt(new Date(value))}
								placeholder={__(
									'Select date & time',
									'quillcrm'
								)}
							/>
						</div>

						{/* Based on section */}
						<div>
							<h4 className="text-base text-[#09090B] mb-3">
								{__('Based on', 'quillcrm')}
							</h4>
							<RadioGroup
								value={timezoneMode}
								onValueChange={setTimezoneMode}
								className="flex gap-4 w-full"
							>
								<Label
									htmlFor="subscriber-timezone"
									className={`flex items-center space-x-3 flex-1 border rounded-lg p-4 cursor-pointer ${timezoneMode === 'subscriber'
										? 'border-secondary bg-[#E3EEFF99] text-secondary'
										: 'border-gray-300'
										}`}
								>
									<RadioGroupItem
										value="subscriber"
										id="subscriber-timezone"
									/>
									<span className="text-base font-semibold">
										{__(
											'Based on the Subscribers time zone',
											'quillcrm'
										)}
									</span>
								</Label>
								<Label
									htmlFor="user-timezone"
									className={`flex items-center space-x-3 flex-1 border rounded-lg p-4 cursor-pointer ${timezoneMode === 'user'
										? 'border-secondary bg-[#E3EEFF99] text-secondary'
										: 'border-gray-300'
										}`}
								>
									<RadioGroupItem
										value="user"
										id="user-timezone"
									/>
									<span className="text-base font-semibold">
										{__('Your time zone GMT+3', 'quillcrm')}
									</span>
								</Label>
							</RadioGroup>
							{timezoneMode === 'subscriber' && (
								<p className="text-base text-destructive mt-2">
									{__(
										'(Applies only to subscribers with location data)',
										'quillcrm'
									)}
								</p>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default ScheduleCard;
