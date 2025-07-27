/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImportProgressIcon } from '@quillcrm/components';
import LoadingSpinner from '../loading-spin';
import { useImportContext } from '../contexts';
import ConfigAPI from '@quillcrm/config';
//@ts-ignore
import csvIcon from '../../../../../assets/images/csv/csv.png';

const ImportProgress: React.FC = () => {
	const { state } = useImportContext();
	const { source, count, offset, importing } = state;
	const importers = ConfigAPI.getImporters();
	const importer = importers[source] || null;

	// Fix the progress calculation
	const progressPercentage = React.useMemo(() => {
		if (!importing) return 0;
		if (count === 0) return 0;

		// Make sure we have valid numbers
		const validOffset = Math.max(0, offset || 0);
		const validCount = Math.max(1, count || 1);

		return Math.min(100, Math.round((validOffset / validCount) * 100));
	}, [count, offset, importing]);

	// Debug logging
	React.useEffect(() => {
		console.log('ImportProgress state:', {
			importing,
			count,
			offset,
			progressPercentage,
		});
	}, [importing, count, offset, progressPercentage]);

	return (
		<div className="w-full h-full flex flex-col items-start justify-start">
			<p className="text-[#09090B] text-2xl text-start">
				{__(
					`Importing ${importer?.name || source} Contacts`,
					'quillcrm'
				)}
			</p>
			<span className="text-lg text-[#71717A]">
				{__(
					'the list, tags will be assigned to contacts and status of Quill CRM contacts profile.',
					'quillcrm'
				)}
			</span>

			<Card className="w-full p-6 mt-6 shadow-none">
				<CardHeader className="text-center">
					<div className="flex items-center justify-center mx-auto mb-6">
						{source === 'csv' ? (
							<img
								src={csvIcon}
								alt="Default"
								className="w-16 h-16"
							/>
						) : (
							<ImportProgressIcon />
						)}
					</div>
					<CardTitle className="text-2xl text-[#09090B] font-normal">
						{importing
							? __('Importing Contacts...', 'quillcrm')
							: __('Import Completed', 'quillcrm')}
					</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="flex justify-center gap-2 items-center text-lg text-[#71717A]">
						{importing && (
							<div className="flex justify-center">
								<LoadingSpinner size={24} />
							</div>
						)}
						<span>
							{importing
								? __('In Progress', 'quillcrm')
								: __('Completed', 'quillcrm')}
						</span>
					</div>

					<div className="text-center text-sm text-[#71717A]">
						{importing
							? __(
									'Please wait while we import your contacts...',
									'quillcrm'
								)
							: __(
									'You will be redirected to contacts list shortly.',
									'quillcrm'
								)}
					</div>

					<div className="space-y-2">
						<Progress
							value={progressPercentage}
							className="w-full"
						/>
						<div className="flex justify-between items-center text-sm text-gray-600">
							<span>
								{offset || 0} of {count || 0} contacts processed
							</span>
							<span>{progressPercentage}%</span>
						</div>
					</div>

					{/* Debug info - remove in production */}
					<div className="mt-2 text-xs text-gray-400 border-t pt-2">
						Debug: importing={importing ? 'true' : 'false'}, offset=
						{offset}, count={count}, progress={progressPercentage}%
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default ImportProgress;
