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
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InstallIcon } from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';
import { useImportContext } from '../contexts';
//@ts-ignore
import csvIcon from '../../../../../assets/images/csv/csv.png';
//@ts-ignore
import wpusersIcon from '../../../../../assets/images/wordpress/wordpress-icon.png';
//@ts-ignore
import wcCustomersIcon from '../../../../../assets/images/woocoomerce/woo-icon.png';
//@ts-ignore
import funnelkitIcon from '../../../../../assets/images/funnelkit/funnelkit-icon.png';
//@ts-ignore
import fluentcrmIcon from '../../../../../assets/images/fluent-crm/fluent-icon.png';
//@ts-ignore
import mailerliteIcon from '../../../../../assets/images/mailer-lite/mailer-icon.png';
//@ts-ignore
import activecampaignIcon from '../../../../../assets/images/active-campaign/active-icon.png';
//@ts-ignore
import hubspotIcon from '../../../../../assets/images/hubspot/hubspot-icon.png';
//@ts-ignore
import pipedriveIcon from '../../../../../assets/images/pipedrive/pipedrive-icon.png';
//@ts-ignore
import gohighlevelIcon from '../../../../../assets/images/gohighlevel/gohighlevel-icon.png';

const SourceSelector: React.FC = () => {
	const { state, dispatch } = useImportContext();
	const { source, importing } = state;
	const importers = ConfigAPI.getImporters();

	const getSourceIcon = (sourceKey: string) => {
		const iconMap = {
			csv: <img src={csvIcon} alt="CSV" className="w-10 h-10" />,
			wpusers: (
				<img
					src={wpusersIcon}
					alt="WordPress Users"
					className="w-10 h-10"
				/>
			),
			wc_customers: (
				<img
					src={wcCustomersIcon}
					alt="WooCommerce Customers"
					className="w-10 h-6"
				/>
			),
			wpfunnelkit: (
				<img src={funnelkitIcon} alt="FunnelKit" className="w-10 h-6" />
			),
			fluentcrm: (
				<img
					src={fluentcrmIcon}
					alt="FluentCRM"
					className="w-10 h-10"
				/>
			),
			mailerlite: (
				<img
					src={mailerliteIcon}
					alt="MailerLite"
					className="w-10 h-10"
				/>
			),
			activecampaign: (
				<img
					src={activecampaignIcon}
					alt="ActiveCampaign"
					className="w-10 h-10"
				/>
			),
			hubspot: (
				<img src={hubspotIcon} alt="HubSpot" className="w-10 h-10" />
			),
			pipedrive: (
				<img
					src={pipedriveIcon}
					alt="Pipedrive"
					className="w-10 h-10"
				/>
			),
			gohighlevel: (
				<img
					src={gohighlevelIcon}
					alt="GoHighLevel"
					className="w-10 h-10"
				/>
			),
		};
		return (
			iconMap[sourceKey] || (
				<img src={csvIcon} alt="Default" className="w-10 h-10" />
			)
		);
	};

	const sources = map(importers, (importer, slug) => ({
		label: importer.name,
		value: slug,
		disabled: !importer.is_active,
		icon: getSourceIcon(slug),
		requiresCredentials: [
			'mailerlite',
			'activecampaign',
			'hubspot',
			'pipedrive',
			'gohighlevel',
		].includes(slug),
	})).filter((source) => {
		// Hide FluentCRM and FunnelKit when they are not active
		if (['wpfunnelkit', 'fluentcrm'].includes(source.value)) {
			return source.disabled === false; // Only show if active
		}
		return true; // Show all other sources
	});

	const handleSourceChange = (newSource: string) => {
		// Prevent source change when importing is in progress
		if (importing) {
			return;
		}

		dispatch({ type: 'SET_SOURCE', payload: newSource });
		dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });

		if (newSource !== 'csv') {
			dispatch({ type: 'SET_FILE_DATA', payload: null });
			dispatch({
				type: 'SET_VALUES',
				payload: { ...state.values, file_name: '' },
			});
		}
	};

	return (
		<Card className="p-6 shadow-none rounded-[20px]">
			<CardHeader className="mb-6 p-0">
				<CardTitle className="text-2xl font-normal text-[#09090B]">
					{__('Import From', 'quillcrm')}
				</CardTitle>
				<CardDescription className="text-[#979797] text-base">
					{__(
						'Select Source from where you want to import your contacts',
						'quillcrm'
					)}
				</CardDescription>
			</CardHeader>

			<CardContent className="p-0 space-y-3">
				{sources.map((s) => {
					const isSelected = source === s.value;
					const isLocked = importing && !isSelected;

					return (
						<Card
							key={s.value}
							onClick={() =>
								!s.disabled && !importing && handleSourceChange(s.value)
							}
							className={`relative p-4 transition-all shadow-none border duration-200 
                ${isSelected
									? 'border-[#274C77] cursor-pointer'
									: s.disabled
										? 'border-[#E2EAF380] bg-gray-50 cursor-not-allowed opacity-50'
										: isLocked
											? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
											: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
								}`}
						>
							<div className="flex items-center space-x-4">
								<div>{s.icon}</div>

								<div className="flex justify-between items-start w-full">
									<div>
										<h3 className="text-lg text-[#2E2C2F]">
											{s.label}
										</h3>
										<p className="text-sm text-[#979797]">
											{__(
												'Select Source from where you want to import your contacts',
												'quillcrm'
											)}
										</p>
									</div>

									{s.disabled && !['wpfunnelkit', 'fluentcrm'].includes(s.value) && (
										<Button className="bg-[#3B82F6] rounded-full text-xs px-2 py-1">
											<InstallIcon />
											{__('INSTALL NOW', 'quillcrm')}
										</Button>
									)}
								</div>
							</div>
						</Card>
					);
				})}
			</CardContent>
		</Card>
	);
};

export default SourceSelector;
