// import { __ } from '@wordpress/i18n';
// import { DateRangePicker } from "@/components/ui/date-range-picker"
// import { Button } from "@/components/ui/button"
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
// import { RefreshCw } from "lucide-react";
// import { useState } from "react";
// import { cn } from "@/lib/utils";

// interface ActivitiesFiltersProps {
//   filters: {
//     activity_type: string;
//     sort_by: string;
//     sort_order: string;
//     date_from: string;
//     date_to: string;
//   };
//   onChange: (key: string, value: any) => void;
//   onDateChange: (from: string, to: string) => void;
//   onClear: () => void;
//   onRefresh: () => void;
// }

// const ActivitiesFilters: React.FC<ActivitiesFiltersProps> = ({
//   filters,
//   onChange,
//   onDateChange,
//   onClear,
//   onRefresh,
// }) => {
//   const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

//   return (
//     <div className="flex flex-wrap items-center gap-3 w-full">
//       {/* Activity Type */}
//       <Select
//         value={filters.activity_type}
//         onValueChange={(value) => onChange("activity_type", value)}
//       >
//         <SelectTrigger className=" h-10 py-[5px] px-4 rounded-[8px] border border-[#DEE1E6]">
//           <SelectValue placeholder={__("Select Deal Source ", "quillcrm")} />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="created">{__("Created", "quillcrm")}</SelectItem>
//           <SelectItem value="stage_changed">{__("Stage Changed", "quillcrm")}</SelectItem>
//           <SelectItem value="value_changed">{__("Value Changed", "quillcrm")}</SelectItem>
//           <SelectItem value="status_changed">{__("Status Changed", "quillcrm")}</SelectItem>
//           <SelectItem value="note_added">{__("Note Added", "quillcrm")}</SelectItem>
//           <SelectItem value="email_sent">{__("Email Sent", "quillcrm")}</SelectItem>
//           <SelectItem value="call_logged">{__("Call Logged", "quillcrm")}</SelectItem>
//           <SelectItem value="meeting_scheduled">{__("Meeting Scheduled", "quillcrm")}</SelectItem>
//         </SelectContent>
//       </Select>

//       {/* Date Range */}
//       {/* <DateRangePicker
//         value={dateRange}
//         onChange={(range) => {
//           setDateRange(range);
//           onDateChange(
//             range?.from?.toISOString() || "",
//             range?.to?.toISOString() || ""
//           );
//         }}
//       /> */}

//       {/* Sort */}
//       <Select
//         value={`${filters.sort_by}-${filters.sort_order}`}
//         onValueChange={(value) => {
//           const [sort_by, sort_order] = value.split("-");
//           onChange("sort_by", sort_by);
//           onChange("sort_order", sort_order);
//         }}
//       >
//         <SelectTrigger className="w-[150px]">
//           <SelectValue placeholder={__("Sort by", "quillcrm")} />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="created_at-desc">{__("Newest", "quillcrm")}</SelectItem>
//           <SelectItem value="created_at-asc">{__("Oldest", "quillcrm")}</SelectItem>
//         </SelectContent>
//       </Select>

//       {/* Actions */}
//       <div className="flex items-center gap-2">
//         <Button variant="outline" onClick={onClear}>
//           {__("Clear Filters", "quillcrm")}
//         </Button>
//         <Button variant="ghost" onClick={onRefresh}>
//           <RefreshCw className="w-4 h-4 mr-1" />
//           {__("Refresh", "quillcrm")}
//         </Button>
//       </div>
//     </div>
//   );
// };
// export default ActivitiesFilters;
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@quillcrm/components/ui/date-range-picker';

interface ActivitiesFiltersProps {
	filters: {
		activity_type: string;
		sort_by: string;
		sort_order: string;
		date_from?: string;
		date_to?: string;
	};
	onChange: (key: string, value: any) => void;
	onDateChange: (from: string, to: string) => void;
	onClear: () => void;
	onApply: () => void;
}

const ActivitiesFilters: React.FC<ActivitiesFiltersProps> = ({
	filters,
	onChange,
	onDateChange,
	onClear,
	onApply,
}) => {
	return (
		<div className="flex flex-col md:flex-row md:items-end gap-6 w-full">
			{/* Activity Type */}
			<div className="flex flex-col w-full md:w-1/4">
				<label className="text-base font-normal text-[#09090B] mb-1">
					{__('Activity Type', 'quillcrm')}
				</label>
				<Select
					value={filters.activity_type}
					onValueChange={(value) => onChange('activity_type', value)}
				>
					<SelectTrigger className="w-full h-12 shadow-none rounded-[8px] border border-[#DEE1E6] text-[#09090B] bg-white font-normal text-base tracking-[-.5px]">
						<SelectValue
							placeholder={__('Select Activity Type', 'quillcrm')}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="created">
							{__('Created', 'quillcrm')}
						</SelectItem>
						<SelectItem value="stage_changed">
							{__('Stage Changed', 'quillcrm')}
						</SelectItem>
						<SelectItem value="value_changed">
							{__('Value Changed', 'quillcrm')}
						</SelectItem>
						<SelectItem value="status_changed">
							{__('Status Changed', 'quillcrm')}
						</SelectItem>
						<SelectItem value="note_added">
							{__('Note Added', 'quillcrm')}
						</SelectItem>
						<SelectItem value="email_sent">
							{__('Email Sent', 'quillcrm')}
						</SelectItem>
						<SelectItem value="call_logged">
							{__('Call Logged', 'quillcrm')}
						</SelectItem>
						<SelectItem value="meeting_scheduled">
							{__('Meeting Scheduled', 'quillcrm')}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Expected Close Date */}
			<div className="flex flex-col w-full md:w-1/4">
				<label className="text-base font-normal text-[#09090B] mb-1">
					{__('Expected Close Date', 'quillcrm')}
				</label>
				<div className="relative z-[120]">
					<DateRangePicker
						value={{
							from: filters.date_from
								? new Date(filters.date_from)
								: null,
							to: filters.date_to ? new Date(filters.date_to) : null,
						}}
						onChange={(range) => {
							onDateChange(
								range?.from?.toISOString() || '',
								range?.to?.toISOString() || ''
							);
						}}
						placeholder={__('From - To', 'quillcrm')}
						className="w-full h-12 shadow-none rounded-[8px] border border-[#DEE1E6] text-[#09090B] bg-white font-normal text-base tracking-[-.5px]"
					/>
				</div>
			</div>

			{/* Sort */}
			<div className="flex flex-col w-full md:w-1/4">
				<label className="text-base font-normal text-[#09090B] mb-1">
					{__('Sort By', 'quillcrm')}
				</label>
				<Select
					value={`${filters.sort_by}-${filters.sort_order}`}
					onValueChange={(value) => {
						const [sort_by, sort_order] = value.split('-');
						onChange('sort_by', sort_by);
						onChange('sort_order', sort_order);
					}}
				>
					<SelectTrigger className="w-full h-12 shadow-none rounded-[8px] border border-[#DEE1E6] text-[#09090B] bg-white font-normal text-base tracking-[-.5px]">
						<SelectValue placeholder={__('Sort by', 'quillcrm')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="created_at-desc">
							{__('Newest', 'quillcrm')}
						</SelectItem>
						<SelectItem value="created_at-asc">
							{__('Oldest', 'quillcrm')}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-4 mt-2">
				<Button
					variant="outline"
					onClick={onClear}
					className="w-full h-12 rounded-[8px] border border-[#E13B3B] bg-[#FFF] text-[#E13B3B] py-[5px] px-6 hover:border-[#E13B3B] hover:text-[#E13B3B] "
				>
					{__('Clear Filters', 'quillcrm')}
				</Button>
				<Button
					variant="default"
					onClick={onApply}
					className="w-full h-12 rounded-[8px] py-[5px] px-6  bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white flex   font-manrope text-base font-normal tracking-tight"
				>
					{__('Apply Filters', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default ActivitiesFilters;
