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
import { Card, Button, Input, Typography, Checkbox } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { CustomTemplate as TemplateType } from '../types';
import { useParams } from '@quillcrm/navigation';

const Template: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [template, setTemplate] = useState<TemplateType | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const settings = template?.settings || {
		from_name: '',
		from_email: '',
		reply_to: '',
		subject: '',
		preview_text: '',
		enable_utm: false,
		utm_source: '',
		utm_medium: '',
		utm_name: '',
		utm_term: '',
		utm_content: '',
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
			})) as any;

			setTemplate(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch template', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const saveTemplate = async (data: any = {}) => {
		setIsSaving(true);

		const newTemplate = { ...template, ...data };

		try {
			const response = (await apiFetch({
				path: `/qc/v1/templates/${newTemplate.id}`,
				method: 'POST',
				data: newTemplate,
			})) as TemplateType;

			setTemplate(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to save template', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const updateSettings = (data: { [key: string]: any }) => {
		if (!template) {
			return;
		}

		const newSettings = { ...template.settings, ...data };

		setTemplate({ ...template, settings: newSettings });
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
						<div className="qcrm-fields">
							<div className="qcrm-field qcrm-field-group">
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('From Name', 'quillcrm')}
										</Typography.Text>
									</div>
									<div className="qcrm-field-input">
										<Input
											value={settings.from_name}
											onChange={(e) =>
												updateSettings({
													from_name: e.target.value,
												})
											}
											status={
												settings.from_name
													? ''
													: 'error'
											}
										/>
									</div>
								</div>
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('From Email', 'quillcrm')}
										</Typography.Text>
									</div>
									<div className="qcrm-field-input">
										<Input
											value={settings.from_email}
											onChange={(e) =>
												updateSettings({
													from_email: e.target.value,
												})
											}
											status={
												settings.from_email
													? ''
													: 'error'
											}
										/>
									</div>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Reply To', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										type="email"
										value={settings.reply_to}
										onChange={(e) =>
											updateSettings({
												reply_to: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Subject', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										value={template.subject}
										onChange={(e) =>
											setTemplate({
												...template,
												subject: e.target.value,
											})
										}
										status={template.subject ? '' : 'error'}
									/>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Preview Text', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										value={settings.preview_text}
										onChange={(e) =>
											updateSettings({
												preview_text: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Body', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input.TextArea
										value={template.body}
										onChange={(e) =>
											setTemplate({
												...template,
												body: e.target.value,
											})
										}
										status={template.body ? '' : 'error'}
									/>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Enable UTM', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Checkbox
										checked={settings.enable_utm}
										onChange={(e) =>
											updateSettings({
												enable_utm: e.target.checked,
											})
										}
									>
										{__('Enable UTM', 'quillcrm')}
									</Checkbox>
								</div>
							</div>
							{settings.enable_utm && (
								<>
									<div className="qcrm-field qcrm-field-group">
										<div className="qcrm-field">
											<div className="qcrm-field-label">
												<Typography.Text>
													{__(
														'UTM Source',
														'quillcrm'
													)}
												</Typography.Text>
											</div>
											<div className="qcrm-field-input">
												<Input
													value={settings.utm_source}
													onChange={(e) =>
														updateSettings({
															utm_source:
																e.target.value,
														})
													}
												/>
											</div>
										</div>
										<div className="qcrm-field">
											<div className="qcrm-field-label">
												<Typography.Text>
													{__(
														'UTM Medium',
														'quillcrm'
													)}
												</Typography.Text>
											</div>
											<div className="qcrm-field-input">
												<Input
													value={settings.utm_medium}
													onChange={(e) =>
														updateSettings({
															utm_medium:
																e.target.value,
														})
													}
												/>
											</div>
										</div>
									</div>
									<div className="qcrm-field qcrm-field-group">
										<div className="qcrm-field">
											<div className="qcrm-field-label">
												<Typography.Text>
													{__('UTM Name', 'quillcrm')}
												</Typography.Text>
											</div>
											<div className="qcrm-field-input">
												<Input
													value={settings.utm_name}
													onChange={(e) =>
														updateSettings({
															utm_name:
																e.target.value,
														})
													}
												/>
											</div>
										</div>
										<div className="qcrm-field">
											<div className="qcrm-field-label">
												<Typography.Text>
													{__('UTM Term', 'quillcrm')}
												</Typography.Text>
											</div>
											<div className="qcrm-field-input">
												<Input
													value={settings.utm_term}
													onChange={(e) =>
														updateSettings({
															utm_term:
																e.target.value,
														})
													}
												/>
											</div>
										</div>
									</div>
									<div className="qcrm-field qcrm-field-group">
										<div className="qcrm-field">
											<div className="qcrm-field-label">
												<Typography.Text>
													{__(
														'UTM Content',
														'quillcrm'
													)}
												</Typography.Text>
											</div>
											<div className="qcrm-field-input">
												<Input
													value={settings.utm_content}
													onChange={(e) =>
														updateSettings({
															utm_content:
																e.target.value,
														})
													}
												/>
											</div>
										</div>
									</div>
								</>
							)}
						</div>
					</>
				)}
			</Card>
		</div>
	);
};

export default Template;
