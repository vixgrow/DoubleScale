import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface EmailSequenceModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (name: string) => void;
	title: string;
	initialValue?: string;
	isLoading?: boolean;
}

const EmailSequenceModal: React.FC<EmailSequenceModalProps> = ({
	open,
	onOpenChange,
	onSubmit,
	title,
	initialValue = '',
	isLoading = false,
}) => {
	const [name, setName] = useState(initialValue);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (name.trim()) {
			onSubmit(name);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label
								htmlFor="name"
								className="text-right col-span-1"
							>
								{__('Name', 'quillcrm')}
							</Label>
							<div className="col-span-3">
								<Input
									id="name"
									placeholder={__(
										'Enter a name for your email sequence',
										'quillcrm'
									)}
									value={name}
									onChange={(e) => setName(e.target.value)}
									autoFocus
									required
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							type="button"
						>
							{__('Cancel', 'quillcrm')}
						</Button>
						<Button
							type="submit"
							disabled={!name.trim() || isLoading}
						>
							{isLoading
								? __('Saving...', 'quillcrm')
								: __('Save', 'quillcrm')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default EmailSequenceModal;
