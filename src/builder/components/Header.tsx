import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewIcon, RedoIcon, UndoIcon } from '@/components/icons';
import BreadcrumbComponent from '@/components/breadcrumb';
import { useBuilder } from '../context/BuilderContext';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Header: React.FC = () => {
	const { saveTemplate, saving } = useBuilder();
	const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
	const [name, setName] = useState('');
	const [subject, setSubject] = useState('');
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);

	const handleSave = async () => {
		try {
			if (!name) {
				setSaveError(__('Template name is required', 'quillcrm'));
				return;
			}

			setSaveError(null);
			await saveTemplate(name, subject);
			setSaveSuccess(true);
			setTimeout(() => {
				setSaveSuccess(false);
				setSaveDialogOpen(false);
			}, 1500);
		} catch (error: any) {
			setSaveError(
				error.message || __('Failed to save template', 'quillcrm')
			);
		}
	};
	return (
		<>
			<div className="flex items-center justify-between p-4 bg-primary-foreground border-b border-input">
				<div className="flex items-center align-center gap-2">
					<X className="h-5 w-5 text-primary" />
					<BreadcrumbComponent
						items={[
							{ label: __('Create Campaign', 'quillcrm') },
							{ label: __('Standard Campaign', 'quillcrm') },
							{ label: __('Email Template', 'quillcrm') },
						]}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" className="px-3">
						<UndoIcon />
					</Button>
					<Button variant="outline" className="px-3">
						<RedoIcon />
					</Button>
					<Button
						variant="outline"
						className="px-3 text-muted-foreground"
					>
						<PreviewIcon />
						{__('Preview & test', 'quillcrm')}
					</Button>
					<Button
						variant="default"
						className="px-3"
						onClick={() => setSaveDialogOpen(true)}
						disabled={saving}
					>
						{saving
							? __('Saving...', 'quillcrm')
							: __('Save Template', 'quillcrm')}
					</Button>
				</div>
			</div>

			<Dialog open={isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>
							{__('Save Template', 'quillcrm')}
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						{saveError && (
							<div className="bg-red-50 text-red-600 p-2 rounded text-sm">
								{saveError}
							</div>
						)}
						{saveSuccess && (
							<div className="bg-green-50 text-green-600 p-2 rounded text-sm">
								{__('Template saved successfully!', 'quillcrm')}
							</div>
						)}
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								{__('Name', 'quillcrm')}
							</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="col-span-3"
								placeholder={__(
									'Enter template name',
									'quillcrm'
								)}
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="subject" className="text-right">
								{__('Subject', 'quillcrm')}
							</Label>
							<Input
								id="subject"
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
								className="col-span-3"
								placeholder={__(
									'Enter email subject',
									'quillcrm'
								)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setSaveDialogOpen(false)}
							disabled={saving}
						>
							{__('Cancel', 'quillcrm')}
						</Button>
						<Button
							type="submit"
							onClick={handleSave}
							disabled={saving}
						>
							{saving
								? __('Saving...', 'quillcrm')
								: __('Save', 'quillcrm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default Header;
