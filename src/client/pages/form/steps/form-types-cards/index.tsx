/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { map, keys } from 'lodash';
import { Lock } from 'lucide-react';
import { useState } from 'react';

/**
 * Internal dependencies
 */
import { Card } from '@/components/ui/card';
import ProAutomationModal from '@quillcrm/components/pro-automation-modal';
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

interface FormTypeSelectorProps {
	forms: any;
	selectedType: string;
	onSelect: (value: string) => void;
}

const getFormIcon = (sourceKey: string) => {
	const iconMap = {
		contact: contact,
		elementor: elementor,
		fluentforms: fluentForms,
		formidable: formidable,
		forminator: forminator,
		gravityforms: gravityForms,
		metform: metForm,
		ninjaforms: ninjaForms,
		quillforms: quillForms,
		wpforms: wpForms,
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
	console.log(forms)
	const [showProModal, setShowProModal] = useState(false);
	const [selectedProFeature, setSelectedProFeature] = useState<string>('');

	const handleCardClick = (key: string, formType: any) => {
		const isDisabled = !formType.is_enabled;
		const isPro = formType.is_pro || false;

		if (isPro) {
			setSelectedProFeature(formType.label);
			setShowProModal(true);
			return;
		}

		if (isDisabled) return;

		onSelect(key);
	};

	return (
		<>
			<div className="w-full">
				<div className="mb-4">
					<div className="text-[#09090B] font-bold text-2xl">
						{__('Select Form Type', 'quillcrm')}
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{map(keys(forms), (key) => {
						const formType = forms[key];
						const isSelected = selectedType === key;
						const isPro = formType.is_pro || false;
						const isDisabled = !formType.is_enabled;

						return (
							<Card
								key={key}
								className={`
								relative cursor-pointer transition-all duration-200 border p-4 shadow-none
								${isSelected ? 'border-primary bg-[#C6DFF3]' : 'border-[#E4E4E4] bg-white'}
								${!isPro && isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}
							`}
								onClick={() => handleCardClick(key, formType)}
							>
								<div className="flex space-x-3">
									<div className="flex-shrink-0 relative">
										{getFormIcon(key)}
										{isPro && (
											<div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
												<Lock className="h-3 w-3 text-white" />
											</div>
										)}
									</div>
									<div className="flex-1 space-y-1">
										<h3
											className={`
											text-base font-semibold leading-tight flex items-center gap-2
											${isSelected ? 'text-primary' : 'text-[#3F4254]'}
										`}
										>
											{formType.label}
										</h3>
										<p
											className={`
                                            text-xs leading-tight
                                            ${isSelected ? 'text-primary' : 'text-[#9197A4]'}`}
										>
											{formType.description || __(
												'There are many variations of passages of Lorem available, but the majority have suffered alteration in some form',
												'quillcrm'
											)}
										</p>
									</div>
								</div>
							</Card>
						);
					})}
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
