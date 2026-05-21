/**
 * wordpress dependencies
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
import ConfigAPI from '@doublescale/config';
//@ts-ignore
import csvIcon from '@doublescale/assets/images/csv/icon.png';
//@ts-ignore
import wpusersIcon from '@doublescale/assets/images/wordpress/wordpress-icon.png';
//@ts-ignore
import wcCustomersIcon from '@doublescale/assets/images/woocoomerce/woo-icon.png';
//@ts-ignore
import funnelkitIcon from '@doublescale/assets/images/funnelkit/funnelkit-icon.png';
//@ts-ignore
import fluentcrmIcon from '@doublescale/assets/images/fluent-crm/fluent-icon.png';
//@ts-ignore
import mailerliteIcon from '@doublescale/assets/images/mailer-lite/mailer-icon.png';
//@ts-ignore
import activecampaignIcon from '@doublescale/assets/images/active-campaign/active-icon.png';
//@ts-ignore
import hubspotIcon from '@doublescale/assets/images/hubspot/hubspot-icon.png';
//@ts-ignore
import pipedriveIcon from '@doublescale/assets/images/pipedrive/pipedrive-icon.png';
//@ts-ignore
import gohighlevelIcon from '@doublescale/assets/images/gohighlevel/gohighlevel-icon.png';
//@ts-ignore
import memberpressIcon from '@doublescale/assets/images/member-press/memberpress.png';

/** Importers that use API credentials then a separate mapping step (3-step flow with CSV). */
export const INTEGRATION_API_IMPORT_SLUGS = [
	'mailerlite',
	'activecampaign',
	'hubspot',
	'pipedrive',
	'gohighlevel',
] as const;

/**
 * Importers that depend on a separately-installed WordPress plugin.
 * Hidden from the source grid when their source plugin isn't active —
 * users with no FluentCRM / FunnelKit / MemberPress / WooCommerce installed
 * don't need to see those sources at all.
 */
const PLUGIN_DEPENDENT_IMPORT_SLUGS = new Set<string>([
	'fluentcrm',
	'wpfunnelkit',
	'memberpress',
	'wc_customers',
]);

export function isIntegrationApiImportSource(slug: string): boolean {
	return (INTEGRATION_API_IMPORT_SLUGS as readonly string[]).includes(slug);
}

/** CSV + API integrations: source → upload or connect → map / configure import. */
export function isThreeStepImportSource(source: string): boolean {
	if (!source) {
		return false;
	}
	return source === 'csv' || isIntegrationApiImportSource(source);
}

export type ImportWizardStepItem = {
	id: number;
	label: string;
};

/** Shared wizard step labels for sidebar + breadcrumb (wizard step 2+). */
export function getImportWizardSteps(
	source: string,
	wizardStep: number
): { steps: ImportWizardStepItem[]; activeStepId: number } | null {
	if (!source || wizardStep < 2) {
		return null;
	}

	if (source === 'csv') {
		return {
			steps: [
				{
					id: 1,
					label: __('Upload CSV file', 'doublescale'),
				},
				{
					id: 2,
					label: __('Mapping & Contact Profile', 'doublescale'),
				},
			],
			activeStepId: wizardStep === 2 ? 1 : 2,
		};
	}

	if (isIntegrationApiImportSource(source)) {
		return {
			steps: [
				{
					id: 1,
					label: __('Connect your account', 'doublescale'),
				},
				{
					id: 2,
					label: __('Mapping & Contact Profile', 'doublescale'),
				},
			],
			activeStepId: wizardStep === 2 ? 1 : 2,
		};
	}

	if (!isThreeStepImportSource(source)) {
		return {
			steps: [
				{
					id: 1,
					label: __('Configure import', 'doublescale'),
				},
			],
			activeStepId: 1,
		};
	}

	return null;
}

export function getImportWizardActiveStepLabel(
	source: string,
	wizardStep: number
): string | null {
	const config = getImportWizardSteps(source, wizardStep);
	if (!config) {
		return null;
	}
	const active = config.steps.find((s) => s.id === config.activeStepId);
	return active?.label ?? null;
}

export type ImporterSourceItem = {
	label: string;
	value: string;
	disabled: boolean;
	icon: React.ReactNode;
	requiresCredentials: boolean;
};

export function getSourceIconNode(sourceKey: string): React.ReactNode {
	const iconMap: Record<string, React.ReactNode> = {
		csv: <img src={csvIcon} alt="" className="h-10 w-10 object-contain" />,
		wpusers: (
			<img src={wpusersIcon} alt="" className="h-10 w-10 object-contain" />
		),
		wc_customers: (
			<img src={wcCustomersIcon} alt="" className="h-6 w-10 object-contain" />
		),
		wpfunnelkit: (
			<img src={funnelkitIcon} alt="" className="h-6 w-10 object-contain" />
		),
		fluentcrm: (
			<img src={fluentcrmIcon} alt="" className="h-10 w-10 object-contain" />
		),
		mailerlite: (
			<img src={mailerliteIcon} alt="" className="h-10 w-10 object-contain" />
		),
		activecampaign: (
			<img
				src={activecampaignIcon}
				alt=""
				className="h-10 w-10 object-contain"
			/>
		),
		hubspot: <img src={hubspotIcon} alt="" className="h-10 w-10 object-contain" />,
		pipedrive: (
			<img src={pipedriveIcon} alt="" className="h-10 w-10 object-contain" />
		),
		gohighlevel: (
			<img src={gohighlevelIcon} alt="" className="h-10 w-10 object-contain" />
		),
		memberpress: (
			<img src={memberpressIcon} alt="" className="h-10 w-10 object-contain" />
		),
	};
	return iconMap[sourceKey] ?? (
		<img src={csvIcon} alt="" className="h-10 w-10 object-contain" />
	);
}

/** Stable grid order: common flows first, then WordPress ecosystem, then any extra importers. */
const IMPORT_SOURCE_GRID_ORDER: string[] = [
	'csv',
	'mailerlite',
	'activecampaign',
	'hubspot',
	'pipedrive',
	'gohighlevel',
	'fluentcrm',
	'wpfunnelkit',
	'memberpress',
	'wpusers',
	'wc_customers',
];

export function buildImporterSourcesList(): ImporterSourceItem[] {
	const importers = ConfigAPI.getImporters();
	const items = map(importers, (importer, slug) => ({
		label: importer.name,
		value: slug,
		disabled: !importer.is_active,
		icon: getSourceIconNode(slug),
		requiresCredentials: isIntegrationApiImportSource(slug),
	})).filter(
		(item) =>
			!(PLUGIN_DEPENDENT_IMPORT_SLUGS.has(item.value) && item.disabled)
	);

	const orderIndex = (slug: string) => {
		const i = IMPORT_SOURCE_GRID_ORDER.indexOf(slug);
		return i === -1 ? IMPORT_SOURCE_GRID_ORDER.length : i;
	};

	return items.sort((a, b) => {
		const d = orderIndex(a.value) - orderIndex(b.value);
		return d !== 0 ? d : a.label.localeCompare(b.label);
	});
}

/**
 * WordPress plugin install screen search path (appended to `ConfigAPI.getAdminUrl()`).
 * Used when an importer is inactive because a plugin is missing.
 */
export function getImporterDisabledInstallPath(slug: string): string | null {
	const paths: Record<string, string> = {
		fluentcrm: 'plugin-install.php?s=fluent-crm&tab=search&type=term',
		wpfunnelkit:
			'plugin-install.php?s=wp-marketing-automations&tab=search&type=term',
		memberpress: 'plugin-install.php?s=memberpress&tab=search&type=term',
		wc_customers: 'plugin-install.php?s=woocommerce&tab=search&type=term',
	};
	return paths[slug] ?? null;
}

export function getSourceSubtitle(item: ImporterSourceItem): string {
	if (item.requiresCredentials) {
		return __(
			'API connection, then map fields (3 steps)',
			'doublescale'
		);
	}
	return __('Upload or sync contacts', 'doublescale');
}
