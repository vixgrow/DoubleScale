/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';

export interface CampaignFiltersState {
	status: string;
	type: string;
	createDate: { from: Date | null; to: Date | null };
	updatedAt: { from: Date | null; to: Date | null };
}

interface CampaignFiltersProps {
	filters: CampaignFiltersState;
	onChange: (filters: CampaignFiltersState) => void;
	activeTab?: string;
}

export function CampaignFilters({
	filters,
	onChange,
	activeTab = 'email',
}: CampaignFiltersProps) {
	const handleFilterChange = (
		key: keyof CampaignFiltersState,
		value: unknown
	) => {
		onChange({
			...filters,
			[key]: value,
		});
	};

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{/* Status Filter */}
				<div className="space-y-2">
					<Label className="text-base font-semibold text-[#3F4254]">
						{__('Status', 'doublescale')}
					</Label>
					<Select
						value={filters.status}
						onValueChange={(value) =>
							handleFilterChange('status', value)
						}
					>
						<SelectTrigger className="h-11 w-full rounded-lg border-gray-200 bg-white">
							<SelectValue
								placeholder={__('Select Status', 'doublescale')}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{__('All Status', 'doublescale')}
							</SelectItem>
							<SelectItem value="draft">
								{__('Draft', 'doublescale')}
							</SelectItem>
							<SelectItem value="schedule">
								{__('Schedule', 'doublescale')}
							</SelectItem>
							<SelectItem value="sending">
								{__('Sending', 'doublescale')}
							</SelectItem>
							<SelectItem value="sent">
								{__('Sent', 'doublescale')}
							</SelectItem>
							<SelectItem value="paused">
								{__('Paused', 'doublescale')}
							</SelectItem>
							<SelectItem value="cancelled">
								{__('Cancelled', 'doublescale')}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Type Filter - Only show for email campaigns */}
				{activeTab === 'email' && (
					<div className="space-y-2">
						<Label className="text-base font-semibold text-[#3F4254]">
							{__('Type', 'doublescale')}
						</Label>
						<Select
							value={filters.type}
							onValueChange={(value) =>
								handleFilterChange('type', value)
							}
						>
							<SelectTrigger className="h-11 w-full rounded-lg border-gray-200 bg-white">
								<SelectValue
									placeholder={__('Select Type', 'doublescale')}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{__('All Types', 'doublescale')}
								</SelectItem>
								<SelectItem value="standard">
									{__('Standard Campaign', 'doublescale')}
								</SelectItem>
								<SelectItem value="ab_test">
									{__('A/B Split Campaign', 'doublescale')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Create Date Filter */}
				<div className="flex flex-col gap-1">
					<Label className="text-base font-semibold text-[#3F4254]">
						{__('Create Date', 'doublescale')}
					</Label>
					<DateRangePicker
						value={filters.createDate}
						onChange={(range) =>
							handleFilterChange('createDate', range)
						}
						placeholder={__('From - To', 'doublescale')}
						className="w-full rounded-lg border bg-white shadow-none"
					/>
				</div>

				{/* Updated At Filter */}
				<div className="flex flex-col gap-1">
					<Label className="text-base font-semibold text-[#3F4254]">
						{__('Updated At', 'doublescale')}
					</Label>
					<DateRangePicker
						value={filters.updatedAt}
						onChange={(range) =>
							handleFilterChange('updatedAt', range)
						}
						placeholder={__('From - To', 'doublescale')}
						className="w-full rounded-lg border bg-white shadow-none"
					/>
				</div>
			</div>
		</div>
	);
}
