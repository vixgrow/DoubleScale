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
import { ImportProgressIcon, LoadingSpinner } from '@quillcrm/components';
import { useImportContext } from '../contexts';
import ConfigAPI from '@quillcrm/config';
//@ts-ignore
import csvIcon from '../../../../../assets/images/csv/csv.png';
//@ts-ignore
import hubspotIcon from '../../../../../assets/images/hubspot/hubspot-icon.png';
//@ts-ignore
import pipedriveIcon from '../../../../../assets/images/pipedrive/pipedrive-icon.png';

const ImportProgress: React.FC = () => {
	const { state } = useImportContext();
	const { source, count, offset, importing, showingCompletion } = state;
	const importers = ConfigAPI.getImporters();
	const importer = importers[source] || null;

	// Fix the progress calculation
	const progressPercentage = React.useMemo(() => {
		if (count === 0) return 0;
		if (showingCompletion) return 100; // Always 100% when showing completion
		const validOffset = Math.max(0, offset || 0);
		const validCount = Math.max(1, count || 1);
		return Math.min(100, Math.round((validOffset / validCount) * 100));
	}, [count, offset, showingCompletion]);

	return (
		<div className="w-full h-full flex flex-col items-start justify-start">
			<p className="text-[#09090B] text-2xl text-start">
				{showingCompletion
					? __(`Import Completed!`, 'quillcrm')
					: __(
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
								alt="CSV"
								className="w-16 h-16"
							/>
						) : source === 'hubspot' ? (
							<img
								src={hubspotIcon}
								alt="HubSpot"
								className="w-16 h-16"
							/>
						) : source === 'pipedrive' ? (
							<img
								src={pipedriveIcon}
								alt="Pipedrive"
								className="w-16 h-16"
							/>
						) : (
							<ImportProgressIcon />
						)}
					</div>
					<CardTitle className="text-2xl text-[#09090B] font-normal">
						{importing && progressPercentage < 100
							? __('Importing Contacts...', 'quillcrm')
							: __('Import Completed!', 'quillcrm')}
					</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="flex justify-center gap-2 items-center text-lg text-[#71717A]">
						{importing && progressPercentage < 100 && (
							<div className="flex justify-center">
								<LoadingSpinner size={24} />
							</div>
						)}
						<span>
							{importing && progressPercentage < 100
								? __('In Progress', 'quillcrm')
								: __('Completed Successfully!', 'quillcrm')}
						</span>
					</div>

					<div className="text-center text-sm text-[#71717A]">
						{importing && progressPercentage < 100
							? __(
									'Please wait while we import your contacts...',
									'quillcrm'
								)
							: __(
									'All contacts have been imported successfully. You will be redirected shortly.',
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
