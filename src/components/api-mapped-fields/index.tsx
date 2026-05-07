/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Typography, Flex, Select, Input, Skeleton, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { ReactSelectOptions } from '@doublescale/client';
import { map } from 'lodash';

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
		return <Skeleton active />;
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
		<Flex gap={10} vertical>
			<Flex gap={20}>
				<Typography.Text style={{ flex: 1 }} strong>
					{__('Field', 'doublescale')}
				</Typography.Text>
				<Typography.Text style={{ flex: 1 }} strong>
					{__('Value', 'doublescale')}
				</Typography.Text>
			</Flex>
			{fields.length > 0 && map(values, (field, index) => {
				return (
					<Flex key={index} gap={20}>
						<Select
							onChange={(value) => {
								changeHandler(index, { key: value });
							}}
							value={field.key}
							options={fields}
							style={{ flex: 1 }}
						/>
						<Input
							value={field.value}
							onChange={(e) => {
								changeHandler(index, { value: e.target.value });
							}}
							style={{ flex: 1 }}
						/>
						<Button icon={<DeleteOutlined />} onClick={() => removeField(index)} danger />
					</Flex>
				);
			})}

			<Button onClick={addNewField}>
				{__('Add New Field', 'doublescale')}
			</Button>
		</Flex>
	);
};

export default APIMappedFields;
