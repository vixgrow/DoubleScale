import { __ } from '@wordpress/i18n';
import { ContactFilterSection } from '../contact-filter';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

export default function ListTagFilter() {
	// Create refs to access the ContactFilterSection components
	const includeFilterRef = useRef<{ resetFilters: () => void } | null>(null);
	const excludeFilterRef = useRef<{ resetFilters: () => void } | null>(null);

	// Function to handle clearing all filters
	const handleClearFilters = () => {
		// Reset include filter section
		if (includeFilterRef.current && includeFilterRef.current.resetFilters) {
			includeFilterRef.current.resetFilters();
		}

		// Reset exclude filter section
		if (excludeFilterRef.current && excludeFilterRef.current.resetFilters) {
			excludeFilterRef.current.resetFilters();
		}
	};

	return (
		<div className="space-y-6">
			<ContactFilterSection
				title="Included Contacts"
				description="Select List and Tags that you want to send emails for this campaign. You can create multiple row to send to all of them."
				ref={includeFilterRef}
			/>
			<div className="border-t border-gray-200"></div>
			<ContactFilterSection
				title="Exclude Contacts"
				description="Select List and Tags that you want to Exclude from this campaign. Exclude contacts will be subtracted from your included selection."
				ref={excludeFilterRef}
			/>

			<div className="border-t border-gray-200"></div>

			<div>
				<Button
					variant="secondaryDeepBlue"
					onClick={handleClearFilters}
				>
					{__('Clear Filters', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
}
