import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { Button } from '@quillcrm/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import GroupIcon from '@quillcrm/components/icons/group-icon';
import { Deal } from '../../types';
import { useCustomFields } from '@/client/pages/custom-fields/use-customFields';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import { PlusIcon } from '@quillcrm/components';
import { useNavigate } from 'react-router';
import Field from '@quillcrm/components/field';
import { useDealOperations } from '../../hooks/use-deal-operations';
import { useDispatch } from '@wordpress/data';

interface CustomFieldsViewProps {
  deal: Deal;
}

export const CustomFieldsView = ({ deal: _deal }: CustomFieldsViewProps) => {
  const { groups, isLoading, error } = useCustomFields('deal') as any;
  const { updateDeal } = useDealOperations();
  const { createNotice } = useDispatch('quillcrm/core') as any;

  //   const AddCustomFieldButton = () => {
  const navigate = useNavigate();
  //   }
  const [collapsedGroups, setCollapsedGroups] = useState<{ [key: number]: boolean }>({});
  const [editingCustomField, setEditingCustomField] = useState<number | null>(null);
  const [customFieldValue, setCustomFieldValue] = useState<string | boolean | string[]>('');
  const [isSavingCustomField, setIsSavingCustomField] = useState<boolean>(false);
  const [localFieldValues, setLocalFieldValues] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    if (_deal?.custom_fields?.length) {
      for (const cf of _deal.custom_fields as any[]) {
        const v = cf?.pivot?.value;
        if (v !== undefined && v !== null) {
          initial[cf.id] = String(v);
        }
      }
    }
    return initial;
  });

  const toggleGroupCollapse = (groupId: number) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Helpers
  const getCustomFieldValue = (fieldId: number, fieldType?: string) => {
    // Prefer locally saved value if present
    const localValue = localFieldValues[fieldId];
    if (localValue !== undefined) {
      if (fieldType === 'boolean' || fieldType === 'checkbox') {
        return localValue === 'true';
      }
      return localValue;
    }

    const customField = _deal?.custom_fields?.find?.((cf: any) => cf.id === fieldId);
    const value = customField?.pivot?.value ?? '';

    if (fieldType === 'boolean' || fieldType === 'checkbox') {
      return value === 'true';
    }

    return value;
  };

  const getFieldOptions = (customField: any) => {
    if (!customField?.attributes) return [];

    let options: any = customField.attributes;
    if (Array.isArray(options)) {
      // attributes is directly an array
      return options.map((opt: any) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
      );
    }
    if (options.options) {
      options = options.options;
    }

    if (Array.isArray(options)) {
      if (
        options.length > 0 &&
        typeof options[0] === 'object' &&
        options[0].label &&
        options[0].value
      ) {
        return options;
      }
      if (options.length > 0 && typeof options[0] === 'string') {
        return options.map((opt: string) => ({ value: opt, label: opt }));
      }
    }

    if (typeof options === 'object') {
      return Object.entries(options).map(([value, label]) => ({
        value,
        label: String(label),
      }));
    }

    return [];
  };

  const getMultiselectValue = (fieldValue: string) => {
    if (!fieldValue) return [];
    return fieldValue.split(',').filter((val) => val.trim() !== '');
  };

  const formatCustomFieldDisplay = (
    value: string | boolean | string[],
    fieldType: string,
    options?: { value: string; label: string }[]
  ) => {
    if (value === '' || value === null || value === undefined) {
      return __('—', 'quillcrm');
    }
    if (fieldType === 'boolean' || fieldType === 'checkbox') {
      return value === true || value === 'true' ? __('Yes', 'quillcrm') : __('No', 'quillcrm');
    }
    if (fieldType === 'select' && options) {
      const option = options.find((opt) => opt.value === value);
      return option ? option.label : String(value);
    }
    if (fieldType === 'multiselect') {
      if (Array.isArray(value)) {
        if (value.length === 0) return __('—', 'quillcrm');
        if (options) {
          return value
            .map((val) => options.find((opt) => opt.value === val)?.label ?? val)
            .join(', ');
        }
        return value.join(', ');
      }
      // value came as string from pivot
      const arr = getMultiselectValue(String(value));
      return arr.length ? arr.join(', ') : __('—', 'quillcrm');
    }
    return String(value);
  };

  const handleEditCustomField = (fieldId: number, currentValue: string | boolean | string[]) => {
    setEditingCustomField(fieldId);
    setCustomFieldValue(currentValue ?? '');
  };

  const handleCancelCustomField = () => {
    setEditingCustomField(null);
    setCustomFieldValue('');
  };

  const handleSaveCustomField = async () => {
    if (!editingCustomField || !_deal || isSavingCustomField) return;
    setIsSavingCustomField(true);
    try {
      let stringValue: string;
      if (typeof customFieldValue === 'boolean') {
        stringValue = customFieldValue.toString();
      } else if (Array.isArray(customFieldValue)) {
        stringValue = customFieldValue.join(',');
      } else {
        stringValue = customFieldValue;
      }

      const existingIndex = _deal.custom_fields?.findIndex?.((cf: any) => cf.id === editingCustomField) ?? -1;
      let updatedCustomFields = [...(_deal.custom_fields || [])] as any[];

      if (existingIndex >= 0) {
        updatedCustomFields[existingIndex] = {
          ...updatedCustomFields[existingIndex],
          pivot: {
            ...updatedCustomFields[existingIndex].pivot,
            value: stringValue,
          },
        };
      } else {
        // fall back to definition from groups
        const fieldDefinition = groups
          .flatMap((g: any) => g.custom_fields)
          .find((f: any) => f.id === editingCustomField);
        if (fieldDefinition) {
          updatedCustomFields.push({
            ...fieldDefinition,
            pivot: { value: stringValue } as any,
          });
        }
      }

      await updateDeal(_deal.id, { custom_fields: updatedCustomFields });

      // Update local overlay so UI reflects new value without page refresh
      setLocalFieldValues((prev) => ({
        ...prev,
        [editingCustomField]: stringValue,
      }));

      setEditingCustomField(null);
      setCustomFieldValue('');
      createNotice?.({
        type: 'success',
        message: __('Custom field updated successfully.', 'quillcrm'),
      });
    } catch (err: any) {
      createNotice?.({
        type: 'error',
        message: __('Failed to update custom field.', 'quillcrm'),
      });
    } finally {
      setIsSavingCustomField(false);
    }
  };


  if (isLoading)
    return (
      <div className="mt-4">
        <div className="h-6 w-40 bg-gray-200 animate-pulse mb-4 rounded"></div>
        <div className="h-12 w-full bg-gray-200 animate-pulse rounded mb-3"></div>
        <div className="h-12 w-full bg-gray-200 animate-pulse rounded mb-3"></div>
        <div className="h-12 w-full bg-gray-200 animate-pulse rounded mb-3"></div>
      </div>
    );

  if (error)
    return (
      <p className="text-sm text-red-500">
        {__('Failed to load custom fields', 'quillcrm')}
      </p>
    );

  if (!isLoading && (!groups || groups.length === 0)) {
    return (
      <p className="text-sm text-gray-500">
        {__('No custom fields available.', 'quillcrm')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="text-[#09090B] text-[24px] font-medium leading-normal">
        {__('Custom Fields', 'quillcrm')}
      </div>

      {groups.length ? (
        <div className="w-full flex flex-col gap-4">
          {groups.map((group: any) => {
            if (!group.custom_fields || group.custom_fields.length === 0) {
              return null;
            }
            const isCollapsed = collapsedGroups[group.id];
            return (
              <Card key={group.id} className="shadow-none">
                <CardHeader className={`px-4 py-2 ${!isCollapsed ? 'border-b rounded-t-xl' : 'rounded-xl'} bg-[#F8F8F8]`}>
                  <CardTitle className="flex items-center justify-between font-medium text-lg">
                    <span className="flex items-center gap-2">
                      <GroupIcon />
                      {group.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="h-8 w-8 p-0"
                      aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-6 w-6" />
                      ) : (
                        <ChevronUp className="h-6 w-6" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      {group.custom_fields.map((field: any, index: number) => {
                        const rawValue = getCustomFieldValue(field.id, field.type);
                        const formattedValue =
                          field.type === 'multiselect' ? getMultiselectValue(rawValue as string) : rawValue;
                        const fieldOptions =
                          ['select', 'multiselect'].includes(field.type) ? getFieldOptions(field) : undefined;
                        const isEditing = editingCustomField === field.id;
                        return (
                          <div
                            key={field.id}
                            className={`flex items-center justify-between py-4 ${index !== group.custom_fields.length - 1 ? 'border-b' : ''}`}
                          >
                            <div className="flex flex-col gap-1">
                              <p className="text-[#777] text-base font-medium">
                                {field.name}
                              </p>
                              {isEditing ? (
                                <div
                                  className="text-lg font-semibold"
                                  style={{
                                    pointerEvents: isSavingCustomField ? 'none' : 'auto',
                                    opacity: isSavingCustomField ? 0.5 : 1,
                                  }}
                                >
                                  <Field
                                    type={field.type}
                                    value={customFieldValue}
                                    options={fieldOptions}
                                    onChange={(value: any) => setCustomFieldValue(value)}
                                  />
                                </div>
                              ) : (
                                <div className="text-lg font-semibold">
                                  {formatCustomFieldDisplay(formattedValue, field.type, fieldOptions)}
                                </div>
                              )}
                            </div>
                            {!isEditing ? (
                              <button
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E4EEFD] hover:bg-[#D8E5FA] transition"
                                aria-label="Edit field"
                                onClick={() => handleEditCustomField(field.id, formattedValue as any)}
                              >
                                <EditHeaderIcon
                                  color="#458DC7"
                                  width={18}
                                  height={18}
                                />
                              </button>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveCustomField}
                                  disabled={isSavingCustomField}
                                  className="h-6 w-6 p-0 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label="Save field"
                                >
                                  {isSavingCustomField ? (
                                    <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                                  ) : (
                                    // using a simple check icon substitute with SVG to avoid new imports
                                    <span className="inline-block h-4 w-4 text-green-600">✓</span>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelCustomField}
                                  disabled={isSavingCustomField}
                                  className="h-6 w-6 p-0 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label="Cancel edit"
                                >
                                  {/* simple X */}
                                  <span className="inline-block h-4 w-4 text-red-600">×</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className=" flex justify-center items-center flex-col text-center h-full ">
          <span className=" block my-2">
            <GroupIcon width={58} height={58} />
          </span>
          <p className=" my-2  text-base font-medium leading-7 tracking-[-.5px] text-[#777]">
            {__('No Custom Fields', 'quillcrm')}
          </p>
          <button
            onClick={() => navigate('/custom-fields')}
            className=" h-10 text-[#458DC7] border border-[#458DC7] rounded-[8px] flex justify-center items-center"
          >
            <PlusIcon color="#458DC7" />
            Add Custom Filed
          </button>
        </div>
      )}
    </div>
  );
};
