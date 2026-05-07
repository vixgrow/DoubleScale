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

interface VerifiedSender {
	email: string;
	name: string;
	connection_id: string;
}

interface QuillSMTPInfo {
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
}

export const FromEmailSelector: React.FC<FromEmailSelectorProps> = ({
	value,
	onChange,
	error,
	required = true,
	className,
}) => {
	const [open, setOpen] = useState(false);

	// Safely get QuillSMTP info with fallback
	let quillsmtpInfo: QuillSMTPInfo | undefined;
	try {
		quillsmtpInfo = config.getQuillSMTPInfo() as QuillSMTPInfo | undefined;
	} catch (e) {
		console.warn('[DoubleScale] Failed to get QuillSMTP info:', e);
		quillsmtpInfo = undefined;
	}

	// Check if we have verified senders
	const hasVerifiedSenders =
		quillsmtpInfo?.configured &&
		quillsmtpInfo?.verified_senders &&
		quillsmtpInfo.verified_senders.length > 0;

	// Handle selection from dropdown
	const handleSelect = (selectedEmail: string) => {
		const sender = quillsmtpInfo?.verified_senders?.find(
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
					placeholder={__('name@gmail.com', 'doublescale')}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className={cn('h-12 bg-white', error && '!border-red-500 focus-visible:!ring-red-500')}
					required={required}
					style={{
						borderRadius: '8px',
					}}
				/>
				{!quillsmtpInfo?.configured && quillsmtpInfo?.plugin_url && (
					<p className="text-sm text-gray-500 mt-1">
						{__('Install', 'doublescale')}{' '}
						<a
							href={quillsmtpInfo.plugin_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
						>
							QuillSMTP
						</a>{' '}
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
						placeholder={__('name@gmail.com', 'doublescale')}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className={cn(
							'w-full h-12 bg-white',
							error && '!border-red-500 focus-visible:!ring-red-500'
						)}
						style={{
							borderRadius: '8px',
						}}
						required={required}
					/>
				</div>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="h-12 w-12 shrink-0 justify-center p-0"
							type="button"
						>
							<ChevronsUpDown className="h-6 w-6 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[400px] p-0" align="end">
						<Command>
							<CommandList>
								<CommandEmpty>
									{__('No verified senders found.', 'doublescale')}
								</CommandEmpty>
								<CommandGroup heading={__('QuillSMTP Connections', 'doublescale')}>
									{quillsmtpInfo?.verified_senders?.map((sender) => (
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
													<span className="text-sm text-gray-500">
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
			<p className="text-xs text-gray-500 mt-1">
				{__('Type an email as per your domain/SMTP settings. Email mismatch settings may not deliver emails as expected', 'doublescale')}
			</p>
		</div>
	);
};
