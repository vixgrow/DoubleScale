/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Typography } from 'antd';
import { map } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@quillcrm/config';

interface Props {
	label: string;
	ajax_action: string;
	parent: string;
}

const AjaxSelect: React.FC<Props> = ({ label, ajax_action, parent }) => {
	const { form, updateForm } = useFormContext();
	const { getAjaxUrl, getNonce } = ConfigAPI;
	const [formOptions, setFormOptions] = useState({});
	const [isFetching, setIsFetching] = useState(false);

	useEffect(() => {
		fetchOptions();
	}, [form]);
	if (!form) return null;

	const fetchOptions = async () => {
		if (!form) {
			return;
		}

		setIsFetching(true);

		try {
			const body = new FormData();
			body.append('action', ajax_action);
			body.append('nonce', getNonce());
			if (form.form_id) {
				body.append('form_id', form.form_id);
			}
			if (parent) {
				const parentValue = form[parent];
				body.append(parent, parentValue);
			}
			const response = await fetch(getAjaxUrl(), {
				method: 'POST',
				body,
			});

			const data = await response.json();

			setFormOptions(data.data);
		} catch (error) {
			console.error(error);
		} finally {
			setIsFetching(false);
		}
	};

	return (
		<div className="qcrm-field">
			<div className="qcrm-field-label">
				<Typography.Text>{label}</Typography.Text>
			</div>
			<div className="qcrm-field-input">
				<Select
					isLoading={isFetching}
					options={map(formOptions, (value, key) => ({
						label: value,
						value: key,
					}))}
					onChange={(selected) => {
						updateForm({
							form_id: selected.value,
						});
					}}
					value={
						map(formOptions, (value, key) => ({
							label: value,
							value: key,
						})).find((option) => option.value === form.form_id) ||
						null
					}
				/>
			</div>
		</div>
	);
};

export default AjaxSelect;
