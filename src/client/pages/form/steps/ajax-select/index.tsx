/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Typography } from 'antd';
import { isObject, map } from 'lodash';
import AsyncSelect from 'react-select/async';

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
	slug: string;
}

const AjaxSelect: React.FC<Props> = ({ label, ajax_action, parent, slug }) => {
	const { form, updateForm } = useFormContext();
	const { getAjaxUrl, getNonce } = ConfigAPI;
	const [formOptions, setFormOptions] = useState({});

	if (!form) return null;

	const fetchOptions = async () => {
		if (!form) {
			return;
		}

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
			const options = map(data.data, (value, key) => ({
				label: value,
				value: key,
			}));

			return options;
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	return (
		<div className="qcrm-field">
			<div className="qcrm-field-label">
				<Typography.Text>{label}</Typography.Text>
			</div>
			<div className="qcrm-field-input">
				<AsyncSelect
					className="react-select-container"
					classNamePrefix="react-select"
					loadOptions={(_inputValue, callback) => {
						fetchOptions().then((data) => {
							if (!data) {
								return;
							}
							callback(data);
						});
					}}
					defaultOptions
					value={
						map(formOptions, (value, key) => ({
							label: value,
							value: key,
						})).find((option) => option.value == form[slug]) || {
							label: __('Select Option', 'quillcrm'),
							value: '',
						}
					}
					onChange={(val) => {
						if (!isObject(val)) {
							return;
						}

						updateForm({
							[slug]: val.value,
						});
					}}
					cacheOptions={false}
				/>
			</div>
		</div>
	);
};

export default AjaxSelect;
