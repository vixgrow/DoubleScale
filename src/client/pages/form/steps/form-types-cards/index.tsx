/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Lock, Info } from 'lucide-react';
import { useState } from 'react';

/**
 * Internal dependencies
 */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import ProAutomationModal from '@doublescale/components/pro-automation-modal';
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

const ALL_FORM_TYPES: Record<string, { label: string; is_pro: boolean }> = {
	contactform7: { label: 'Contact Form 7', is_pro: false },
	wpforms: { label: 'WPForms', is_pro: false },
	fluentforms: { label: 'Fluent Forms', is_pro: false },
	quillforms: { label: 'Quill Forms', is_pro: false },
	elementor: { label: 'Elementor Forms', is_pro: true },
	gravityforms: { label: 'Gravity Forms', is_pro: true },
	ninjaforms: { label: 'Ninja Forms', is_pro: true },
	formidable: { label: 'Formidable Forms', is_pro: true },
	forminator: { label: 'Forminator', is_pro: true },
	metform: { label: 'MetForm', is_pro: true },
	wsform: { label: 'WS Form', is_pro: true },
	bitform: { label: 'Bit Form', is_pro: true },
	sureforms: { label: 'SureForms', is_pro: true },
	eform: { label: 'eForm', is_pro: true },
	jetformbuilder: { label: 'JetFormBuilder', is_pro: true },
};

const getFormIcon = (sourceKey: string) => {
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
	const [showProModal, setShowProModal] = useState(false);
	const [selectedProFeature, setSelectedProFeature] = useState<string>('');

	const mergedForms = { ...forms };
	for (const [slug, defaults] of Object.entries(ALL_FORM_TYPES)) {
		if (!mergedForms[slug]) {
			mergedForms[slug] = {
				label: defaults.label,
				description: '',
				is_pro: defaults.is_pro,
				is_enabled: false,
				options: {},
				fields_settings: {},
			};
		}
	}

	const sortedKeys = Object.keys(mergedForms).sort((a, b) => {
		const aEnabled = mergedForms[a].is_enabled || false;
		const bEnabled = mergedForms[b].is_enabled || false;
		if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
		const aPro = mergedForms[a].is_pro || false;
		const bPro = mergedForms[b].is_pro || false;
		if (aPro !== bPro) return aPro ? 1 : -1;
		return (mergedForms[a].label || '').localeCompare(mergedForms[b].label || '');
	});

	const handleCardClick = (key: string, formType: any) => {
		const isPro = formType.is_pro || false;
		const isEnabled = formType.is_enabled;

		if (isPro) {
			setSelectedProFeature(formType.label);
			setShowProModal(true);
			return;
		}

		if (!isEnabled) return;

		onSelect(key);
	};

	return (
		<>
			<div className="w-full">
				<div className="mb-4">
					<div className="text-[#09090B] font-bold text-2xl">
						{__('Select Form Type', 'doublescale')}
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<TooltipProvider delayDuration={200}>
						{sortedKeys.map((key) => {
							const formType = mergedForms[key];
							const isSelected = selectedType === key;
							const isPro = formType.is_pro || false;
							const isEnabled = formType.is_enabled;
							const isClickable = !isPro && isEnabled;

							const card = (
								<Card
									key={key}
									className={`
									relative cursor-pointer transition-all duration-200 border p-4 shadow-none
									${isSelected ? 'border-primary bg-[#C6DFF3]' : 'border-[#E4E4E4] bg-white'}
									${!isClickable ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1'}
								`}
									onClick={() => handleCardClick(key, formType)}
								>
									<div className="flex space-x-3">
										<div className="flex-shrink-0 relative">
											{getFormIcon(key)}
										</div>
										<div className="flex-1 space-y-1">
											<h3
												className={`
												text-base font-semibold leading-tight flex items-center gap-2
												${isSelected ? 'text-primary' : 'text-[#3F4254]'}
											`}
											>
												{formType.label}
												{isPro && (
													<Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
														{__('Pro', 'doublescale')}
													</Badge>
												)}
											</h3>
											<p
												className={`
												text-xs leading-tight
												${isSelected ? 'text-primary' : 'text-[#9197A4]'}`}
											>
												{formType.description || __(
													'Capture leads when a form is submitted.',
													'doublescale'
												)}
											</p>
											{!isPro && !isEnabled && (
												<p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
													<Info className="w-3 h-3" />
													{__('Plugin not installed or inactive', 'doublescale')}
												</p>
											)}
										</div>
									</div>
								</Card>
							);

							if (!isEnabled && !isPro) {
								return (
									<Tooltip key={key}>
										<TooltipTrigger asChild>
											{card}
										</TooltipTrigger>
										<TooltipContent>
											<p>
												{formType.label}{' '}
												{__('plugin is not installed or not active on your site.', 'doublescale')}
											</p>
										</TooltipContent>
									</Tooltip>
								);
							}

							if (isPro && !isEnabled) {
								return (
									<Tooltip key={key}>
										<TooltipTrigger asChild>
											{card}
										</TooltipTrigger>
										<TooltipContent>
											<p>
												{__('Requires Pro upgrade.', 'doublescale')}{' '}
												{__('Plugin may also need to be installed.', 'doublescale')}
											</p>
										</TooltipContent>
									</Tooltip>
								);
							}

							return card;
						})}
					</TooltipProvider>
				</div>
			</div>

			{/* Pro Feature Modal */}
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
