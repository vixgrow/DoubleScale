import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewIcon, RedoIcon, UndoIcon } from '@/components/icons';
import BreadcrumbComponent from '@/components/breadcrumb';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useCampaignContext } from '../../client/pages/campaign/state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';

const Header: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { campaign, saveCampaignStep } = useCampaignContext();

	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const globalSettings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);
	const buttonSettings = useSelect(
		(select) => select(STORE_KEY).getAllButtonSettings(),
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

			// Create the template data structure that matches the campaign template format
			const templateData = {
				name: campaign.name || __('Email Template', 'quillcrm'),
				type: 'email',
				subject: campaign.name || __('Email Template', 'quillcrm'),
				body: JSON.stringify(sections),
				settings: JSON.stringify({
					global: globalSettings,
					buttons: buttonSettings,
				}),
				from_name: '',
				from_email: '',
				reply_to: '',
				preview_text: '',
				enable_utm: false,
				utm_source: '',
				utm_medium: '',
				utm_name: '',
				utm_term: '',
				utm_content: '',
			};

			// Save the template data to the campaign
			const builderStepData = {
				templates: [templateData], // Array format to match campaign structure
			};

			// Save the step with template data and navigate to contacts
			const saveSuccess = await saveCampaignStep(
				'contacts',
				builderStepData
			);
			if (saveSuccess) {
				navigate(getToLink(`campaigns/${campaign.id}/contacts`));
			}
		} catch (error: any) {
			console.error('Failed to save template:', error);
			// You could add a notification system here if available
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
