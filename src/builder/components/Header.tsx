import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewIcon, RedoIcon, UndoIcon } from '@/components/icons';
import BreadcrumbComponent from '@/components/breadcrumb';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useNavigate, getToLink } from '@quillcrm/navigation';

const Header: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	);
	const { saveCampaignStep } = useDispatch('quillcrm/campaign');

	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const globalSettings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);
	const buttonSettings = useSelect(
		(select) => select(STORE_KEY).getAllButtonSettings(),
		[]
	);
	const existingTemplateData = useSelect(
		(select: any) => select('quillcrm/campaign').getStepData('template'),
		[]
	);
	const canUndo = useSelect((select) => select(STORE_KEY).canUndo(), []);
	const canRedo = useSelect((select) => select(STORE_KEY).canRedo(), []);

	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		if (!campaign) {
			return;
		}

		try {
			setSaving(true);

			// Create the builder data to save in template's email_body field
			const builderData = {
				sections: sections,
				globalSettings: globalSettings,
				buttonSettings: buttonSettings,
			};

			// Get existing template data to preserve all fields
			const existingTemplate = existingTemplateData?.template || {};

			// Update only the email_body field, preserving all other template fields
			const templateStepData = {
				template: {
					...existingTemplate, // Preserve existing fields (subject, from_email, etc.)
					email_body: {
						type: 'builder',
						value: builderData,
					},
					lastModified: new Date().toISOString(),
				},
			};

			// Save the template step with builder data and navigate to contacts
			const saveSuccess = await saveCampaignStep(
				'template',
				templateStepData
			);

			if (saveSuccess) {
				navigate(getToLink(`campaigns/${campaign.id}/contacts`));
			} else {
				console.error('Failed to save builder data');
				// TODO: Add notification system for error feedback
			}
		} catch (error: any) {
			console.error('Failed to save builder data:', error);
			// TODO: Add notification system for error feedback
		} finally {
			setSaving(false);
		}
	};
	return (
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
					onClick={handleSave}
					disabled={saving}
				>
					{saving
						? __('Saving...', 'quillcrm')
						: __('Save & Continue', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default Header;
