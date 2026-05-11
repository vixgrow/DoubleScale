/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch, withDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { EmailTemplate } from '@doublescale/client';
import React, { useRef, useState } from 'react';
import { Field } from '@doublescale/components';
import { isEmail, isEmpty } from 'validator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
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
	const { createNotice } = useDispatch('doublescale/core');

	const sendTestEmail = async () => {
		if (!validate()) {
			return;
		}

		setIsSending(true);
		try {
			const response = await apiFetch({
				path: '/doublescale/v1/campaigns/send-test-message',
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
				message: __('Email sent successfully', 'doublescale'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to send email', 'doublescale'),
			});
		} finally {
			setIsSending(false);
		}
	};

	const validate = () => {
		if (!isEmail(toEmail)) {
			createNotice({
				type: 'error',
				message: __('Invalid email address', 'doublescale'),
			});
			return false;
		}

		if (isEmpty(from_name, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('From name is required', 'doublescale'),
			});
			return false;
		}

		if (isEmpty(from_email, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('From email is required', 'doublescale'),
			});
			return false;
		}

		if (!isEmail(from_email)) {
			createNotice({
				type: 'error',
				message: __('From email is not valid', 'doublescale'),
			});
			return false;
		}

		if (isEmpty(subject, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('Subject is required', 'doublescale'),
			});
			return false;
		}

		if (isEmpty(body, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('Body is required', 'doublescale'),
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
        <Card><CardContent>
                <div className='flex gap-10'>
                    <div className='flex flex-col doublescale-fields' style={{ flex: 1 }}>
                        <div className='flex gap-5'>
                            <Field
                                label={__('From Name', 'doublescale')}
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
                                label={__('From Email', 'doublescale')}
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
                        </div>
                        <Field
                            label={__('Reply To', 'doublescale')}
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
                            label={__('Subject', 'doublescale')}
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
                            label={__('Preview Text', 'doublescale')}
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
                    </div>
                    <div style={{ flex: 1 }} className='flex'>
                        <Card
                            style={{ width: '100%' }}
                            styles={{
                                body: {
                                    height: '100%',
                                    backgroundColor: '#f5f5f5',
                                },
                            }}
                        ><CardContent>
                                <div
                                    className='flex items-center justify-center doublescale-preview-content'
                                    style={{ height: '100%' }}>
                                    <Button
                                        onClick={() => {
                                            setIsBuilderVisible(true);
                                        }}
                                        variant='default'
                                        size='lg'
                                    >
                                        {__('Create with email designer', 'doublescale')}
                                    </Button>
                                </div>
                            </CardContent></Card>
                    </div>
                </div>
                <div style={{ marginTop: 20 }} className='flex justify-start gap-2.5'>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant='default'>
                                {__('Send Test Email', 'doublescale')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-[420px]'>
                            <div className='font-medium mb-2'>{__('Test Email', 'doublescale')}</div>
                            <div className='flex justify-start doublescale-fields'>
                                <Field
                                    label={__('To Email', 'doublescale')}
                                    value={toEmail}
                                    onChange={(value) => setToEmail(value)}
                                    type='email'
                                />
                            </div>
                            <div className='flex justify-end mt-3'>
                                <Button variant='default' onClick={sendTestEmail} disabled={isSending}>
                                    {__('Send', 'doublescale')}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent></Card>
    );
};

export default TemplateForm;