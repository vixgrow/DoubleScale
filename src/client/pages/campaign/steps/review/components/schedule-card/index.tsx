/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScheduleIcon } from '@doublescale/components';
import { DateTimePicker } from '@/components/date-time-picker';
import CardLayout from '../card-layout';

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
		<CardLayout
			icon={<ScheduleIcon />}
			header={__(
				'When would you like to send the campaign?',
				'doublescale'
			)}
			button={false}
		>
			<div className="space-y-6">
				{/* Send Now / Schedule for later */}
				<RadioGroup
					value={sendNow ? 'now' : 'later'}
					onValueChange={(value) => setSendNow(value === 'now')}
					className="flex flex-col sm:flex-row gap-4"
				>
					<Label
						htmlFor="send-now"
						className={`flex items-center space-x-3 text-foreground flex-1 bg-white border rounded-lg p-3 cursor-pointer ${sendNow
							? 'border-primary'
							: 'border-border'
							}`}
					>
						<RadioGroupItem value="now" id="send-now" />
						<span className="text-base font-semibold">
							{__('Send now', 'doublescale')}
						</span>
					</Label>

					<Label
						htmlFor="schedule-later"
						className={`flex items-center space-x-3 text-foreground flex-1 bg-white border rounded-lg p-3 cursor-pointer ${!sendNow
							? 'border-primary'
							: 'border-border'
							}`}
					>
						<RadioGroupItem value="later" id="schedule-later" />
						<span className="text-base font-semibold">
							{__('Schedule for later', 'doublescale')}
						</span>
					</Label>
				</RadioGroup>

				{/* Date and Time Fields */}
				{!sendNow && (
					<>
						<div className="min-w-0">
							<label className="mb-2 block text-base text-[#09090B]">
								{__('Schedule date & time', 'doublescale')}
							</label>
							<DateTimePicker
								className="w-full"
								value={scheduledAt ?? undefined}
								onChange={(value) => setScheduledAt(new Date(value))}
								placeholder={__(
									'Select date & time',
									'doublescale'
								)}
							/>
						</div>

						{/* Based on section */}
						<div>
							<h4 className="text-base text-[#09090B] mb-3">
								{__('Based on', 'doublescale')}
							</h4>
							<RadioGroup
								value={timezoneMode}
								onValueChange={setTimezoneMode}
								className="flex flex-col sm:flex-row gap-4 w-full"
							>
								<Label
									htmlFor="subscriber-timezone"
									className={`flex items-center space-x-3 text-foreground flex-1 bg-white border rounded-lg p-4 cursor-pointer ${timezoneMode === 'subscriber'
										? 'border-primary'
										: 'border-border'
										}`}
								>
									<RadioGroupItem
										value="subscriber"
										id="subscriber-timezone"
									/>
									<span className="text-sm lg:text-base font-semibold">
										{__(
											'Based on the Subscribers time zone',
											'doublescale'
										)}
									</span>
								</Label>
								<Label
									htmlFor="user-timezone"
									className={`flex items-center space-x-3 text-foreground flex-1 bg-white border rounded-lg p-4 cursor-pointer ${timezoneMode === 'user'
										? 'border-primary'
										: 'border-border'
										}`}
								>
									<RadioGroupItem
										value="user"
										id="user-timezone"
									/>
									<span className="text-sm lg:text-base font-semibold">
										{__('Your time zone GMT+3', 'doublescale')}
									</span>
								</Label>
							</RadioGroup>
							{timezoneMode === 'subscriber' && (
								<p className="text-sm lg:text-base text-destructive mt-2">
									{__(
										'(Applies only to subscribers with location data)',
										'doublescale'
									)}
								</p>
							)}
						</div>
					</>
				)}
			</div>
		</CardLayout>
	);
};

export default ScheduleCard;
