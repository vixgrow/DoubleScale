/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { map, isEmpty } from 'lodash';
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
	const { state, updateValues, resetState } = useImportContext();
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
			await new Promise((resolve) => setTimeout(resolve, 1000));
			resetState();
			onImportComplete();
		}
	};

	// Show progress if importing OR showing completion
	if (importing || showingCompletion) {
		return <ImportProgress />;
	}

	if (currentStep === 1) {
		return (
			<>
				{source === 'csv' ? (
					<CsvUpload />
				) : (
					<div>
						{isFetching && <Skeleton className="h-40 w-full" />}

						{importer &&
							['mailerlite', 'activecampaign'].includes(source) &&
							!isEmpty(importer.credentials) &&
							!importing &&
							!isFetching && (
								<ApiCredentials importer={importer} />
							)}

						{!importing &&
							!isFetching &&
							!['mailerlite', 'activecampaign'].includes(
								source
							) && (
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

	// Step 2 - CSV mapping and final configuration
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
															values[key] || {}
														}
														onChange={(value) =>
															updateValues(
																key,
																value
															)
														}
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
};

export default MainContent;
