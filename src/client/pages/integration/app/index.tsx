/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

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

interface IntegrationProps {
	open: boolean;
	onClose: () => void;
	integration: IntegrationType;
	slug: string;
}

const App: React.FC<IntegrationProps> = ({
	open,
	onClose,
	integration,
	slug,
}) => {
	const { fields, settings } = integration;
	const [app, setApp] = useState(settings.app || {});
	const [isSaving, setIsSaving] = useState(false);
	console.log(fields);

	const save = async () => {
		setIsSaving(true);

		try {
			// @ts-ignore
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/integrations/${slug}`),
				method: 'POST',
				data: {
					settings: {
						app,
					},
				},
			})) as any;

			await getAuthUrl();
		} catch (error) {
			console.log(error);
		} finally {
			setIsSaving(false);
		}
	};

	const getAuthUrl = async () => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/integrations/${slug}/auth`),
				method: 'GET',
			})) as any;

			window.location = response.auth_uri;
		} catch (error) {
			console.log(error);
		} finally {
			setIsSaving(false);
		}
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
				{map(fields.app['properties'], (field, key) => {
					return (
						<div className="qcrm-field">
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{field.label}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										value={app[key]}
										onChange={(e) => {
											setApp({
												...app,
												[key]: e.target.value,
											});
										}}
									/>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</Modal>
	);
};

export default App;
