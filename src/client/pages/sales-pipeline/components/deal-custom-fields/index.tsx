
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
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
import { useDealOperations } from '../../hooks/use-deal-operations';


interface CustomField {
  id: number;
  name: string;
  slug: string;
  type: string;
  attributes?: {
    options?: { label: string; value: string }[];
  };
}

interface CustomFieldsSectionProps {
//   deal: Deal;
deal?: any;
  onChange?: (fields: Record<string, any>) => void;
}

export const CustomFieldsSection = ({ deal,onChange }: CustomFieldsSectionProps) => {
//   const { groups, isLoading, error } = useCustomFields('deal') as any;
const { groups, isLoading, error } = useCustomFields() as any;

  const { updateDeal } = useDealOperations();
  const { createNotice } = useDispatch('quillcrm/core');
//   const [fields, setFields] = useState<Record<number, any>>({});
const [fields, setFields] = useState<Record<string, any>>({});

  

  const handleFieldChange = (key: string, value: any) => {
    const updated = { ...fields, [key]: value };
    setFields(updated);
    onChange?.(updated);
  };

  const getFieldValue = (fieldId: number, fieldType?: string) => {
	const customField = deal?.custom_fields?.find?.((cf) => cf.id === fieldId);
	let value = customField?.pivot?.value ?? fields[fieldId] ?? '';
  
	if (fieldType === 'checkbox' || fieldType === 'boolean') {
	  return value === 'true' || value === true;
	}
  
	return value;
  };

  const getFieldOptions = (field: CustomField) => {
    const options = field.attributes?.options ?? [];
    return Array.isArray(options)
      ? options
      : Object.entries(options).map(([value, label]) => ({
          value,
          label: String(label),
        }));
  };

  const handleChange = (id: number, value: any) => {
    setFields((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const updated = deal.custom_fields.map((field) => {
        const updatedValue = fields[field.id];
        if (updatedValue === undefined) return field;

        return {
          ...field,
          pivot: {
            ...field.pivot,
            value:
              typeof updatedValue === 'boolean'
                ? String(updatedValue)
                : Array.isArray(updatedValue)
                ? updatedValue.join(',')
                : updatedValue,
          },
        };
      });

      await updateDeal(deal.id, { custom_fields: updated });

      createNotice?.({
        type: 'success',
        message: __(
          `Deal "${deal.title}" custom fields updated successfully.`,
          'quillcrm'
        ),
      });
    } catch (err) {
      createNotice?.({
        type: 'error',
        message: __('Failed to update custom fields.', 'quillcrm'),
      });
    }
  };


  if (isLoading)
    return (
      <p className="text-sm text-gray-500">
        {__('Loading custom fields...', 'quillcrm')}
      </p>
    );

  if (error)
    return (
      <p className="text-sm text-red-500">
        {__('Failed to load custom fields', 'quillcrm')}
      </p>
    );

  if (!groups?.length)
    return (
      <p className="text-sm text-gray-500">
        {__('No custom fields available.', 'quillcrm')}
      </p>
    );

  return (
    <div className="flex flex-col gap-4 mt-4">
      <label className="font-medium text-[#09090B] text-base">
        {__('Custom Fields', 'quillcrm')}
      </label>

      <Accordion type="multiple" className="w-full">
        {groups.map((group: any) => (
          <AccordionItem key={group.id} value={group.slug} className='mb-6'>
            <AccordionTrigger className="flex justify-between py-3 px-4 items-center w-full bg-[#F8F8F8] h-12 border border-[#DEE1E6] rounded-tl-[8px] rounded-tr-[8px]">
              <span className="flex items-center gap-2">
                <GroupIcon />
                <span className="text-lg font-medium text-[#09090B]">
                  {group.name}
                </span>
              </span>
            </AccordionTrigger>

            <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-bl-[8px] rounded-br-[8px] border border-[#DEE1E6] p-4">
              {group.custom_fields?.length ? (
                group.custom_fields.map((field: CustomField) => {
                  const value =
                    fields[field.id] ?? getFieldValue(field.id, field.type);

                  return (
                    <div key={field.id} className="flex flex-col gap-1">
                      <label className="font-normal text-[#09090B] text-base">
                        {field.name}
                      </label>

                      {['text', 'email', 'number', 'date'].includes(
                        field.type
                      ) ? (
                        <input
                          type={field.type}
                          value={value || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
						  placeholder={field.name}
                          className="h-12 shadow-none py-[5px] px-4 !rounded-[8px] !border !border-[#DEE1E6] text-[#09090B] text-sm"
                        />
                      ) : field.type === 'select' ? (
                        <Select
                          value={value || ''}
                          onValueChange={(v) => handleChange(field.id, v)}
                        >
                          <SelectTrigger className="h-12 !shadow-none py-[5px] px-4 !rounded-[8px] !border !border-[#DEE1E6] text-[#09090B] text-sm">
                            <SelectValue
                              placeholder={__('Select option', 'quillcrm')}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {getFieldOptions(field).map((opt) => (
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
                            checked={!!value}
							placeholder={field.name}
                            onChange={(e) =>
                              handleChange(field.id, e.target.checked)
                            }
							className='h-12 !shadow-none py-[5px] px-4 !rounded-[8px] !border !border-[#DEE1E6] !text-[#09090B] text-sm'
                          />
                          <span className="text-sm text-[#09090B]">
                            {__('Yes / No', 'quillcrm')}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })
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
