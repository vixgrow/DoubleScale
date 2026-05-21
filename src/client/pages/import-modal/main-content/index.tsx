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
import CsvUpload from '../csv-upload';
import ApiCredentials from '../credentials-form';
import FieldMapping from '../field-mapping';
import ContactProfile from '../contact-profile';
import ImportProgress from '../import-progress';
import { ContactMappedFields } from '@doublescale/components';
import { useImportContext } from '../contexts';
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

	const importers = ConfigAPI.getImporters();
	const importer = source ? importers[source] || null : null;

	if (importing || showingCompletion) {
		return <ImportProgress onComplete={onImportComplete} />;
	}

	if (wizardStep === 1) {
		return null;
	}

	// CSV — step 2: file upload only
	if (source === 'csv' && wizardStep === 2) {
		return <CsvUpload />;
	}

	// CSV — step 3: column mapping + profile + import
	if (source === 'csv' && wizardStep === 3) {
		const csvColumns = fileData
			? fileData.header_columns.reduce(
				(acc, col) => {
					acc[col] = { label: col };
					return acc;
				},
				{} as Record<string, { label: string }>
			)
			: {};

		return (
			<div className="import-modal-mapping flex min-w-0 w-full max-w-full flex-col gap-6">
				{fileData &&
					importer &&
					sourceData &&
					map(
						sourceData,
						(field, key) =>
							field.type === 'contact_mapped_fields' && (
								<ContactMappedFields
									key={key}
									fields={csvColumns}
									values={values[key] || {}}
									onChange={(value) =>
										updateValues(key, value)
									}
									source={source}
								/>
							)
					)}

				<ContactProfile
					showStatusField={['csv', 'wpusers', 'wc_customers'].includes(
						source
					)}
					importSectionLayout
				/>
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
			<div className="import-modal-mapping flex min-w-0 w-full max-w-full flex-col gap-6">
				<FieldMapping importer={importer} />
				<ContactProfile importSectionLayout />
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

			</>
		);
	}

	return null;
};

export default MainContent;
