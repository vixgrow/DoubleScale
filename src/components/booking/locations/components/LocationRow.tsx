import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';

interface LocationRowProps {
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
	children: React.ReactNode;
}

// shadcn/Radix `<Checkbox>` is a self-closing 18×18 control and does not
// render children. The location sections want a full-width clickable row with
// the checkbox on the left and rich content (icon + text + actions) on the
// right, which is the antd `<Checkbox>` pattern. This wraps both in a `<label>`
// so clicking anywhere on the row toggles the checkbox while nested
// `<Button>`s keep their own click handlers via `e.stopPropagation()`.
const LocationRow: React.FC<LocationRowProps> = ({
	checked,
	disabled,
	onCheckedChange,
	children,
}) => {
	return (
		<label
			className={`flex items-center gap-3 border rounded-lg p-4 w-full transition-all duration-300 ${
				disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
			} ${
				checked
					? 'border-primary bg-secondary'
					: 'border-[#D3D4D6] bg-white'
			}`}
		>
			<Checkbox
				checked={checked}
				disabled={disabled}
				onCheckedChange={(value) => onCheckedChange(Boolean(value))}
			/>
			<div className="flex-1 min-w-0">{children}</div>
		</label>
	);
};

export default LocationRow;
