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

/**
 * Internal dependencies
 */
import './style.scss';
import type { ReactSelectOptions } from '@quillcrm/client';
import { map } from 'lodash';

interface APIMappedFieldsProps {
	onChange: (value: { [key: string]: string }) => void;
	values: { [key: string]: string };
	fields: {
		[key: string]: {
			label: string;
		};
	};
	endpoint: string;
}

const APIMappedFields: React.FC<APIMappedFieldsProps> = ({
	onChange,
	values,
	endpoint,
	fields: initialFields = {},
}) => {
	const preloadedFields = map(initialFields, (field, key) => ({
		label: field.label,
		value: key,
	}));
	const [fields, setFields] = useState<ReactSelectOptions>(preloadedFields);
	const [loading, setLoading] = useState(true);
	console.log(fields);

	const fetchOptions = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: `/qc/v1/integrations/${endpoint}`,
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
		onChange({
			...values,
			'': '',
		});
	};

	return (
		<Flex gap={10} vertical>
			<Flex gap={20}>
				<Typography.Text style={{ flex: 1 }} strong>
					{__('Field', 'quillcrm')}
				</Typography.Text>
				<Typography.Text style={{ flex: 1 }} strong>
					{__('Value', 'quillcrm')}
				</Typography.Text>
			</Flex>
			{map(values, (_, key) => {
				return (
					<Flex key={key} gap={20}>
						<Select
							onChange={(value) => {
								onChange({
									...values,
									[key]: value,
								});
							}}
							value={values?.[key] || ''}
							options={fields}
							style={{ flex: 1 }}
						/>
						<Input value={key} disabled style={{ flex: 1 }} />
					</Flex>
				);
			})}

			<Button onClick={addNewField}>
				{__('Add New Field', 'quillcrm')}
			</Button>
		</Flex>
	);
};

export default APIMappedFields;
