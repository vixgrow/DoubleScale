import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxCardProps {
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
	className?: string;
	children: React.ReactNode;
}

// shadcn/Radix `<Checkbox>` is a self-closing 18×18 control. Migrating from
// antd's `<Checkbox>label</Checkbox>` ergonomics requires wrapping both the
// box and the label in a clickable `<label>`. Use this whenever an
// antd-style `<Checkbox>some label</Checkbox>` needs to be ported.
const CheckboxCard: React.FC<CheckboxCardProps> = ({
	checked,
	disabled,
	onCheckedChange,
	className,
	children,
}) => {
	return (
		<label
			className={`flex items-center gap-2 ${
				disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
			} ${className ?? ''}`}
		>
			<Checkbox
				checked={checked}
				disabled={disabled}
				onCheckedChange={(value) => onCheckedChange(Boolean(value))}
			/>
			<span className="flex-1 min-w-0">{children}</span>
		</label>
	);
};

export default CheckboxCard;
