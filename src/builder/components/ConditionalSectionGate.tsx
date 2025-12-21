/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@/components/pro-feature-notice';

interface ConditionalSectionGateProps {
	sectionId: string;
	visible: boolean;
	onClose: () => void;
}

/**
 * Gate component for Conditional Section feature
 * Shows Pro upgrade notice when Pro is not active, otherwise renders Pro component
 */
const ConditionalSectionGate: React.FC<ConditionalSectionGateProps> = ({
	sectionId,
	visible,
	onClose,
}) => {
	// Check if Pro is active
	const isProActive = applyFilters(
		'quillcrm_is_pro_active',
		false
	) as boolean;

	// Try to get Pro component via filter
	const ProComponent = applyFilters(
		'quillcrm_conditional_section_modal',
		null
	) as React.ComponentType<ConditionalSectionGateProps> | null;

	// If Pro is active and component is available, render it
	if (isProActive && ProComponent) {
		return (
			<ProComponent
				sectionId={sectionId}
				visible={visible}
				onClose={onClose}
			/>
		);
	}

	// Show upgrade notice
	if (!visible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
				<ProFeatureNotice
					featureName={__('Conditional Sections', 'quillcrm')}
					description={__(
						'Create dynamic email sections that display conditionally based on contact filters. Show different content to different segments of your audience.',
						'quillcrm'
					)}
				/>
				<div className="mt-4 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 text-gray-600 hover:text-gray-800"
					>
						{__('Close', 'quillcrm')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConditionalSectionGate;
