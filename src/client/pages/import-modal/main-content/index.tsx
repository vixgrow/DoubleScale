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
import { ContactMappedFields } from '@doublescale/components';
import { useImportContext } from '../contexts';
import { useImportActions } from '../use-importActions';
import ConfigAPI from '@doublescale/config';
import {
	isIntegrationApiImportSource,
	isThreeStepImportSource,
} from '../source-definitions';

interface MainContentProps {
	onImportComplete: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onImportComplete }) => {
	const { state, updateValues } = useImportContext();
	const {
		wizardStep,
		currentStep,
		source,
		importing,
		showingCompletion,
		isFetching,
		sourceData,
		fileData,
		values,
	} = state;

	const { importContacts } = useImportActions();
	const importers = ConfigAPI.getImporters();
	const importer = source ? importers[source] || null : null;

	const handleImportContacts = async () => {
		const success = await importContacts();
		if (success) {
			// ImportProgress shows Close
		}
	};

	if (importing || showingCompletion) {
		return <ImportProgress onComplete={onImportComplete} />;
	}

	if (wizardStep === 1) {
		return null;
	}

	// CSV — step 2: file upload only
	if (source === 'csv' && wizardStep === 2) {
		return (
			<>
				<CsvUpload />
				<StepNavigation onImportContacts={handleImportContacts} />
			</>
		);
	}

	// CSV — step 3: column mapping + profile + import
	if (source === 'csv' && wizardStep === 3) {
		return (
			<div className="w-full">
				<div className="mx-auto max-w-4xl">
					{fileData && (
						<Card className="mb-6 rounded-xl border border-border/70 shadow-none">
							<div className="space-y-4 p-5 sm:p-6">
								<div className="space-y-2">
									<h3 className="text-lg font-semibold leading-snug text-foreground">
										{__('Map your columns', 'doublescale')}
									</h3>
									<p className="text-sm leading-relaxed text-muted-foreground">
										{__(
											'Match each CSV column to a contact field before importing.',
											'doublescale'
										)}
									</p>
								</div>

								{importer && sourceData && (
									<div>
										{map(
											sourceData,
											(field, key) =>
												field.type === 'contact_mapped_fields' && (
													<div key={key} className="space-y-2">
														<label className="text-sm font-medium text-foreground">
															{field.label}
														</label>
														<ContactMappedFields
															fields={
																fileData
																	? fileData.header_columns.reduce(
																			(acc, col) => {
																				acc[col] = { label: col };
																				return acc;
																			},
																			{} as Record<string, { label: string }>
																		)
																	: field.options
															}
															values={values[key] || {}}
															onChange={(value) => updateValues(key, value)}
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

					<div className="mt-6">
						<ContactProfile
							showStatusField={['csv', 'wpusers', 'wc_customers'].includes(
								source
							)}
						/>
					</div>

					<StepNavigation onImportContacts={handleImportContacts} />
				</div>
			</div>
		);
	}

	// API integrations (MailerLite, ActiveCampaign, etc.) — wizard step 2: credentials only
	if (
		source &&
		isIntegrationApiImportSource(source) &&
		wizardStep === 2
	) {
		return (
			<>
				<div>
					{isFetching && <Skeleton className="h-40 w-full" />}

					{importer &&
						importer.credentials &&
						Object.keys(importer.credentials || {}).length > 0 &&
						!importing &&
						!isFetching && (
							<div className="space-y-3">
								<h3 className="text-lg font-semibold leading-snug text-foreground">
									{__('Connect your account', 'doublescale')}
								</h3>
								<ApiCredentials importer={importer} />
							</div>
						)}
				</div>

				<StepNavigation onImportContacts={handleImportContacts} />
			</>
		);
	}

	// API integrations — wizard step 3: field mapping + profile + import
	if (
		source &&
		isIntegrationApiImportSource(source) &&
		wizardStep === 3 &&
		sourceData
	) {
		return (
			<div className="space-y-6">
				<h3 className="text-lg font-semibold leading-snug text-foreground">
					{__('Configure import', 'doublescale')}
				</h3>
				<FieldMapping importer={importer} />
				<ContactProfile />
				<StepNavigation onImportContacts={handleImportContacts} />
			</div>
		);
	}

	// Two-step sources (WordPress, WooCommerce, FluentCRM, FunnelKit, MemberPress, …)
	if (
		source &&
		!isThreeStepImportSource(source) &&
		wizardStep === 2 &&
		currentStep === 1
	) {
		return (
			<>
				<div>
					{isFetching && <Skeleton className="h-40 w-full" />}

					{!importing &&
						!isFetching &&
						['fluentcrm', 'wpfunnelkit', 'memberpress'].includes(source) &&
						sourceData && (
							<div className="space-y-6">
								<FieldMapping importer={importer} />
								<ContactProfile />
							</div>
						)}

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
							'memberpress',
						].includes(source) && (
							<div className="space-y-6">
								<FieldMapping importer={importer} />
								<ContactProfile />
							</div>
						)}
				</div>

				<StepNavigation onImportContacts={handleImportContacts} />
			</>
		);
	}

	return null;
};

export default MainContent;
