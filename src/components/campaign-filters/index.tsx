/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useState } from 'react';

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
import { Button } from '@/components/ui/button';
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
	onClear: () => void;
	activeTab?: string;
}

export function CampaignFilters({
	filters,
	onChange,
	onClear,
	activeTab = 'email',
}: CampaignFiltersProps) {
	const handleFilterChange = (
		key: keyof CampaignFiltersState,
		value: any
	) => {
		onChange({
			...filters,
			[key]: value,
		});
	};

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="grid grid-cols-2 gap-4">
				{/* Status Filter */}
				<div className="space-y-2">
					<Label className="text-[#3F4254] font-semibold text-base">
						{__('Status', 'quillcrm')}
					</Label>
					<Select
						value={filters.status}
						onValueChange={(value) =>
							handleFilterChange('status', value)
						}
					>
						<SelectTrigger className="w-full h-11 bg-white border-gray-200 rounded-lg">
							<SelectValue
								placeholder={__('Select Status', 'quillcrm')}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{__('All Status', 'quillcrm')}
							</SelectItem>
							<SelectItem value="draft">
								{__('Draft', 'quillcrm')}
							</SelectItem>
							<SelectItem value="schedule">
								{__('Schedule', 'quillcrm')}
							</SelectItem>
							<SelectItem value="sending">
								{__('Sending', 'quillcrm')}
							</SelectItem>
							<SelectItem value="sent">
								{__('Sent', 'quillcrm')}
							</SelectItem>
							<SelectItem value="paused">
								{__('Paused', 'quillcrm')}
							</SelectItem>
							<SelectItem value="cancelled">
								{__('Cancelled', 'quillcrm')}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Type Filter - Only show for email campaigns */}
				{activeTab === 'email' && (
					<div className="space-y-2">
						<Label className="text-[#3F4254] font-semibold text-base">
							{__('Type', 'quillcrm')}
						</Label>
						<Select
							value={filters.type}
							onValueChange={(value) =>
								handleFilterChange('type', value)
							}
						>
							<SelectTrigger className="w-full h-11 bg-white border-gray-200 rounded-lg">
								<SelectValue
									placeholder={__('Select Type', 'quillcrm')}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{__('All Types', 'quillcrm')}
								</SelectItem>
								<SelectItem value="standard">
									{__('Standard Campaign', 'quillcrm')}
								</SelectItem>
								<SelectItem value="ab_test">
									{__('A/B Split Campaign', 'quillcrm')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Create Date Filter */}
				<div className="flex flex-col gap-1">
					<Label className="text-[#3F4254] font-semibold text-base">
						{__('Create Date', 'quillcrm')}
					</Label>
					<DateRangePicker
						value={filters.createDate}
						onChange={(range) =>
							handleFilterChange('createDate', range)
						}
						placeholder={__('From - To', 'quillcrm')}
						className="w-full bg-white rounded-lg shadow-none border"

					/>
				</div>

				{/* Updated At Filter */}
				<div className="flex flex-col gap-1">
					<Label className="text-[#3F4254] font-semibold text-base">
						{__('Updated At', 'quillcrm')}
					</Label>
					<DateRangePicker
						value={filters.updatedAt}
						onChange={(range) =>
							handleFilterChange('updatedAt', range)
						}
						placeholder={__('From - To', 'quillcrm')}
						className="w-full bg-white rounded-lg shadow-none border"
					/>
				</div>
			</div>

			{/* Clear Filters Button */}
			<div className="mt-4">
				<Button
					variant="outline"
					onClick={onClear}
					className="text-gray-500 shadow-none rounded-lg"
				>
					{__('Clear Filters', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
}

