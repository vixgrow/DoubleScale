/**
 * wordpress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
/**
 * internal dependencies
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ImportProgressIcon, LoadingSpinner, ExternalLinkIcon } from '@doublescale/components';
import { useImportContext } from '../contexts';
import ConfigAPI from '@doublescale/config';
//@ts-ignore
import csvIcon from '@doublescale/assets/images/csv/icon.png';
//@ts-ignore
import hubspotIcon from '@doublescale/assets/images/hubspot/hubspot-icon.png';
//@ts-ignore
import pipedriveIcon from '@doublescale/assets/images/pipedrive/pipedrive-icon.png';
//@ts-ignore
import gohighlevelIcon from '@doublescale/assets/images/gohighlevel/gohighlevel-icon.png';
import { getToLink } from '@doublescale/navigation';

interface ImportProgressProps {
	onComplete?: () => void;
}

const ImportProgress: React.FC<ImportProgressProps> = ({ onComplete }) => {
	const { state } = useImportContext();
	const { source, count, offset, importing, showingCompletion, importStats } = state;
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
					? __('Import Completed!', 'doublescale')
					: sprintf(
							/* translators: %s: import source name, e.g. "HubSpot". */
							__('Importing %s Contacts', 'doublescale'),
							importer?.name || source
						)}
			</p>
			<span className="text-lg text-[#71717A]">
				{__(
					'the list, tags will be assigned to contacts and status of DoubleScale contacts profile.',
					'doublescale'
				)}
			</span>

			<Card className="w-full lg:p-6 p-0 lg:mt-6 mt-4 shadow-none">
				<CardHeader className="text-center">
					<div className="flex items-center justify-center mx-auto lg:mb-6 mb-4">
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
						) : source === 'gohighlevel' ? (
							<img
								src={gohighlevelIcon}
								alt="GoHighLevel"
								className="w-16 h-16"
							/>
						) : (
							<ImportProgressIcon />
						)}
					</div>
					<CardTitle className="text-2xl text-[#09090B] font-normal">
						{importing && progressPercentage < 100
							? __('Importing Contacts...', 'doublescale')
							: __('Import Completed!', 'doublescale')}
					</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="flex justify-center gap-2 items-center text-lg text-[#71717A]">
						{importing && progressPercentage < 100 && (
							<div className="flex justify-center">
								<LoadingSpinner size={24} />
							</div>
						)}
						<span className="text-center">
							{importing && progressPercentage < 100
								? __('In Progress', 'doublescale')
								: __('Completed Successfully!', 'doublescale')}
						</span>
					</div>

					<div className="text-center text-sm text-[#71717A]">
						{importing && progressPercentage < 100
							? __(
									'Please wait while we import your contacts...',
									'doublescale'
								)
							: __(
									'All contacts have been processed. You will be redirected shortly.',
									'doublescale'
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

					{/* Import Statistics */}
					{showingCompletion && (importStats.imported > 0 || importStats.skipped > 0 || importStats.failed > 0) && (
						<div className="mt-4 pt-4 border-t border-gray-200">
							<h4 className="text-sm font-medium text-gray-700 mb-3 text-center">
								{__('Import Summary', 'doublescale')}
							</h4>
							<div className="grid grid-cols-3 gap-4">
								<div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
									<CheckCircle2 className="w-6 h-6 text-green-600 mb-1" />
									<span className="text-lg font-semibold text-green-700">
										{importStats.imported}
									</span>
									<span className="text-xs text-green-600">
										{__('Imported', 'doublescale')}
									</span>
								</div>
								<div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
									<MinusCircle className="w-6 h-6 text-yellow-600 mb-1" />
									<span className="text-lg font-semibold text-yellow-700">
										{importStats.skipped}
									</span>
									<span className="text-xs text-yellow-600">
										{__('Skipped', 'doublescale')}
									</span>
								</div>
								<div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
									<XCircle className="w-6 h-6 text-red-600 mb-1" />
									<span className="text-lg font-semibold text-red-700">
										{importStats.failed}
									</span>
									<span className="text-xs text-red-600">
										{__('Failed', 'doublescale')}
									</span>
								</div>
							</div>
							{importStats.skipped > 0 && (
								<p className="text-xs text-gray-500 text-center mt-2">
									{__('Skipped contacts already exist and "Update existing" was not enabled.', 'doublescale')}
								</p>
							)}
							{importStats.failed > 0 && (
								<div className="text-center mt-3">
									<p className="text-xs text-gray-500 mb-2">
										{__('Failed contacts may have invalid email addresses or other data issues.', 'doublescale')}
									</p>
									<Link to={getToLink('settings/system')}>
										<Button
											variant="outline"
											size="sm"
											className="text-xs"
										>
											<ExternalLinkIcon width={24} height={24} className="w-6 h-6 mr-1" />
											{__('View Log Management', 'doublescale')}
										</Button>
									</Link>
								</div>
							)}
						</div>
					)}

					{/* Close button when import is complete */}
					{showingCompletion && onComplete && (
						<div className="mt-6 flex justify-center">
							<Button
								onClick={onComplete}
								className="px-8"
							>
								{__('Close', 'doublescale')}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default ImportProgress;
