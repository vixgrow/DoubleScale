/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Card, Button, Flex } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { CustomTemplate as TemplateType } from '@quillcrm/client';
import { useParams } from '@quillcrm/navigation';
import { Field } from '@quillcrm/components';

const Template: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [template, setTemplate] = useState<TemplateType | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const settings = {
		from_name: '',
		from_email: '',
		reply_to: '',
		preview_text: '',
	};

	const { createNotice } = useDispatch('quillcrm/core');

	useEffect(() => {
		fetchTemplate();
	}, [id]);

	const fetchTemplate = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/templates/${id}`,
			})) as TemplateType;

			const newTemplate = {
				...response,
				settings:
					response.settings === null ? settings : response.settings,
				body: response.body || 'Email body',
			};

			setTemplate(newTemplate);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const saveTemplate = async (
		data: { [key: string]: Partial<TemplateType> } = {}
	) => {
		if (!template) {
			return;
		}

		const newTemplate = { ...template, ...data };

		if (!validate(newTemplate)) {
			return;
		}

		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/templates/${newTemplate.id}`,
				method: 'POST',
				data: newTemplate,
			})) as TemplateType;

			setTemplate(response);
			createNotice({
				type: 'success',
				message: __('Template saved', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const updateSettings = (data: {
		[key: string]: Partial<TemplateType['settings']>;
	}) => {
		if (!template) {
			return;
		}

		const newSettings = { ...template.settings, ...data };

		setTemplate({ ...template, settings: newSettings });
	};

	const validate = (template: TemplateType) => {
		if (!template.settings.from_name) {
			createNotice({
				type: 'error',
				message: __('From name is required', 'quillcrm'),
			});
			return false;
		}

		if (!template.settings.from_email) {
			createNotice({
				type: 'error',
				message: __('From email is required', 'quillcrm'),
			});
			return false;
		}

		if (!template.subject) {
			createNotice({
				type: 'error',
				message: __('Subject is required', 'quillcrm'),
			});
			return false;
		}

		if (!template.body) {
			createNotice({
				type: 'error',
				message: __('Body is required', 'quillcrm'),
			});
			return false;
		}

		return true;
	};

	return (
		<div className="qcrm-template-trigger">
			<Card
				title={template?.name || __('Template', 'quillcrm')}
				extra={
					<Button
						type="primary"
						onClick={() => saveTemplate()}
						loading={isSaving}
					>
						{__('Save', 'quillcrm')}
					</Button>
				}
				loading={loading}
			>
				{template && (
					<>
						<Card>
							<Flex gap={40}>
								<Flex
									className="qcrm-fields"
									vertical
									style={{ flex: 1 }}
								>
									<Flex gap={20}>
										<Field
											label={__('From Name', 'quillcrm')}
											value={template.settings.from_name}
											onChange={(value) =>
												updateSettings({
													from_name: value,
												})
											}
											type="text"
											status={
												template.settings.from_name
													? undefined
													: 'error'
											}
										/>
										<Field
											label={__('From Email', 'quillcrm')}
											value={template.settings.from_email}
											onChange={(value) =>
												updateSettings({
													from_email: value,
												})
											}
											type="email"
											status={
												template.settings.from_email
													? undefined
													: 'error'
											}
										/>
									</Flex>
									<Field
										label={__('Reply To', 'quillcrm')}
										value={template.settings.reply_to}
										onChange={(value) =>
											updateSettings({
												reply_to: value,
											})
										}
										type="email"
									/>
									<Field
										label={__('Subject', 'quillcrm')}
										value={template.subject}
										onChange={(value) =>
											setTemplate({
												...template,
												subject: value,
											})
										}
										type="text"
										status={
											template.subject
												? undefined
												: 'error'
										}
									/>
									<Field
										label={__('Preview Text', 'quillcrm')}
										value={template.settings.preview_text}
										onChange={(value) =>
											updateSettings({
												preview_text: value,
											})
										}
										type="text"
									/>
								</Flex>
								<Flex style={{ flex: 1 }}>
									<Card
										style={{ width: '100%' }}
										styles={{
											body: {
												height: '100%',
												backgroundColor: '#f5f5f5',
											},
										}}
									>
										<Flex
											className="qcrm-preview-content"
											align="center"
											justify="center"
											style={{ height: '100%' }}
										>
											<Button type="primary" size="large">
												{__(
													'Create with email designer',
													'quillcrm'
												)}
											</Button>
										</Flex>
									</Card>
								</Flex>
							</Flex>
						</Card>
					</>
				)}
			</Card>
		</div>
	);
};

export default Template;
