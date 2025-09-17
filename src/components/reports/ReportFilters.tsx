import React from 'react';
import { __ } from '@wordpress/i18n';
import dayjs from 'dayjs';
import {
	ReportFilters as ReportFiltersType,
	FilterOptions,
} from '../../hooks/useReportFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import FiltersIcon from '@/components/icons/filters';

interface ReportFiltersProps {
	// Filter state
	filters: ReportFiltersType;
	setFilters: (filters: ReportFiltersType) => void;
	filterOptions: FilterOptions;
	showFilters: boolean;
	setShowFilters: (show: boolean) => void;
	clearFilters: () => void;
	applyFilters: () => void;

	// Configuration for which filters to show
	title?: string;
	showDateRange?: boolean;
	showOwner?: boolean;
	showPipeline?: boolean;
	showStatus?: boolean;
	showContact?: boolean;

	// Optional styling
	style?: React.CSSProperties;
	className?: string;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
	filters,
	setFilters,
	filterOptions,
	showFilters,
	setShowFilters,
	clearFilters,
	applyFilters,
	title = __('Filters', 'quillcrm'),
	showDateRange = true,
	showOwner = true,
	showPipeline = true,
	showStatus = true,
	showContact = true,
	style,
	className,
}) => {
	return (
		<Card style={{ marginBottom: 20, ...style }} className={className}>
			<CardContent className="p-4">
				<div
					className="flex justify-between items-center"
					style={{ marginBottom: showFilters ? 16 : 0 }}
				>
					<h3 className="text-lg font-semibold leading-none tracking-tight m-0">
						{title}
					</h3>
					<Button
						onClick={() => setShowFilters(!showFilters)}
						variant={showFilters ? 'default' : 'outline'}
						className="flex items-center gap-2"
					>
						<FiltersIcon />
						{__('Filters', 'quillcrm')}
					</Button>
				</div>

				{showFilters && (
					<div className="border-t border-gray-200 pt-4">
						<div className="flex flex-wrap gap-4">
							{/* Date Range Filter */}
							{showDateRange && (
								<div>
									<label className="block text-sm font-medium mb-1">
										{__('Date Range', 'quillcrm')}
									</label>
									<DateRangePicker
										value={
											filters.dateRange
												? {
														from: filters
															.dateRange[0]
															? filters.dateRange[0].toDate()
															: null,
														to: filters.dateRange[1]
															? filters.dateRange[1].toDate()
															: null,
													}
												: { from: null, to: null }
										}
										onChange={(range) =>
											setFilters({
												...filters,
												dateRange:
													range.from && range.to
														? [
																dayjs(
																	range.from
																),
																dayjs(range.to),
															]
														: null,
											})
										}
										className="w-60"
									/>
								</div>
							)}

							{/* Owner Filter */}
							{showOwner && (
								<div>
									<label className="block text-sm font-medium mb-1">
										{__('Owner', 'quillcrm')}
									</label>
									<Select
										value={
											filters.ownerId?.toString() ??
											undefined
										}
										onValueChange={(value) =>
											setFilters({
												...filters,
												ownerId: value
													? parseInt(value)
													: null,
											})
										}
									>
										<SelectTrigger className="w-40">
											<SelectValue
												placeholder={__(
													'Select Owner',
													'quillcrm'
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{filterOptions.owners?.map(
												(owner) => (
													<SelectItem
														key={owner.id}
														value={owner.id.toString()}
													>
														{owner.display_name}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</div>
							)}

							{/* Pipeline Filter */}
							{showPipeline && (
								<div>
									<label className="block text-sm font-medium mb-1">
										{__('Pipeline', 'quillcrm')}
									</label>
									<Select
										value={
											filters.pipelineId?.toString() ??
											undefined
										}
										onValueChange={(value) =>
											setFilters({
												...filters,
												pipelineId: value
													? parseInt(value)
													: null,
											})
										}
									>
										<SelectTrigger className="w-40">
											<SelectValue
												placeholder={__(
													'Select Pipeline',
													'quillcrm'
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{filterOptions.pipelines?.map(
												(pipeline) => (
													<SelectItem
														key={pipeline.id}
														value={pipeline.id.toString()}
													>
														{pipeline.name}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</div>
							)}

							{/* Status Filter */}
							{showStatus && (
								<div>
									<label className="block text-sm font-medium mb-1">
										{__('Status', 'quillcrm')}
									</label>
									<Select
										value={filters.status ?? undefined}
										onValueChange={(value) =>
											setFilters({
												...filters,
												status: value,
											})
										}
									>
										<SelectTrigger className="w-30">
											<SelectValue
												placeholder={__(
													'Select Status',
													'quillcrm'
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="open">
												{__('Open', 'quillcrm')}
											</SelectItem>
											<SelectItem value="won">
												{__('Won', 'quillcrm')}
											</SelectItem>
											<SelectItem value="lost">
												{__('Lost', 'quillcrm')}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							{/* Contact Filter */}
							{showContact && (
								<div>
									<label className="block text-sm font-medium mb-1">
										{__('Contact', 'quillcrm')}
									</label>
									<Select
										value={
											filters.contactId?.toString() ??
											undefined
										}
										onValueChange={(value) =>
											setFilters({
												...filters,
												contactId: value
													? parseInt(value)
													: null,
											})
										}
									>
										<SelectTrigger className="w-40">
											<SelectValue
												placeholder={__(
													'Select Contact',
													'quillcrm'
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{filterOptions.contacts?.map(
												(contact) => (
													<SelectItem
														key={contact.id}
														value={contact.id.toString()}
													>
														{contact.first_name}{' '}
														{contact.last_name}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</div>
							)}

							{/* Action Buttons */}
							<div>
								<label className="block text-sm font-medium mb-1">
									{__('Actions', 'quillcrm')}
								</label>
								<div className="flex gap-2">
									<Button
										onClick={clearFilters}
										variant="outline"
									>
										{__('Clear', 'quillcrm')}
									</Button>
									<Button
										onClick={applyFilters}
										variant="default"
									>
										{__('Apply', 'quillcrm')}
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default ReportFilters;
