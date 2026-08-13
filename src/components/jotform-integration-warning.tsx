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
import { useJotformIntegrationStatus } from '@/hooks/use-jotform-integration-status';
import { getToLink, useNavigate } from '@doublescale/navigation';
import { AlertTriangleIcon } from '@doublescale/components';

interface JotformIntegrationWarningProps {
	className?: string;
}

/**
 * Shown when a Jotform form trigger or connection is used without Integrations setup.
 */
export function JotformIntegrationWarning({
	className = '',
}: JotformIntegrationWarningProps) {
	const navigate = useNavigate();
	const { isConnected, isLoading } = useJotformIntegrationStatus();

	if (isLoading || isConnected) {
		return null;
	}

	return (
		<Alert
			className={`border-amber-200 bg-amber-50 text-amber-950 ${className}`.trim()}
		>
			<AlertTriangleIcon width={20} height={20} color="#D97706" />
			<AlertTitle className="text-amber-900">
				{__('Jotform is not connected', 'doublescale')}
			</AlertTitle>
			<AlertDescription className="text-amber-800 space-y-3">
				<p>
					{__(
						'Add your API key under Integrations → Jotform before you can pick a form or map fields.',
						'doublescale'
					)}
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="bg-white hover:bg-amber-50 border-amber-300"
					onClick={() => navigate(getToLink('integrations/jotform'))}
				>
					<Plug className="w-3.5 h-3.5 mr-1.5" />
					{__('Connect Jotform', 'doublescale')}
				</Button>
			</AlertDescription>
		</Alert>
	);
}
