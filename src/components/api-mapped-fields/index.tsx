/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

import { Trash2 as DeleteOutlined } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import type { ReactSelectOptions } from '@doublescale/client';
import { map } from 'lodash';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface APIMappedFieldsProps {
	onChange: (value: { key: string; value: string }[]) => void;
	values: { key: string; value: string }[];
	fields: {
		[key: string]: {
			label: string;
		};
	};
	endpoint: string;
}

const APIMappedFields: React.FC<APIMappedFieldsProps> = ({
	onChange,
	values = [],
	endpoint,
	fields: initialFields = {},
}) => {
	initialFields = initialFields || {};
	initialFields = { '': { label: __('Select', 'doublescale') }, ...initialFields };
	const preloadedFields = map(initialFields, (field, key) => ({
		label: field.label,
		value: key,
	}));

	const [fields, setFields] = useState<ReactSelectOptions>(preloadedFields);
	const [loading, setLoading] = useState(true);

	const fetchOptions = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/integrations/${endpoint}`,
			})) as ReactSelectOptions;

			setFields([...fields, ...response]);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOptions();
	}, []);

	if (loading) {
		return <Skeleton className='h-4 w-full' />;
	}

	const addNewField = () => {
		onChange([
			...values,
			{
				key: '',
				value: '',
			},
		]);
	};

	const changeHandler = (index: number, payload: { key?: string; value?: string }) => {
		const newValues = [...values];
		newValues[index] = { ...newValues[index], ...payload };
		onChange(newValues);
	};

	const removeField = (index: number) => {
		const newValues = [...values];
		newValues.splice(index, 1);
		onChange(newValues);
	};

	return (
        <div className='flex gap-2.5 flex-col'>
            <div className='flex gap-5'>
				<span style={{ flex: 1 }}>
					{__('Field', 'doublescale')}
				</span>
				<span style={{ flex: 1 }}>
					{__('Value', 'doublescale')}
				</span>
			</div>
            {fields.length > 0 && map(values, (field, index) => {
				return (
                    <div key={index} className='flex gap-5'>
                        <Select
                            onValueChange={(value) => {
								changeHandler(index, { key: value });
							}}
                            value={field.key} />
                        <Input
							value={field.value}
							onChange={(e) => {
								changeHandler(index, { value: e.target.value });
							}}
							style={{ flex: 1 }}
						/>
                        <Button onClick={() => removeField(index)} variant='destructive' />
                    </div>
                );
			})}
            <Button onClick={addNewField}>
				{__('Add New Field', 'doublescale')}
			</Button>
        </div>
    );
};

export default APIMappedFields;
