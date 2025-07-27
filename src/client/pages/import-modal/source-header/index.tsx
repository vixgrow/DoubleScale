/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
/**
 * internal dependencies
 */
import { CardHeader } from '@/components/ui/card';
import { useImportContext } from '../contexts';
import ConfigAPI from '@quillcrm/config';
//@ts-ignore
import csvIcon from '../../../../../assets/images/csv/csv.png';
//@ts-ignore
import wpusersLogo from '../../../../../assets/images/wordpress/wordpress.png';
//@ts-ignore
import wcCustomersLogo from '../../../../../assets/images/woocoomerce/woocommerce.png';
//@ts-ignore
import funnelkitLogo from '../../../../../assets/images/funnelkit/funnelkit.png';
//@ts-ignore
import fluentcrmLogo from '../../../../../assets/images/fluent-crm/fluentcrm.png';
//@ts-ignore
import mailerliteLogo from '../../../../../assets/images/mailer-lite/mailer.png';
//@ts-ignore
import activecampaignLogo from '../../../../../assets/images/active-campaign/activecampaign.png';

const SourceHeader: React.FC = () => {
	const { state } = useImportContext();
	const { source } = state;
	const importers = ConfigAPI.getImporters();

	const sourceLogos = {
		csv: {
			src: csvIcon,
			alt: 'CSV',
			className: 'h-8 w-8',
		},
		wpusers: {
			src: wpusersLogo,
			alt: 'WordPress Users',
			className: 'h-9 w-[137px]',
		},
		wc_customers: {
			src: wcCustomersLogo,
			alt: 'WooCommerce Customers',
			className: 'h-8 w-[136px]',
		},
		wpfunnelkit: {
			src: funnelkitLogo,
			alt: 'FunnelKit',
			className: 'h-8 w-[136px]',
		},
		fluentcrm: {
			src: fluentcrmLogo,
			alt: 'FluentCRM',
			className: 'h-7 w-[136px]',
		},
		mailerlite: {
			src: mailerliteLogo,
			alt: 'MailerLite',
			className: 'h-8 w-[126px]',
		},
		activecampaign: {
			src: activecampaignLogo,
			alt: 'ActiveCampaign',
			className: 'h-8 w-[195px]',
		},
	};

	const currentLogo = sourceLogos[source];

	return (
		<CardHeader className="bg-[#8E9AA80D] rounded-t-[20px]">
			<div className="flex items-center justify-center gap-6">
				<div className="flex items-center gap-3">
					<img
						src={currentLogo?.src}
						alt={importers[source]?.name || source}
						className={currentLogo?.className}
					/>
					{source === 'csv' && (
						<div className="text-[#09090B] text-2xl">
							{__('CSV', 'quillcrm')}
						</div>
					)}
				</div>
				<ChevronRight className="w-6 h-6 text-[#979797]" />
				<div className="text-[#09090B] text-2xl">Quill CRM</div>
			</div>
		</CardHeader>
	);
};

export default SourceHeader;
