/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { PanelLayout } from '@quillcrm/components';
import type { Campaign } from '@quillcrm/client';

interface StepLayoutProps {
	children: ReactNode;
	breadcrumbItems?: { label: string; href?: string }[];
	panelButtons?: ReactNode[];
	showNavigation?: boolean;
	onNext?: () => void | Promise<void>;
	onBack?: () => void | Promise<void>;
	totalSteps?: number;
	currentStep?: number;
	type?: 'campaign' | 'automation' | 'default';
}

/**
 * Shared step layout component that wraps common campaign step functionality
 */
const StepLayout: React.FC<StepLayoutProps> = ({
	children,
	breadcrumbItems = [],
	panelButtons = [],
	showNavigation = true,
	onNext,
	onBack,
	totalSteps,
	currentStep,
	type = 'campaign',
}) => {
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	) as Campaign | null;

	const loading = useSelect(
		(select: any) => select('quillcrm/campaign').isLoading(),
		[]
	);

	// Show loading state
	if (loading && !campaign) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">Loading...</div>
			</div>
		);
	}

	// Show error state if no campaign
	if (!campaign) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center text-red-500">
					Campaign not found
				</div>
			</div>
		);
	}

	return (
		<PanelLayout
			items={breadcrumbItems}
			panelbtns={panelButtons}
			type={type}
			totalSteps={totalSteps}
			currentStep={currentStep}
			onNext={showNavigation ? onNext : undefined}
			onBack={showNavigation ? onBack : undefined}
		>
			{children}
		</PanelLayout>
	);
};

export default StepLayout;
