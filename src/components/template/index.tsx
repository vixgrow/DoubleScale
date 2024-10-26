/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Button, Card, Flex, Popconfirm } from 'antd';
import EmailEditor from 'react-email-editor'

/**
 * Internal dependencies
 */
import './style.scss';
import type { Template } from '@quillcrm/client';
import React, { useRef } from 'react';
import { Field } from '@quillcrm/components';
import { isEmail, isEmpty } from 'validator';

interface Props {
	template: Template;
	updateTemplate: (data: Partial<Template>) => void;
}

const TemplateForm: React.FC<Props> = ({ template, updateTemplate }) => {
	const emailEditorRef = useRef(null);
	const [toEmail, setToEmail] = React.useState('');
	const [isSending, setIsSending] = React.useState(false);
	const { from_name, from_email, subject, body } = template;
	const { createNotice } = useDispatch('quillcrm/core');

	const sendTestEmail = async () => {
		if (!validate()) {
			return;
		}

		setIsSending(true);
		try {
			const response = await apiFetch({
				path: '/qc/v1/campaigns/send-test-email',
				method: 'POST',
				data: {
					email: toEmail,
					from_name,
					from_email,
					reply_to: template.reply_to,
					subject,
					body,
				},
			});

			createNotice({
				type: 'success',
				message: __('Email sent successfully', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to send email', 'quillcrm'),
			});
		} finally {
			setIsSending(false);
		}
	};

	const validate = () => {
		if (!isEmail(toEmail)) {
			createNotice({
				type: 'error',
				message: __('Invalid email address', 'quillcrm'),
			});
			return false;
		}

		if (isEmpty(from_name, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('From name is required', 'quillcrm'),
			});
			return false;
		}

		if (isEmpty(from_email, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('From email is required', 'quillcrm'),
			});
			return false;
		}

		if (!isEmail(from_email)) {
			createNotice({
				type: 'error',
				message: __('From email is not valid', 'quillcrm'),
			});
			return false;
		}

		if (isEmpty(subject, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('Subject is required', 'quillcrm'),
			});
			return false;
		}

		if (isEmpty(body, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('Body is required', 'quillcrm'),
			});

			return false;
		}

		return true;
	};

	return (
		// 	<div>
		// 		<EmailEditor ref={emailEditorRef} />

		// 	</div>
		// )
		<Card>
			<Flex gap={40}>
				<Flex className="qcrm-fields" vertical style={{ flex: 1 }}>
					<Flex gap={20}>
						<Field
							label={__('From Name', 'quillcrm')}
							value={from_name}
							onChange={(value) =>
								updateTemplate({
									from_name: value,
								})
							}
							type="text"
							status={from_name ? '' : 'error'}
						/>
						<Field
							label={__('From Email', 'quillcrm')}
							value={from_email}
							onChange={(value) =>
								updateTemplate({
									from_email: value,
								})
							}
							type="email"
							status={from_email ? '' : 'error'}
						/>
					</Flex>
					<Field
						label={__('Reply To', 'quillcrm')}
						value={template.reply_to}
						onChange={(value) =>
							updateTemplate({
								reply_to: value,
							})
						}
						type="email"
					/>
					<Field
						label={__('Subject', 'quillcrm')}
						value={subject}
						onChange={(value) =>
							updateTemplate({
								subject: value,
							})
						}
						type="text"
						status={subject ? '' : 'error'}
					/>
					<Field
						label={__('Preview Text', 'quillcrm')}
						value={template.preview_text}
						onChange={(value) =>
							updateTemplate({
								preview_text: value,
							})
						}
						type="text"
					/>
					<Field
						label={__('Enable UTM', 'quillcrm')}
						value={template.enable_utm}
						onChange={(value) =>
							updateTemplate({
								enable_utm: value,
							})
						}
						type="switch"
					/>
					{template.enable_utm && (
						<>
							<Flex gap={20}>
								<Field
									label={__('UTM Source', 'quillcrm')}
									value={template.utm_source}
									onChange={(value) =>
										updateTemplate({
											utm_source: value,
										})
									}
									type="text"
								/>
								<Field
									label={__('UTM Medium', 'quillcrm')}
									value={template.utm_medium}
									onChange={(value) =>
										updateTemplate({
											utm_medium: value,
										})
									}
									type="text"
								/>
							</Flex>
							<Flex gap={20}>
								<Field
									label={__('UTM Medium', 'quillcrm')}
									value={template.utm_medium}
									onChange={(value) =>
										updateTemplate({
											utm_medium: value,
										})
									}
									type="text"
								/>
								<Field
									label={__('UTM Name', 'quillcrm')}
									value={template.utm_name}
									onChange={(value) =>
										updateTemplate({
											utm_name: value,
										})
									}
									type="text"
								/>
							</Flex>
							<Flex gap={20}>
								<Field
									label={__('UTM Term', 'quillcrm')}
									value={template.utm_term}
									onChange={(value) =>
										updateTemplate({
											utm_term: value,
										})
									}
									type="text"
								/>
								<Field
									label={__('UTM Content', 'quillcrm')}
									value={template.utm_content}
									onChange={(value) =>
										updateTemplate({
											utm_content: value,
										})
									}
									type="text"
								/>
							</Flex>
						</>
					)}
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
								{__('Create with email designer', 'quillcrm')}
							</Button>
						</Flex>
					</Card>
				</Flex>
			</Flex>
			<Flex justify="start" gap={10} style={{ marginTop: 20 }}>
				<Popconfirm
					title={__('Test Email', 'quillcrm')}
					trigger="click"
					description={(
						<Flex className="qcrm-fields" justify='start' style={{ width: 400, padding: '10px 20px' }}>
							<Field
								label={__('To Email', 'quillcrm')}
								value={toEmail}
								onChange={(value) => setToEmail(value)}
								type="email"
							/>
						</Flex>
					)}
					onConfirm={sendTestEmail}
					okText={__('Send', 'quillcrm')}
					icon={null}
					style={{ width: 400 }}
				>
					<Button type="primary">
						{__('Send Test Email', 'quillcrm')}
					</Button>
				</Popconfirm>
			</Flex>
		</Card>
	);
};

export default TemplateForm;
