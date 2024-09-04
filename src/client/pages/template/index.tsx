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
import { Card, Button } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	CustomTemplate as TemplateType,
	Template as TemplateSettings,
} from '@quillcrm/client';
import { useParams } from '@quillcrm/navigation';
import { Template as TemplateFields } from '@quillcrm/components';

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
			createNotice({
				type: 'success',
				message: __('Template saved', 'quillcrm'),
			});
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
						<TemplateFields
							template={settings as TemplateSettings}
							updateTemplate={updateSettings}
						/>
					</>
				)}
			</Card>
		</div>
	);
};

export default Template;
