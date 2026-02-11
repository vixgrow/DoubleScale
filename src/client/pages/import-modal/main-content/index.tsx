/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { map } from 'lodash';
/**
 * internal dependencies
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import CsvUpload from '../csv-upload';
import ApiCredentials from '../credentials-form';
import FieldMapping from '../field-mapping';
import ContactProfile from '../contact-profile';
import StepNavigation from '../steps-navigation';
import ImportProgress from '../import-progress';
import { ContactMappedFields } from '@quillcrm/components';
import { useImportContext } from '../contexts';
import { useImportActions } from '../use-importActions';
import ConfigAPI from '@quillcrm/config';

interface MainContentProps {
	onImportComplete: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onImportComplete }) => {
	const { state, updateValues } = useImportContext();
	const {
		currentStep,
		source,
		importing,
		showingCompletion, // Add this
		isFetching,
		sourceData,
		fileData,
		values,
	} = state;

	const { importContacts } = useImportActions();
	const importers = ConfigAPI.getImporters();
	const importer = importers[source] || null;

	const handleImportContacts = async () => {
		const success = await importContacts();
		if (success) {
			// Don't auto-close - let the user see the summary first
			// The ImportProgress component will show a "Close" button
		}
	};

	// Show progress if importing OR showing completion
	if (importing || showingCompletion) {
		return <ImportProgress onComplete={onImportComplete} />;
	}

	if (currentStep === 1) {
		return (
			<>
				{source === 'csv' ? (
					<CsvUpload />
				) : (
					<div>
						{isFetching && <Skeleton className="h-40 w-full" />}

					{/* Integration-based importers: Show credentials first (step 1) */}
					{importer &&
						[
							'mailerlite',
							'activecampaign',
							'hubspot',
							'pipedrive',
							'gohighlevel',
						].includes(source) &&
						importer.credentials &&
						Object.keys(importer.credentials || {}).length >
							0 &&
						!importing &&
						!isFetching &&
						currentStep === 1 && (
							<div>
								<h3 className="text-lg font-semibold mb-4">
									{__(
										'Step 1: Enter API Credentials',
										'quillcrm'
									)}
								</h3>
								<ApiCredentials importer={importer} />
							</div>
						)}

					{/* FluentCRM and FunnelKit: Show field mapping with lists/tags after data loads */}
					{!importing &&
						!isFetching &&
						['fluentcrm', 'wpfunnelkit'].includes(source) &&
						sourceData && (
							<div className="space-y-6">
								<FieldMapping importer={importer} />
								<ContactProfile />
							</div>
						)}

					{/* Other importers: Show field mapping directly */}
					{!importing &&
						!isFetching &&
						![
							'mailerlite',
							'activecampaign',
							'hubspot',
							'pipedrive',
							'gohighlevel',
							'fluentcrm',
							'wpfunnelkit',
						].includes(source) && (
							<div className="space-y-6">
								<FieldMapping importer={importer} />
								<ContactProfile />
							</div>
						)}
					</div>
				)}

				<StepNavigation
					importer={importer}
					onImportContacts={handleImportContacts}
				/>
			</>
		);
	}

	// Step 2 - Integration importers field mapping and CSV mapping
	if (currentStep === 2) {
		// Integration-based importers: Show field mapping after credentials validated
		if (
			importer &&
			[
				'mailerlite',
				'activecampaign',
				'hubspot',
				'pipedrive',
				'gohighlevel',
			].includes(source) &&
			sourceData
		) {
			return (
				<div className="space-y-6">
					<h3 className="text-lg font-semibold mb-4">
						{__('Step 2: Configure Import Settings', 'quillcrm')}
					</h3>
					<FieldMapping importer={importer} />
					<ContactProfile />
					<StepNavigation
						importer={importer}
						onImportContacts={handleImportContacts}
					/>
				</div>
			);
		}

		// CSV mapping and final configuration
		return (
			<div className="w-full">
				<div className="max-w-4xl mx-auto">
					{source === 'csv' && fileData && (
						<Card className="shadow-none rounded-2xl mb-8">
							<div className="p-6">
								<h3 className="text-2xl font-normal text-[#09090B] mb-2">
									{__('Mapping the file', 'quillcrm')}
								</h3>
								<p className="text-lg text-[#71717A] mb-6">
									{__(
										'Select the column field you want to map it on the system to import.',
										'quillcrm'
									)}
								</p>

								{importer && sourceData && (
									<div>
										{map(
											sourceData,
											(field, key) =>
												field.type ===
													'contact_mapped_fields' && (
													<div
														key={key}
														className="space-y-3"
													>
														<label className="text-base">
															{field.label}
														</label>
													<ContactMappedFields
														fields={
															fileData
																? fileData.header_columns.reduce(
																		(
																			acc,
																			field
																		) => {
																			acc[
																				field
																			] =
																				{
																					label: field,
																				};
																			return acc;
																		},
																		{}
																	)
																: field.options
														}
														values={
															values[key] ||
															{}
														}
														onChange={(value) =>
															updateValues(
																key,
																value
															)
														}
														source={source}
													/>
													</div>
												)
										)}
									</div>
								)}
							</div>
						</Card>
					)}

					<ContactProfile
						showStatusField={[
							'csv',
							'wpusers',
							'wc_customers_customers',
						].includes(source)}
					/>

					<StepNavigation
						importer={importer}
						onImportContacts={handleImportContacts}
					/>
				</div>
			</div>
		);
	}

	// Fallback (should not reach here in normal flow)
	return null;
};

export default MainContent;
