import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Shimmer/Loading component for the email builder canvas
 * Displays a skeleton loader while template data is being loaded
 */
const CanvasShimmer: React.FC = () => {
	return (
		<div className="py-4 animate-pulse">
			{/* Email Container Shimmer */}
			<div className="shadow-lg rounded-lg bg-white p-6">
				{/* Section 1 - Header */}
				<div className="mb-6 space-y-4">
					<div className="h-4 bg-gray-200 rounded w-3/4" />
					<div className="h-4 bg-gray-200 rounded w-1/2" />
				</div>

				{/* Section 2 - Image */}
				<div className="mb-6">
					<div className="h-48 bg-gray-200 rounded" />
				</div>

				{/* Section 3 - Two Columns */}
				<div className="mb-6 grid grid-cols-2 gap-4">
					<div className="space-y-3">
						<div className="h-4 bg-gray-200 rounded" />
						<div className="h-4 bg-gray-200 rounded w-5/6" />
						<div className="h-4 bg-gray-200 rounded w-4/6" />
					</div>
					<div className="space-y-3">
						<div className="h-4 bg-gray-200 rounded" />
						<div className="h-4 bg-gray-200 rounded w-5/6" />
						<div className="h-4 bg-gray-200 rounded w-4/6" />
					</div>
				</div>

				{/* Section 4 - Content */}
				<div className="mb-6 space-y-3">
					<div className="h-4 bg-gray-200 rounded" />
					<div className="h-4 bg-gray-200 rounded w-11/12" />
					<div className="h-4 bg-gray-200 rounded w-10/12" />
					<div className="h-4 bg-gray-200 rounded w-9/12" />
				</div>

				{/* Section 5 - Button */}
				<div className="mb-6 flex justify-center">
					<div className="h-12 bg-gray-200 rounded w-40" />
				</div>

				{/* Section 6 - Footer */}
				<div className="space-y-2">
					<div className="h-3 bg-gray-200 rounded w-2/3 mx-auto" />
					<div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
				</div>
			</div>
		</div>
	);
};

export default CanvasShimmer;
