/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { ArrowRight, Info, Plug } from 'lucide-react';
import { useState } from 'react';

/**
 * Internal dependencies
 */
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import ProAutomationModal from '@doublescale/components/pro-automation-modal';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
import { useTypeformIntegrationStatus } from '@/hooks/use-typeform-integration-status';
import { useJotformIntegrationStatus } from '@/hooks/use-jotform-integration-status';
import ConfigAPI from '@doublescale/config';
import { getToLink, useNavigate } from '@doublescale/navigation';
//@ts-ignore
import contact from '../../../../../../assets/images/form-types/contact.png';
//@ts-ignore
import elementor from '../../../../../../assets/images/form-types/elementor.png';
//@ts-ignore
import fluentForms from '../../../../../../assets/images/form-types/fluentforms.png';
//@ts-ignore
import formidable from '../../../../../../assets/images/form-types/formidable.png';
//@ts-ignore
import forminator from '../../../../../../assets/images/form-types/forminator.png';
//@ts-ignore
import gravityForms from '../../../../../../assets/images/form-types/gravityforms.png';
//@ts-ignore
import metForm from '../../../../../../assets/images/form-types/metform.png';
//@ts-ignore
import ninjaForms from '../../../../../../assets/images/form-types/ninjaforms.png';
//@ts-ignore
import quillForms from '../../../../../../assets/images/form-types/quillforms.png';
//@ts-ignore
import wpForms from '../../../../../../assets/images/form-types/wpforms.png';
//@ts-ignore
import wsForms from '../../../../../../assets/images/form-types/wsforms.png';
//@ts-ignore
import bitForms from '../../../../../../assets/images/form-types/bitforms.png';
//@ts-ignore
import sureForms from '../../../../../../assets/images/form-types/sureforms.png';

interface FormTypeSelectorProps {
	forms: any;
	selectedType: string;
	onSelect: (value: string) => void;
}

type FormPlatform = 'wordpress' | 'saas';

type FormTypeDefaults = {
	label: string;
	is_pro: boolean;
	platform: FormPlatform;
};

const ALL_FORM_TYPES: Record<string, FormTypeDefaults> = {
	contactform7: { label: 'Contact Form 7', is_pro: false, platform: 'wordpress' },
	wpforms: { label: 'WPForms', is_pro: false, platform: 'wordpress' },
	fluentforms: { label: 'Fluent Forms', is_pro: false, platform: 'wordpress' },
	quillforms: { label: 'Quill Forms', is_pro: false, platform: 'wordpress' },
	elementor: { label: 'Elementor Forms', is_pro: true, platform: 'wordpress' },
	gravityforms: { label: 'Gravity Forms', is_pro: true, platform: 'wordpress' },
	ninjaforms: { label: 'Ninja Forms', is_pro: true, platform: 'wordpress' },
	formidable: { label: 'Formidable Forms', is_pro: true, platform: 'wordpress' },
	forminator: { label: 'Forminator', is_pro: true, platform: 'wordpress' },
	metform: { label: 'MetForm', is_pro: true, platform: 'wordpress' },
	wsform: { label: 'WS Form', is_pro: true, platform: 'wordpress' },
	bitform: { label: 'Bit Form', is_pro: true, platform: 'wordpress' },
	sureforms: { label: 'SureForms', is_pro: true, platform: 'wordpress' },
	eform: { label: 'eForm', is_pro: true, platform: 'wordpress' },
	jetformbuilder: { label: 'JetFormBuilder', is_pro: true, platform: 'wordpress' },
	typeform: { label: 'Typeform', is_pro: true, platform: 'saas' },
	jotform: { label: 'Jotform', is_pro: true, platform: 'saas' },
};

/** SaaS form slug → Integrations screen slug */
const SAAS_FORM_INTEGRATIONS: Record<string, string> = {
	typeform: 'typeform',
	jotform: 'jotform',
};

const getProPluginUrl = () =>
	(typeof window !== 'undefined' &&
		(
			window as unknown as {
				doublescalePro?: { proPluginUrl?: string };
			}
		).doublescalePro?.proPluginUrl) ||
	ConfigAPI.getPluginDirUrl();

const getFormIcon = (sourceKey: string) => {
	const proPluginUrl = getProPluginUrl();
	const iconMap: Record<string, string> = {
		contact: contact,
		contactform7: contact,
		elementor: elementor,
		fluentforms: fluentForms,
		formidable: formidable,
		forminator: forminator,
		gravityforms: gravityForms,
		metform: metForm,
		ninjaforms: ninjaForms,
		quillforms: quillForms,
		wpforms: wpForms,
		wsform: wsForms,
		bitform: bitForms,
		sureforms: sureForms,
		typeform: `${proPluginUrl}assets/images/typeform/typeform.png`,
		jotform: `${proPluginUrl}assets/images/jotform/jotform.svg`,
	};

	return (
		<img
			src={iconMap[sourceKey] || contact}
			alt={sourceKey}
			className="w-12 h-12 object-contain"
		/>
	);
};

const FormTypeSelector: React.FC<FormTypeSelectorProps> = ({
	forms,
	selectedType,
	onSelect,
}) => {
	const navigate = useNavigate();
	const [showProModal, setShowProModal] = useState(false);
	const [selectedProFeature, setSelectedProFeature] = useState<string>('');
	const proAddonActive = isProActive();
	const { isConnected: isTypeformConnected, isLoading: isTypeformStatusLoading } =
		useTypeformIntegrationStatus();
	const { isConnected: isJotformConnected, isLoading: isJotformStatusLoading } =
		useJotformIntegrationStatus();

	const mergedForms = { ...forms };
	for (const [slug, defaults] of Object.entries(ALL_FORM_TYPES)) {
		if (!mergedForms[slug]) {
			mergedForms[slug] = {
				label: defaults.label,
				description: '',
				is_pro: defaults.is_pro,
				is_enabled: false,
				platform: defaults.platform,
				options: {},
				fields_settings: {},
			};
		} else if (!mergedForms[slug].platform) {
			mergedForms[slug].platform = defaults.platform;
		}
	}

	const sortFormKeys = (keys: string[]) =>
		[...keys].sort((a, b) => {
			const aEnabled = mergedForms[a].is_enabled || false;
			const bEnabled = mergedForms[b].is_enabled || false;
			if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
			const aPro = mergedForms[a].is_pro || false;
			const bPro = mergedForms[b].is_pro || false;
			if (aPro !== bPro) return aPro ? 1 : -1;
			return (mergedForms[a].label || '').localeCompare(mergedForms[b].label || '');
		});

	const wordpressKeys = sortFormKeys(
		Object.keys(mergedForms).filter(
			(key) => (mergedForms[key].platform || 'wordpress') === 'wordpress'
		)
	);

	const saasKeys = sortFormKeys(
		Object.keys(mergedForms).filter(
			(key) => mergedForms[key].platform === 'saas'
		)
	);

	const isSaasIntegrationConnected = (formKey: string, formType: any) => {
		const integrationSlug = SAAS_FORM_INTEGRATIONS[formKey];
		if (!integrationSlug) {
			return Boolean(formType.is_enabled);
		}
		if (integrationSlug === 'typeform') {
			if (isTypeformStatusLoading) {
				return Boolean(formType.is_enabled);
			}
			return isTypeformConnected;
		}
		if (integrationSlug === 'jotform') {
			if (isJotformStatusLoading) {
				return Boolean(formType.is_enabled);
			}
			return isJotformConnected;
		}
		const integrations = ConfigAPI.getIntegrations();
		return Boolean(integrations[integrationSlug]?.is_connected);
	};

	const needsIntegrationSetup = (key: string, formType: any) => {
		const isProLocked = (formType.is_pro || false) && !proAddonActive;
		return (
			formType.platform === 'saas' &&
			!isProLocked &&
			!isSaasIntegrationConnected(key, formType)
		);
	};

	const saasNeedsSetup = saasKeys.some((key) =>
		needsIntegrationSetup(key, mergedForms[key])
	);

	const handleCardClick = (key: string, formType: any) => {
		const isProLocked = (formType.is_pro || false) && !proAddonActive;
		const isEnabled = formType.is_enabled;
		const isSaas = formType.platform === 'saas';
		const setupRequired = needsIntegrationSetup(key, formType);

		if (isProLocked) {
			setSelectedProFeature(formType.label);
			setShowProModal(true);
			return;
		}

		if (setupRequired) {
			const integrationSlug = SAAS_FORM_INTEGRATIONS[key] || key;
			navigate(getToLink(`integrations/${integrationSlug}`));
			return;
		}

		if (!isEnabled) {
			return;
		}

		onSelect(key);
	};

	const renderCard = (key: string) => {
		const formType = mergedForms[key];
		const isProLocked = (formType.is_pro || false) && !proAddonActive;
		const isSaas = formType.platform === 'saas';
		const isEnabled = formType.is_enabled;
		const setupRequired = needsIntegrationSetup(key, formType);
		const isSelectable = !isProLocked && isEnabled && !setupRequired;
		const isSelected = isSelectable && selectedType === key;
		const isClickable = !isProLocked && (setupRequired || isEnabled);

		const card = (
			<Card
				key={key}
				className={`
					relative transition-all duration-200 border p-4 shadow-none
					${
						setupRequired
							? 'cursor-pointer border-dashed border-violet-300 bg-violet-50/60 hover:border-violet-400 hover:bg-violet-50 hover:-translate-y-1'
							: isSelected
								? 'cursor-pointer border-primary bg-[#C6DFF3]'
								: 'cursor-pointer border-[#E4E4E4] bg-white'
					}
					${!isClickable ? 'opacity-60 cursor-not-allowed' : !setupRequired ? 'hover:-translate-y-1' : ''}
				`}
				onClick={() => handleCardClick(key, formType)}
			>
				<div className="flex space-x-3">
					<div className="flex-shrink-0 relative">{getFormIcon(key)}</div>
					<div className="flex-1 space-y-1">
						<h3
							className={`
								text-base font-semibold leading-tight flex items-center gap-2 flex-wrap
								${isSelected ? 'text-primary' : setupRequired ? 'text-violet-900' : 'text-[#3F4254]'}
							`}
						>
							{formType.label}
							{isSaas && !setupRequired && (
								<Badge
									variant="secondary"
									className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 border-violet-200"
								>
									{__('SaaS', 'doublescale')}
								</Badge>
							)}
							{setupRequired && (
								<Badge
									variant="secondary"
									className="text-[10px] px-1.5 py-0 bg-violet-200 text-violet-800 border-violet-300"
								>
									{__('Setup required', 'doublescale')}
								</Badge>
							)}
							{isProLocked && (
								<Badge
									variant="secondary"
									className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200"
								>
									{__('Pro', 'doublescale')}
								</Badge>
							)}
						</h3>
						<p
							className={`
								text-xs leading-tight
								${isSelected ? 'text-primary' : setupRequired ? 'text-violet-700' : 'text-[#9197A4]'}`}
						>
							{setupRequired
								? __(
										'Connect your account in Integrations before you can map fields and activate this form.',
										'doublescale'
									)
								: formType.description ||
									(isSaas
										? __(
												'Capture submissions from your external Typeform account.',
												'doublescale'
											)
										: __(
												'Capture leads when a form is submitted.',
												'doublescale'
											))}
						</p>
						{!isSaas && !isProLocked && !isEnabled && (
							<p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
								<Info className="w-3 h-3" />
								{__('Plugin not installed or inactive', 'doublescale')}
							</p>
						)}
						{setupRequired && (
							<p className="text-xs font-medium text-violet-700 flex items-center gap-1.5 mt-2">
								<Plug className="w-3.5 h-3.5 shrink-0" />
								<span>{__('Connect in Integrations', 'doublescale')}</span>
								<ArrowRight className="w-3.5 h-3.5 shrink-0" />
							</p>
						)}
					</div>
				</div>
			</Card>
		);

		if (!isSaas && !isEnabled && !isProLocked) {
			return (
				<Tooltip key={key}>
					<TooltipTrigger asChild>{card}</TooltipTrigger>
					<TooltipContent>
						<p>
							{formType.label}{' '}
							{__(
								'plugin is not installed or not active on your site.',
								'doublescale'
							)}
						</p>
					</TooltipContent>
				</Tooltip>
			);
		}

		if (isSaas && isEnabled && !isProLocked) {
			return (
				<Tooltip key={key}>
					<TooltipTrigger asChild>{card}</TooltipTrigger>
					<TooltipContent>
						<p>
							{__(
								'Select to choose a form, map fields, and activate the connection.',
								'doublescale'
							)}
						</p>
					</TooltipContent>
				</Tooltip>
			);
		}

		if (isProLocked && !isEnabled) {
			return (
				<Tooltip key={key}>
					<TooltipTrigger asChild>{card}</TooltipTrigger>
					<TooltipContent>
						<p>
							{__('Requires Pro upgrade.', 'doublescale')}{' '}
							{!isSaas &&
								__('Plugin may also need to be installed.', 'doublescale')}
						</p>
					</TooltipContent>
				</Tooltip>
			);
		}

		return card;
	};

	const renderSection = (
		title: string,
		subtitle: string,
		keys: string[],
		notice?: React.ReactNode
	) => {
		if (keys.length === 0) {
			return null;
		}

		return (
			<div className="space-y-4">
				<div>
					<div className="text-[#09090B] font-bold text-xl">{title}</div>
					<p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
				</div>
				{notice}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{keys.map((key) => renderCard(key))}
				</div>
			</div>
		);
	};

	return (
		<>
			<div className="w-full space-y-8">
				{renderSection(
					__('WordPress Forms', 'doublescale'),
					__(
						'Form builder plugins installed on this WordPress site.',
						'doublescale'
					),
					wordpressKeys
				)}
				{renderSection(
					__('SaaS Forms', 'doublescale'),
					saasNeedsSetup
						? __(
								'External form builders — connect the integration first, then return here to configure.',
								'doublescale'
							)
						: __(
								'External form builders connected via DoubleScale Integrations.',
								'doublescale'
							),
					saasKeys,
					saasNeedsSetup ? (
						<Alert className="border-violet-200 bg-violet-50 text-violet-900">
							<Plug className="h-4 w-4 text-violet-600" />
							<AlertTitle>
								{__('Integration required', 'doublescale')}
							</AlertTitle>
							<AlertDescription className="text-violet-800">
								{__(
									'SaaS forms cannot be selected until you add credentials under Integrations. Click a card below to open the setup screen, then come back to create your form connection.',
									'doublescale'
								)}
							</AlertDescription>
						</Alert>
					) : undefined
				)}
			</div>

			{showProModal && (
				<ProAutomationModal
					visible={showProModal}
					onClose={() => setShowProModal(false)}
					featureName={selectedProFeature}
				/>
			)}
		</>
	);
};

export default FormTypeSelector;
