/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { map, keys } from 'lodash';

/**
 * Internal dependencies
 */
import { Card } from '@/components/ui/card';
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
	return (
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
					const isDisabled = !formType.is_enabled;

					return (
						<Card
							key={key}
							className={`
								relative cursor-pointer transition-all duration-200 border p-4 shadow-none
								${isSelected ? 'border-primary bg-[#C6DFF3]' : 'border-[#E4E4E4] bg-white'}
								${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}
							`}
							onClick={() => !isDisabled && onSelect(key)}
						>
							<div className="flex space-x-3">
								<div className="flex-shrink-0">
									{getFormIcon(key)}
								</div>
								<div className="flex-1 space-y-1">
									<h3
										className={`
										text-base font-semibold leading-tight
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
										{__(
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
	);
};

export default FormTypeSelector;
