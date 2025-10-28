/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
/**
 * Internal dependencies
 */
import type { AutomationContact } from '@quillcrm/client';
import {
	CustomDialogHeader,
	GradientViewIcon,
} from '@quillcrm/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogOverlay,
} from '@quillcrm/components/ui/dialog';
import ResultContent from './content';

interface ResultProps {
	contact: AutomationContact | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const Result: React.FC<ResultProps> = ({ contact, open, onOpenChange }) => {
	if (!contact) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogOverlay className="z-[150200]" />
			<DialogContent className="max-w-[1000px] max-h-[90vh] overflow-y-auto z-[150200]">
				<DialogHeader>
					<CustomDialogHeader
						title={__('View Journey', 'quillcrm')}
						subtitle={__(
							`View journey of contact ${contact?.contact.email}`,
							'quillcrm'
						)}
						icon={<GradientViewIcon />}
					/>
				</DialogHeader>
				<div>
					<ResultContent contact={contact} />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Result;
