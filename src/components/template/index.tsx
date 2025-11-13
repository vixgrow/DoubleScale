/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch, withDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Button, Card, Flex, Popconfirm } from 'antd';

/**
 * Internal dependencies
 */
import type { EmailTemplate } from '@quillcrm/client';
import React, { useRef, useState } from 'react';
import { Field } from '@quillcrm/components';
import { isEmail, isEmpty } from 'validator';
// import TemplateBuilder from '../template-builder';

interface Props {
	template: EmailTemplate; // Only use this component for email templates
	updateTemplate: (data: Partial<EmailTemplate>) => void;
}

const TemplateForm: React.FC<Props> = ({ template, updateTemplate }) => {
	const emailEditorRef = useRef(null);
	const [toEmail, setToEmail] = React.useState('');
	const [isSending, setIsSending] = React.useState(false);
	const [isBuilderVisible, setIsBuilderVisible] = React.useState(false);

	// Now type-safe because we know template is EmailTemplate
	const { settings, subject, body } = template;
	const { from_name, from_email, reply_to, preview_text } = settings;
	const { createNotice } = useDispatch('quillcrm/core');

	const sendTestEmail = async () => {
		if (!validate()) {
			return;
		}

		setIsSending(true);
		try {
			const response = await apiFetch({
				path: '/qc/v1/campaigns/send-test-message',
				method: 'POST',
				data: {
					channel: 'email',
					email: toEmail,
					from_name,
					from_email,
					reply_to,
					subject,
					message: body,
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

	// if (isBuilderVisible) {
	// 	return (

	// 		<TemplateBuilder
	// 			updateTemplate={updateTemplate}
	// 			onClose={() => setIsBuilderVisible(false)}
	// 		/>
	// 	);
	// }

	return (
		<Card>
			<Flex gap={40}>
				<Flex className="qcrm-fields" vertical style={{ flex: 1 }}>
					<Flex gap={20}>
						<Field
							label={__('From Name', 'quillcrm')}
							value={from_name}
							onChange={(value) =>
								updateTemplate({
									settings: {
										...settings,
										from_name: value,
									},
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
									settings: {
										...settings,
										from_email: value,
									},
								})
							}
							type="email"
							status={from_email ? '' : 'error'}
						/>
					</Flex>
					<Field
						label={__('Reply To', 'quillcrm')}
						value={reply_to}
						onChange={(value) =>
							updateTemplate({
								settings: {
									...settings,
									reply_to: value,
								},
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
						value={preview_text}
						onChange={(value) =>
							updateTemplate({
								settings: {
									...settings,
									preview_text: value,
								},
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
							<Button
								type="primary"
								size="large"
								onClick={() => {
									setIsBuilderVisible(true);
								}}
							>
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
					description={
						<Flex
							className="qcrm-fields"
							justify="start"
							style={{ width: 400, padding: '10px 20px' }}
						>
							<Field
								label={__('To Email', 'quillcrm')}
								value={toEmail}
								onChange={(value) => setToEmail(value)}
								type="email"
							/>
						</Flex>
					}
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