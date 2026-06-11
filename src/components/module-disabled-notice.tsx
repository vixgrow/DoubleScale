/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import type { FC } from 'react';

/**
 * DoubleScale dependencies
 */
import { useModulesDialog } from '../client/pages/settings/modules/modules-dialog';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type ModuleDisabledNoticeProps = {
	featureName: string;
	className?: string;
};

/**
 * Shown when a toggleable module is off: keeps the UI surface visible and points users to Modules settings.
 */
const ModuleDisabledNotice: FC<ModuleDisabledNoticeProps> = ({
	featureName,
	className = '',
}) => {
	const { openModulesDialog } = useModulesDialog();

	return (
		<Card
			className={`border-dashed border-muted-foreground/40 bg-muted/20 shadow-none ${className}`.trim()}
		>
			<CardContent className="py-8 px-6 flex flex-col items-center text-center gap-3">
				<p className="text-sm font-medium text-foreground">
					{sprintf(
						/* translators: %s: feature name (e.g. Lead Scoring) */
						__('%s is turned off', 'doublescale'),
						featureName
					)}
				</p>
				<p className="text-xs text-muted-foreground max-w-md leading-relaxed">
					{__(
						'Enable this module from Control Modules in the header, then reload the page if needed.',
						'doublescale'
					)}
				</p>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={openModulesDialog}
				>
					{__('Open Modules', 'doublescale')}
				</Button>
			</CardContent>
		</Card>
	);
};

export default ModuleDisabledNotice;
