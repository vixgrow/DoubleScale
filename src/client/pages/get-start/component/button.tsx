import { Button } from '@quillcrm/components/ui/button';
import React from 'react';

interface ButtonComponentProps {
	children: React.ReactNode;
	onClick?: () => void;
	type?: string;
	disabled?: boolean;
}

export default function ButtonComponent({
	children,
	onClick,
	type,
	disabled,
}: ButtonComponentProps) {
	return (
		<Button
			onClick={onClick}
			disabled={disabled}
			variant={
				type === 'go' 
					? 'default' 
					: type === 'no' 
						? 'ghost' 
						: 'outline'
			}
			size="lg"
			className={`rounded-lg ${
				type === 'go'
					? 'bg-primary hover:bg-primary/90 text-primary-foreground'
					: type === 'no'
						? 'text-primary hover:bg-transparent shadow-none border-0'
						: 'border-primary text-primary bg-transparent hover:bg-primary/5'
			}`}
		>
			{children}
		</Button>
	);
}
