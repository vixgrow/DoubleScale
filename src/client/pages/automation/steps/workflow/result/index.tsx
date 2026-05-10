/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { cn } from '@/lib/utils';
/**
 * Internal dependencies
 */
import type { AutomationContact } from '@doublescale/client';
import { CustomDialogHeader, GradientViewIcon } from '@doublescale/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
} from '@/components/ui/dialog';
import {
	automationDialogAccentBarClassName,
	automationDialogBodyClassName,
	automationDialogHeaderClassName,
	automationDialogSurfaceWide,
} from '../automation-dialog-presets';
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
			<DialogContent className={cn(automationDialogSurfaceWide)}>
				<div
					className={automationDialogAccentBarClassName}
					aria-hidden
				/>
				<DialogHeader className={automationDialogHeaderClassName}>
					<CustomDialogHeader
						title={__('View Journey', 'doublescale')}
						subtitle={__(
							`View journey of contact ${contact?.contact?.email || __('Deleted Contact', 'doublescale')}`,
							'doublescale'
						)}
						icon={<GradientViewIcon />}
					/>
				</DialogHeader>
				<div className={automationDialogBodyClassName}>
					<ResultContent contact={contact} />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Result;
