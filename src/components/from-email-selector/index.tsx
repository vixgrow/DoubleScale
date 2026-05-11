import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import config from '@/config';
import { cn } from '@/lib/utils';
import { useNavigate, getToLink } from '@doublescale/navigation';

interface VerifiedSender {
	email: string;
	name: string;
	connection_id: string;
}

interface smtpInfo {
	configured: boolean;
	verified_senders?: VerifiedSender[];
	config_url?: string;
	plugin_url?: string;
}

interface FromEmailSelectorProps {
	value: string;
	onChange: (email: string, name?: string) => void;
	error?: string;
	required?: boolean;
	className?: string;
	placeholder?: string;
}

export const FromEmailSelector: React.FC<FromEmailSelectorProps> = ({
	value,
	onChange,
	error,
	required = true,
	className,
	placeholder,
}) => {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

	// Safely get smtp info with fallback
	let smtpInfo: smtpInfo | undefined;
	try {
		smtpInfo = config.getsmtpInfo() as smtpInfo | undefined;
	} catch (e) {
		console.warn('[DoubleScale] Failed to get smtp info:', e);
		smtpInfo = undefined;
	}

	// Check if we have verified senders
	const hasVerifiedSenders =
		smtpInfo?.configured &&
		smtpInfo?.verified_senders &&
		smtpInfo.verified_senders.length > 0;

	// Handle selection from dropdown
	const handleSelect = (selectedEmail: string) => {
		const sender = smtpInfo?.verified_senders?.find(
			(s) => s.email === selectedEmail
		);
		onChange(selectedEmail, sender?.name || undefined);
		setOpen(false);
	};

	// If no verified senders, just show input
	if (!hasVerifiedSenders) {
		return (
			<div className={className}>
				<Input
					type="email"
					placeholder={placeholder || __('name@gmail.com', 'doublescale')}
					value={value}
					onChange={(e) => onChange(e.target.value)}
				className={cn(error && '!border-destructive focus-visible:!ring-destructive/20')}
				required={required}
				/>
			{!smtpInfo?.configured && (
				<p className="text-xs text-muted-foreground mt-1">
					{__('Install', 'doublescale')}{' '}
					<button
						type="button"
						onClick={() => navigate(getToLink('extensions') + '&search=smtp')}
						className="text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
					>
						smtp
					</button>{' '}
					{__('for easier email management', 'doublescale')}
				</p>
			)}
			</div>
		);
	}

	// Render combo input with dropdown
	return (
		<div className={cn('w-full', className)}>
			<div className="flex gap-2 items-center w-full">
				<div className="flex-1 min-w-0">
					<Input
						type="email"
						placeholder={placeholder || __('name@gmail.com', 'doublescale')}
						value={value}
						onChange={(e) => onChange(e.target.value)}
					className={cn(
						'w-full',
						error && '!border-destructive focus-visible:!ring-destructive/20'
					)}
						required={required}
					/>
				</div>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="h-10 w-10 shrink-0 justify-center p-0"
							type="button"
						>
							<ChevronsUpDown className="h-4 w-4 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[400px] p-0" align="end">
						<Command>
							<CommandList>
								<CommandEmpty>
									{__('No verified senders found.', 'doublescale')}
								</CommandEmpty>
								<CommandGroup heading={__('smtp Connections', 'doublescale')}>
									{smtpInfo?.verified_senders?.map((sender) => (
										<CommandItem
											key={sender.connection_id}
											value={sender.email}
											onSelect={handleSelect}
										>
											<Check
												className={cn(
													'mr-2 h-4 w-4',
													value === sender.email
														? 'opacity-100'
														: 'opacity-0'
												)}
											/>
											<div className="flex flex-col">
												<span className="font-medium">
													{sender.email}
												</span>
												{sender.name && (
												<span className="text-sm text-muted-foreground">
													{sender.name}
												</span>
												)}
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>
			<p className="text-xs text-muted-foreground mt-1">
				{__('Type an email as per your domain/SMTP settings. Email mismatch settings may not deliver emails as expected', 'doublescale')}
			</p>
		</div>
	);
};
