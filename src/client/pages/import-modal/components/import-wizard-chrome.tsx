/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CheckTrueIcon } from '@doublescale/components';
/**
 * internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import { useImportContext } from '../contexts';
import { getImportWizardSteps } from '../source-definitions';
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

const flowBarLogos: Record<string, { src: string; className: string }> = {
	csv: { src: csvIcon, className: 'h-8 w-8 object-contain' },
	wpusers: {
		src: wpusersLogo,
		className: 'h-6 w-[110px] object-contain',
	},
	wc_customers: {
		src: wcCustomersLogo,
		className: 'h-6 w-[110px] object-contain',
	},
	wpfunnelkit: {
		src: funnelkitLogo,
		className: 'h-6 w-[110px] object-contain',
	},
	fluentcrm: {
		src: fluentcrmLogo,
		className: 'h-6 w-[110px] object-contain',
	},
	mailerlite: {
		src: mailerliteLogo,
		className: 'h-6 w-[100px] object-contain',
	},
	activecampaign: {
		src: activecampaignLogo,
		className: 'h-6 w-[150px] object-contain',
	},
	hubspot: {
		src: hubspotLogo,
		className: 'h-6 max-w-[120px] object-contain',
	},
	pipedrive: {
		src: pipedriveLogo,
		className: 'h-6 max-w-[120px] object-contain',
	},
	gohighlevel: {
		src: gohighlevelLogo,
		className: 'h-6 max-w-[120px] object-contain',
	},
	memberpress: {
		src: memberpressLogo,
		className: 'h-6 max-w-[120px] object-contain',
	},
};

/** Csv → DoubleScale flow bar (wizard steps 2+). */
export const ImportSourceFlowBar: React.FC = () => {
	const { state } = useImportContext();
	const { source } = state;

	if (!source) {
		return null;
	}

	const importers = ConfigAPI.getImporters();
	const currentLogo = flowBarLogos[source];
	const sourceName =
		source === 'csv'
			? __('Csv', 'doublescale')
			: importers[source]?.name || source;

	return (
		<div
			className="import-modal__flow-bar flex w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-[#F7F8FA] px-8 py-3.5"
			aria-label={__('Data flow', 'doublescale')}
		>
			<span className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
				{currentLogo && (
					<img
						src={currentLogo.src}
						alt=""
						className={currentLogo.className}
						aria-hidden
					/>
				)}
				{sourceName}
			</span>
			<ChevronRight
				className="h-5 w-5 shrink-0 text-muted-foreground"
				aria-hidden
			/>
			<span className="text-base font-semibold text-foreground">
				{__('DoubleScale', 'doublescale')}
			</span>
		</div>
	);
};

/** Left stepper (green complete / blue active). */
export const ImportWizardSidebar: React.FC = () => {
	const { state } = useImportContext();
	const { source, wizardStep } = state;
	const stepConfig = getImportWizardSteps(source, wizardStep);

	if (!stepConfig) {
		return null;
	}

	const { steps, activeStepId } = stepConfig;

	return (
		<aside
			className="import-modal__wizard-sidebar shrink-0"
			aria-label={__('Import steps', 'doublescale')}
		>
			<ol className="import-modal__wizard-steps">
				{steps.map((step, index) => {
					const isActive = step.id === activeStepId;
					const isComplete = step.id < activeStepId;
					return (
						<li
							key={step.id}
							className={cn(
								'import-modal__wizard-step',
								isActive && 'is-active',
								isComplete && 'is-complete'
							)}
						>
							<span
								className="import-modal__wizard-step-marker"
								aria-hidden
							>
								{isComplete ? (
									<span className="text-white">
										<CheckTrueIcon width={18} height={18} />
									</span>
								) : (
									step.id
								)}
							</span>
							<span className="import-modal__wizard-step-label">
								{step.label}
							</span>
							{index < steps.length - 1 && (
								<span
									className="import-modal__wizard-step-line"
									aria-hidden
								/>
							)}
						</li>
					);
				})}
			</ol>
		</aside>
	);
};
