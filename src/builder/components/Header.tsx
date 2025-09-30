import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewIcon, RedoIcon, UndoIcon } from '@/components/icons';
import BreadcrumbComponent from '@/components/breadcrumb';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import * as emailBuilderApi from '../../api/email-builder-api';
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
	const dispatch = useDispatch();
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const globalSettings = useSelect((select) => select(STORE_KEY).getGlobalSettings(), []);
	const buttonSettings = useSelect((select) => select(STORE_KEY).getAllButtonSettings(), []);
	const canUndo = useSelect((select) => select(STORE_KEY).canUndo(), []);
	const canRedo = useSelect((select) => select(STORE_KEY).canRedo(), []);
	
	const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
	const [name, setName] = useState('');
	const [subject, setSubject] = useState('');
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		try {
			if (!name) {
				setSaveError(__('Template name is required', 'quillcrm'));
				return;
			}

			setSaveError(null);
			setSaving(true);
			
		const data = {
			name,
			subject: subject || name,
			body: JSON.stringify(sections),
			settings: JSON.stringify({
				global: globalSettings,
				buttons: buttonSettings,
			}),
			type: 'email',
		};
		
		await emailBuilderApi.createTemplate(data);
			setSaveSuccess(true);
			setTimeout(() => {
				setSaveSuccess(false);
				setSaveDialogOpen(false);
			}, 1500);
		} catch (error: any) {
			setSaveError(
				error.message || __('Failed to save template', 'quillcrm')
			);
		} finally {
			setSaving(false);
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
					<Button
						variant="outline"
						className="px-3"
						onClick={() => dispatch(STORE_KEY).undo()}
						disabled={!canUndo}
						title={__('Undo last action', 'quillcrm')}
					>
						<UndoIcon />
					</Button>
					<Button
						variant="outline"
						className="px-3"
						onClick={() => dispatch(STORE_KEY).redo()}
						disabled={!canRedo}
						title={__('Redo last action', 'quillcrm')}
					>
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
