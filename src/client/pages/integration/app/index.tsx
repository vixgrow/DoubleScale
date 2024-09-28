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
import { Modal } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Integration as IntegrationType } from '@quillcrm/config';
import { Field } from '@quillcrm/components';

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
	const { createNotice } = useDispatch('quillcrm/core');

	const save = async () => {
		setIsSaving(true);

		try {
			// @ts-ignore
			const response = await apiFetch({
				path: addQueryArgs(`/qc/v1/integrations/${slug}`),
				method: 'POST',
				data: {
					settings: {
						app,
					},
				},
			});

			await getAuthUrl();
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to save settings', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const getAuthUrl = async () => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/integrations/${slug}/auth`),
				method: 'GET',
			})) as { auth_uri: Location };

			window.location = response.auth_uri;
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to get auth url', 'quillcrm'),
			});
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
						<Field
							key={key}
							label={field.label}
							value={app[key]}
							onChange={(value) => {
								setApp({
									...app,
									[key]: value,
								});
							}}
							type="text"
						/>
					);
				})}
			</div>
		</Modal>
	);
};

export default App;
