/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { X } from 'lucide-react';
/**
 * internal dependencies
 */
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface MembershipOption {
	key: string;
	label: string;
}

interface MembershipFilterProps {
	options: MembershipOption[];
	value: string[];
	onChange: (value: string[]) => void;
}

const MembershipFilter: React.FC<MembershipFilterProps> = ({
	options,
	value,
	onChange,
}) => {
	const toggleMembership = (key: string) => {
		if (value.includes(key)) {
			onChange(value.filter((v) => v !== key));
		} else {
			onChange([...value, key]);
		}
	};

	const removeMembership = (key: string) => {
		onChange(value.filter((v) => v !== key));
	};

	const getLabel = (key: string) => {
		return options.find((o) => o.key === key)?.label || key;
	};

	return (
		<div className="w-full space-y-4">
			{/* Selected memberships badges */}
			{value.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{value.map((key) => (
						<Badge
							key={key}
							variant="secondary"
							className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#274C77]/10 text-[#274C77] border-[#274C77]/20"
						>
							{getLabel(key)}
							<button
								type="button"
								onClick={() => removeMembership(key)}
								className="ml-1 hover:bg-[#274C77]/20 rounded-full p-0.5 transition-colors"
							>
								<X className="w-3 h-3" />
							</button>
						</Badge>
					))}
				</div>
			)}

			{/* Membership checkboxes */}
			<div className="border rounded-lg divide-y">
				{options.map((option) => {
					const isSelected = value.includes(option.key);
					return (
						<label
							key={option.key}
							className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
								isSelected ? 'bg-[#274C77]/5' : ''
							}`}
						>
							<Checkbox
								checked={isSelected}
								onCheckedChange={() =>
									toggleMembership(option.key)
								}
							/>
							<span className="text-sm text-[#2E2C2F]">
								{option.label}
							</span>
						</label>
					);
				})}
			</div>

			{value.length === 0 && (
				<p className="text-sm text-[#71717A]">
					{__(
						'No memberships selected — all members will be imported.',
						'doublescale'
					)}
				</p>
			)}

			{value.length > 0 && (
				<p className="text-sm text-[#71717A]">
					{value.length === 1
						? __('1 membership selected', 'doublescale')
						: `${value.length} ${__('memberships selected', 'doublescale')}`}
				</p>
			)}
		</div>
	);
};

export default MembershipFilter;
