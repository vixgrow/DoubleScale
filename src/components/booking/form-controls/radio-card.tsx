import React from 'react';

import { RadioGroupItem } from '@/components/ui/radio-group';

interface RadioCardProps {
	value: string;
	className?: string;
	disabled?: boolean;
	checked?: boolean;
	children: React.ReactNode;
	/** Unique per RadioGroup when the same values appear twice on one page (e.g. cancel + reschedule). */
	groupKey?: string;
}

// shadcn/Radix `<RadioGroupItem>` renders only the radio dot. Migrating from
// antd's `<Radio>label</Radio>` requires wrapping both the dot and the label
// in a clickable `<label>`. This helper preserves the antd ergonomics — pass
// styling and label children, get a card-style radio that also toggles when
// the surrounding text is clicked.
const RadioCard: React.FC<RadioCardProps> = ({
	value,
	className,
	disabled,
	checked,
	children,
	groupKey,
}) => {
	const id = groupKey
		? `radio-card-${groupKey}-${value}`
		: `radio-card-${value}`;
	return (
		<label
			htmlFor={id}
			className={`flex items-center gap-3 cursor-pointer ${
				disabled ? 'cursor-not-allowed opacity-60' : ''
			} ${className ?? ''} ${
				checked ? 'border-primary bg-[#E8E2FB]' : ''
			}`}
		>
			<RadioGroupItem id={id} value={value} disabled={disabled} />
			<span className="flex-1 min-w-0">{children}</span>
		</label>
	);
};

export default RadioCard;
