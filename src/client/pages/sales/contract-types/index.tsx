/**
 * Contract types list — standalone page; manager lives in settings.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import { ContractTypesManager } from '../settings/contract-types-manager';

const ContractTypesPage: React.FC = () => {
	const navigate = useNavigate();

	return (
		<div className="max-w-4xl space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">{__('Contract Types', 'doublescale')}</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{__(
							'Organize contracts by type (e.g. Service Agreement, NDA, Retainer).',
							'doublescale'
						)}
					</p>
				</div>
				<Button variant="outline" onClick={() => navigate(getToLink('sales/contracts'))}>
					<ArrowLeft className="mr-1 h-4 w-4" />
					{__('Back to Contracts', 'doublescale')}
				</Button>
			</div>

			<ContractTypesManager />
		</div>
	);
};

export default ContractTypesPage;
