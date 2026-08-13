/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Plug } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTypeformIntegrationStatus } from '@/hooks/use-typeform-integration-status';
import { getToLink, useNavigate } from '@doublescale/navigation';
import { AlertTriangleIcon } from '@doublescale/components';

interface TypeformIntegrationWarningProps {
	className?: string;
}

/**
 * Shown when a Typeform form trigger or connection is used without Integrations setup.
 */
export function TypeformIntegrationWarning({
	className = '',
}: TypeformIntegrationWarningProps) {
	const navigate = useNavigate();
	const { isConnected, isLoading } = useTypeformIntegrationStatus();

	if (isLoading || isConnected) {
		return null;
	}

	return (
		<Alert
			className={`border-amber-200 bg-amber-50 text-amber-950 ${className}`.trim()}
		>
			<AlertTriangleIcon width={20} height={20} color="#D97706" />
			<AlertTitle className="text-amber-900">
				{__('Typeform is not connected', 'doublescale')}
			</AlertTitle>
			<AlertDescription className="text-amber-800 space-y-3">
				<p>
					{__(
						'Add your personal access token under Integrations → Typeform before you can pick a form or map fields.',
						'doublescale'
					)}
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="bg-white hover:bg-amber-50 border-amber-300"
					onClick={() => navigate(getToLink('integrations/typeform'))}
				>
					<Plug className="w-3.5 h-3.5 mr-1.5" />
					{__('Connect Typeform', 'doublescale')}
				</Button>
			</AlertDescription>
		</Alert>
	);
}
