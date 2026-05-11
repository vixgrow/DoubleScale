/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import { CustomTemplate as TemplateType } from '@doublescale/client';
import { useParams } from '@doublescale/navigation';
import { Field } from '@doublescale/components';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

	const { createNotice } = useDispatch('doublescale/core');

	useEffect(() => {
		fetchTemplate();
	}, [id]);

	const fetchTemplate = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/templates/${id}`,
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
				path: `/doublescale/v1/templates/${newTemplate.id}`,
				method: 'POST',
				data: newTemplate,
			})) as TemplateType;

			setTemplate(response);
			createNotice({
				type: 'success',
				message: __('Template saved', 'doublescale'),
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
				message: __('From name is required', 'doublescale'),
			});
			return false;
		}

		if (!template.settings.from_email) {
			createNotice({
				type: 'error',
				message: __('From email is required', 'doublescale'),
			});
			return false;
		}

		if (!template.settings.subject) {
			createNotice({
				type: 'error',
				message: __('Subject is required', 'doublescale'),
			});
			return false;
		}

		if (!template.body) {
			createNotice({
				type: 'error',
				message: __('Body is required', 'doublescale'),
			});
			return false;
		}

		return true;
	};

	return (
        <div className="doublescale-template-trigger">
            <Card><CardHeader className='flex flex-row items-center justify-between'><CardTitle>{template?.name || __('Template', 'doublescale')}</CardTitle>{<Button
						onClick={() => saveTemplate()}
						disabled
						variant='default'
					>
						{__('Save', 'doublescale')}
					</Button>}</CardHeader><CardContent>
                    {template && (
                        <>
                            <Card><CardContent>
                                    <div className='flex gap-10'>
                                        <div className='flex flex-col doublescale-fields' style={{ flex: 1 }}>
                                            <div className='flex gap-5'>
                                                <Field
                                                    label={__('From Name', 'doublescale')}
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
                                                    label={__('From Email', 'doublescale')}
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
                                            </div>
                                            <Field
                                                label={__('Reply To', 'doublescale')}
                                                value={template.settings.reply_to}
                                                onChange={(value) =>
                                                    updateSettings({
                                                        reply_to: value,
                                                    })
                                                }
                                                type="email"
                                            />
                                            <Field
                                                label={__('Subject', 'doublescale')}
                                                value={template.settings.subject}
                                                onChange={(value) =>
                                                    updateSettings({
                                                        subject: value,
                                                    })
                                                }
                                                type="text"
                                                status={
                                                    template.settings.subject
                                                        ? undefined
                                                        : 'error'
                                                }
                                            />
                                            <Field
                                                label={__('Preview Text', 'doublescale')}
                                                value={template.settings.preview_text}
                                                onChange={(value) =>
                                                    updateSettings({
                                                        preview_text: value,
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
                                                        <Button variant='default' size='lg'>
                                                            {__(
                                                                'Create with email designer',
                                                                'doublescale'
                                                            )}
                                                        </Button>
                                                    </div>
                                                </CardContent></Card>
                                        </div>
                                    </div>
                                </CardContent></Card>
                        </>
                    )}
                </CardContent></Card>
        </div>
    );
};

export default Template;
