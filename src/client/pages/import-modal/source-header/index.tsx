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
import { CardHeader } from '@/components/ui/card';
import { useImportContext } from '../contexts';
import ConfigAPI from '@doublescale/config';
//@ts-ignore
import csvIcon from '@doublescale/assets/images/csv/icon.png';
//@ts-ignore
import wpusersLogo from '@doublescale/assets/images/wordpress/wordpress.png';
//@ts-ignore
import wcCustomersLogo from '@doublescale/assets/images/woocoomerce/woocommerce.png';
//@ts-ignore
import funnelkitLogo from '@doublescale/assets/images/funnelkit/funnelkit.png';
//@ts-ignore
import fluentcrmLogo from '@doublescale/assets/images/fluent-crm/fluentcrm.png';
//@ts-ignore
import mailerliteLogo from '@doublescale/assets/images/mailer-lite/mailer.png';
//@ts-ignore
import activecampaignLogo from '@doublescale/assets/images/active-campaign/activecampaign.png';
//@ts-ignore
import hubspotLogo from '@doublescale/assets/images/hubspot/hubspot.png';
//@ts-ignore
import pipedriveLogo from '@doublescale/assets/images/pipedrive/pipedrive.png';
//@ts-ignore
import gohighlevelLogo from '@doublescale/assets/images/gohighlevel/gohighlevel.png';
//@ts-ignore
import memberpressLogo from '@doublescale/assets/images/member-press/memberpress.png';

const SourceHeader: React.FC = () => {
	const { state } = useImportContext();
	const { source } = state;

	if (!source) {
		return null;
	}

	const importers = ConfigAPI.getImporters();

	const sourceLogos = {
		csv: {
			src: csvIcon,
			alt: 'CSV',
			className: 'h-7 w-7',
		},
		wpusers: {
			src: wpusersLogo,
			alt: 'WordPress Users',
			className: 'h-6 w-[110px] object-contain object-left',
		},
		wc_customers: {
			src: wcCustomersLogo,
			alt: 'WooCommerce Customers',
			className: 'h-6 w-[110px] object-contain object-left',
		},
		wpfunnelkit: {
			src: funnelkitLogo,
			alt: 'FunnelKit',
			className: 'h-6 w-[110px] object-contain object-left',
		},
		fluentcrm: {
			src: fluentcrmLogo,
			alt: 'FluentCRM',
			className: 'h-6 w-[110px] object-contain object-left',
		},
		mailerlite: {
			src: mailerliteLogo,
			alt: 'MailerLite',
			className: 'h-6 w-[100px] object-contain object-left',
		},
		activecampaign: {
			src: activecampaignLogo,
			alt: 'ActiveCampaign',
			className: 'h-6 w-[150px] object-contain object-left',
		},
		hubspot: {
			src: hubspotLogo,
			alt: 'HubSpot',
			className: 'h-6 w-auto max-w-[120px] object-contain object-left',
		},
		pipedrive: {
			src: pipedriveLogo,
			alt: 'Pipedrive',
			className: 'h-6 w-auto max-w-[120px] object-contain object-left',
		},
		gohighlevel: {
			src: gohighlevelLogo,
			alt: 'GoHighLevel',
			className: 'h-6 w-auto max-w-[120px] object-contain object-left',
		},
		memberpress: {
			src: memberpressLogo,
			alt: 'MemberPress',
			className: 'h-6 w-auto max-w-[120px] object-contain object-left',
		},
	};

	const currentLogo = sourceLogos[source];
	const sourceName =
		source === 'csv'
			? __('CSV file', 'doublescale')
			: importers[source]?.name || source;

	return (
		<CardHeader className="shrink-0 border-b border-border/50 bg-muted/10 px-4 py-3 sm:px-8">
			<div
				className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm"
				aria-label={__('Data flow', 'doublescale')}
			>
				<span className="inline-flex min-w-0 items-center gap-2 font-medium leading-snug text-foreground">
					<img
						src={currentLogo?.src}
						alt=""
						className={currentLogo?.className}
						aria-hidden
					/>
					<span className="truncate">{sourceName}</span>
				</span>
				<span className="select-none font-light text-muted-foreground/70">
					→
				</span>
				<span className="font-semibold tracking-tight text-foreground">
					{__('DoubleScale', 'doublescale')}
				</span>
			</div>
		</CardHeader>
	);
};

export default SourceHeader;
