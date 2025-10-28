// CustomFieldsSection.tsx
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
// import { Input } from 'antd';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@quillcrm/components/ui/accordion';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@quillcrm/components/ui/select';
import GroupIcon from '@quillcrm/components/icons/group-icon';
import { useCustomFields } from '@/client/pages/custom-fields/use-customFields';

// ==================== Interfaces ====================
interface CustomField {
	id: number;
	name: string;
	slug: string;
	type: string;
	value?: string | number | boolean;
	attributes?: {
		options?: { label: string; value: string }[];
	};
}

interface CustomFieldsSectionProps {
	dealId?: number;
	onChange?: (fields: Record<string, any>) => void;
}

// ==================== Component ====================
export const CustomFieldsSection = ({ dealId, onChange }: CustomFieldsSectionProps) => {
	const [values, setValues] = useState<Record<string, any>>({});
	const { groups: customFieldsGroups, isLoading, error } = useCustomFields() as unknown as {
		groups: { id: number; name: string; slug: string; custom_fields: CustomField[] }[];
		isLoading?: boolean;
		error?: string;
	};

	const handleChange = (slug: string, value: any) => {
		setValues((prev) => {
			const updated = { ...prev, [slug]: value };
			onChange?.(updated);
			return updated;
		});
	};

	if (isLoading)
		return <p className="text-sm text-gray-500">{__('Loading custom fields...', 'quillcrm')}</p>;

	if (error)
		return <p className="text-sm text-red-500">{__('Failed to load custom fields', 'quillcrm')}</p>;

	if (!customFieldsGroups || customFieldsGroups.length === 0)
		return <p className="text-sm text-gray-500">{__('No custom fields available.', 'quillcrm')}</p>;

	return (
		<div className="flex flex-col gap-3 mt-4">
			<label className="font-normal text-[#09090B] text-base">
				{__('Custom Fields', 'quillcrm')}
			</label>

			<Accordion type="multiple" className="w-full">
				{customFieldsGroups.map((group) => (
					<AccordionItem key={group.id} value={group.slug}>
						<AccordionTrigger className="flex justify-between py-3 px-4 items-center w-full bg-[#F8F8F8] h-12 border border-[#DEE1E6] rounded-tl-[8px] rounded-tr-[8px]">
							<span className="flex items-center gap-2">
								<GroupIcon />
								<span className="text-lg font-medium leading-7 tracking-[-.5px] text-[#09090B]">
									{group.name}
								</span>
							</span>
						</AccordionTrigger>

						<AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-bl-[8px] rounded-br-[8px] border border-[#DEE1E6] p-4">
							{group.custom_fields && group.custom_fields.length > 0 ? (
								group.custom_fields.map((field) => (
									<div key={field.id} className="flex flex-col gap-1">
										<label className="font-normal text-[#09090B] text-base">
											{field.name}
										</label>

										{field.type === 'text' ||
										field.type === 'email' ||
										field.type === 'number' ? (
											<input
												type={field.type}
												value={values[field.slug] || ''}
												onChange={(e) => handleChange(field.slug, e.target.value)}
												placeholder={field.name}
												className="h-12 !shadow-none py-[5px] px-4 !rounded-[8px] border !border-[#DEE1E6] !text-[#09090B] text-sm"
											/>
										) : field.type === 'select' && field.attributes?.options ? (
											<Select
												value={values[field.slug] || ''}
												onValueChange={(v) => handleChange(field.slug, v)}
											>
												<SelectTrigger className="h-12 !shadow-none py-[5px] px-4 rounded-[8px] border border-[#DEE1E6] text-[#09090B] text-sm">
													<SelectValue
														placeholder={__('Select option', 'quillcrm')}
													/>
												</SelectTrigger>
												<SelectContent>
													{field.attributes.options.map((opt) => (
														<SelectItem key={opt.value} value={opt.value}>
															{opt.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : field.type === 'checkbox' ? (
											<div className="flex items-center gap-2 mt-2">
												<input
													type="checkbox"
													checked={!!values[field.slug]}
													onChange={(e) => handleChange(field.slug, e.target.checked)}
												/>
												<span className="text-sm text-[#09090B]">
													{__('Yes / No', 'quillcrm')}
												</span>
											</div>
										) : field.type === 'date' ? (
											<input
												type="date"
												value={values[field.slug] || ''}
												onChange={(e) => handleChange(field.slug, e.target.value)}
												className="h-12 !shadow-none py-[5px] px-4 !rounded-[8px] border !border-[#DEE1E6] !text-[#09090B] text-sm"
											/>
										) : null}
									</div>
								))
							) : (
								<p className="text-sm text-gray-500 col-span-2">
									{__('No fields in this group.', 'quillcrm')}
								</p>
							)}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
};
