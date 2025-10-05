import React from 'react';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewIcon, RedoIcon, UndoIcon } from '@/components/icons';
import BreadcrumbComponent from '@/components/breadcrumb';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { useAutoSave } from '../hooks/useAutoSave';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { SaveStatusIndicator } from './SaveStatusIndicator';

const Header: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	);

	const canUndo = useSelect((select) => select(STORE_KEY).canUndo(), []);
	const canRedo = useSelect((select) => select(STORE_KEY).canRedo(), []);

	// Use auto-save hook
	const { isSaving, lastSaved, hasUnsavedChanges, error, save } = useAutoSave(
		{
			interval: 2000, // Auto-save every 2 seconds
			enabled: true,
		}
	);

	// Use unsaved changes warning
	useUnsavedChanges({
		hasUnsavedChanges,
	});

	const handleSaveAndContinue = async () => {
		if (!campaign) {
			return;
		}

		const saveSuccess = await save();
		if (saveSuccess) {
			navigate(getToLink(`campaigns/${campaign.id}/contacts`));
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
			<div className="flex items-center gap-3">
				<SaveStatusIndicator
					isSaving={isSaving}
					lastSaved={lastSaved}
					hasUnsavedChanges={hasUnsavedChanges}
					error={error}
				/>
				<div className="h-6 w-px bg-border" />
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
				<div className="h-6 w-px bg-border" />
				<Button
					variant="outline"
					className="px-3 text-muted-foreground"
				>
					<PreviewIcon />
					{__('Preview & test', 'quillcrm')}
				</Button>
				<Button
					variant="outline"
					className="px-3"
					onClick={() => save()}
					disabled={isSaving || !hasUnsavedChanges}
					title={__('Save now', 'quillcrm')}
				>
					{__('Save', 'quillcrm')}
				</Button>
				<Button
					variant="default"
					className="px-3"
					onClick={handleSaveAndContinue}
					disabled={isSaving}
				>
					{isSaving
						? __('Saving...', 'quillcrm')
						: __('Save & Continue', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default Header;
