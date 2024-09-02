/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Typography, Input, Modal } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Integration as IntegrationType } from '@quillcrm/config';
import SelectField from '../select-field';

interface IntegrationProps {
	open: boolean;
	onClose: () => void;
	integration: IntegrationType;
	slug: string;
}

const Credentials: React.FC<IntegrationProps> = ({
	open,
	onClose,
	integration,
	slug,
}) => {
	const { fields, settings } = integration;
	const [fieldsValue, setFieldsValue] = useState(settings);
	const [isSaving, setIsSaving] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const save = async () => {
		setIsSaving(true);

		try {
			// @ts-ignore
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/integrations/${slug}`),
				method: 'POST',
				data: {
					settings: fieldsValue,
				},
			})) as any;

			onClose();
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to save settings', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const checkConditions = (conditions, fieldsValue) => {
		let result = true;

		map(conditions, (condition, field) => {
			if (result) {
				switch (condition.operator) {
					case '==':
						result = fieldsValue[field] === condition.value;
						break;
					case '!=':
						result = fieldsValue[field] !== condition.value;
						break;
					case '>':
						result = fieldsValue[field] > condition.value;
						break;
					case '<':
						result = fieldsValue[field] < condition.value;
						break;
					case '>=':
						result = fieldsValue[field] >= condition.value;
						break;
					case '<=':
						result = fieldsValue[field] <= condition.value;
						break;
					default:
						break;
				}
			}
		});

		return result;
	};

	return (
		<Modal
			className="qcrm-integrations"
			open={open}
			onCancel={onClose}
			onOk={() => save()}
			loading={isSaving}
		>
			<div className="qcrm-fields" style={{ marginBottom: 20 }}>
				{map(fields, (field, key) => {
					if (
						field.conditions &&
						!checkConditions(field.conditions, fieldsValue)
					) {
						return null;
					}

					return (
						<div className="qcrm-field">
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{field.label}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									{!field.has_options && (
										<Input
											value={fieldsValue[key]}
											onChange={(e) => {
												setFieldsValue({
													...fieldsValue,
													[key]: e.target.value,
												});
											}}
										/>
									)}
									{field.has_options && (
										<SelectField
											integration={slug}
											slug={field.endpoint}
											onChange={(value) => {
												setFieldsValue({
													...fieldsValue,
													[key]: value,
												});
											}}
											value={fieldsValue[key] || ''}
										/>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</Modal>
	);
};

export default Credentials;
