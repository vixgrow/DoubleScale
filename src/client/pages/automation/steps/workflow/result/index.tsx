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
import type { AutomationContact } from '@doublescale/client';
import { CustomDialogHeader, GradientViewIcon } from '@doublescale/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
} from '@doublescale/components/ui/dialog';
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
			<DialogPortal>
				<DialogOverlay className="z-[150200]" />
				<DialogContent className="max-w-[1000px] max-h-[90vh] overflow-y-auto z-[150200]">
					<DialogHeader>
						<CustomDialogHeader
							title={__('View Journey', 'doublescale')}
							subtitle={__(
								`View journey of contact ${contact?.contact.email}`,
								'doublescale'
							)}
							icon={<GradientViewIcon />}
						/>
					</DialogHeader>
					<div>
						<ResultContent contact={contact} />
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default Result;
