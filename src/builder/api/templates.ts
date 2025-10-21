/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { EmailTemplate, EmailTemplateSettings } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';

/**
 * Prepare template data for API
 * Separates fields into columns vs settings
 */
export const prepareTemplateForAPI = (template: Partial<EmailTemplate>) => {
	// Fields that go into settings JSON column
	const settings: Partial<EmailTemplateSettings> = {
		from_name: template.from_name || '',
		from_email: template.from_email || '',
		reply_to: template.reply_to || '',
		enable_utm: template.enable_utm || false,
		utm_source: template.utm_source || '',
		utm_medium: template.utm_medium || '',
		utm_name: template.utm_name || '',
		utm_term: template.utm_term || '',
		utm_content: template.utm_content || '',
	};

	// Prepare body field - if email_body is provided, store it as JSON in body
	let bodyContent = template.body || '';
	if (template.email_body) {
		bodyContent = JSON.stringify(template.email_body);
	}

	// Fields that go into direct columns
	return {
		name: template.name,
		type: template.type || CAMPAIGN_CHANNEL.EMAIL,
		subject: template.subject || '',
		body: bodyContent, // Store builder data or rich-text content
		preview_text: template.preview_text || '',
		settings,
	};
};

/**
 * Flatten template settings for UI
 * Combines settings JSON with top-level fields
 */
export const flattenTemplateSettings = (template: any): EmailTemplate => {
	const flattened: any = {
		id: template.id,
		name: template.name,
		type: template.type,
		subject: template.subject,
		body: template.body,
		preview_text: template.preview_text,
		settings: template.settings,
		created_at: template.created_at,
		updated_at: template.updated_at,
	};

	// Flatten settings fields for UI convenience
	if (template.settings) {
		flattened.from_name = template.settings.from_name || '';
		flattened.from_email = template.settings.from_email || '';
		flattened.reply_to = template.settings.reply_to || '';
		flattened.enable_utm = template.settings.enable_utm || false;
		flattened.utm_source = template.settings.utm_source || '';
		flattened.utm_medium = template.settings.utm_medium || '';
		flattened.utm_name = template.settings.utm_name || '';
		flattened.utm_term = template.settings.utm_term || '';
		flattened.utm_content = template.settings.utm_content || '';
	}

	// Parse email_body from body field if it contains JSON
	if (template.body) {
		try {
			const parsedBody = JSON.parse(template.body);
			if (
				parsedBody &&
				typeof parsedBody === 'object' &&
				parsedBody.type === 'builder'
			) {
				flattened.email_body = parsedBody;
			}
		} catch (e) {
			// If body is not JSON, it's probably rich-text content, leave as is
		}
	}

	return flattened;
};

/**
 * Create a new template
 */
export const createTemplate = async (
	templateData: Partial<EmailTemplate>
): Promise<EmailTemplate> => {
	try {
		const preparedData = prepareTemplateForAPI(templateData);

		const response = (await apiFetch({
			path: '/qc/v1/templates',
			method: 'POST',
			data: preparedData,
		})) as any;

		return flattenTemplateSettings(response);
	} catch (error: any) {
		throw new Error(
			error.message || __('Failed to create template', 'quillcrm')
		);
	}
};

/**
 * Update an existing template
 */
export const updateTemplate = async (
	templateId: number,
	templateData: Partial<EmailTemplate>
): Promise<EmailTemplate> => {
	try {
		const preparedData = prepareTemplateForAPI(templateData);

		const response = (await apiFetch({
			path: `/qc/v1/templates/${templateId}`,
			method: 'PUT',
			data: preparedData,
		})) as any;

		return flattenTemplateSettings(response);
	} catch (error: any) {
		throw new Error(
			error.message || __('Failed to update template', 'quillcrm')
		);
	}
};

/**
 * Get a template by ID
 */
export const getTemplate = async (
	templateId: number
): Promise<EmailTemplate> => {
	try {
		const response = (await apiFetch({
			path: `/qc/v1/templates/${templateId}`,
		})) as any;

		return flattenTemplateSettings(response);
	} catch (error: any) {
		throw new Error(
			error.message || __('Failed to fetch template', 'quillcrm')
		);
	}
};

/**
 * Delete a template
 */
export const deleteTemplate = async (templateId: number): Promise<void> => {
	try {
		await apiFetch({
			path: `/qc/v1/templates/${templateId}`,
			method: 'DELETE',
		});
	} catch (error: any) {
		throw new Error(
			error.message || __('Failed to delete template', 'quillcrm')
		);
	}
};

/**
 * Save email as template (for builder "Save as Template" feature)
 * Saves builder data as a reusable template in the library
 */
export const saveEmailAsTemplate = async (
	templateName: string,
	builderData: { sections: any; globalSettings: any; buttonSettings: any }
): Promise<EmailTemplate> => {
	// Store builder data directly in body field as JSON
	const bodyData = {
		type: 'builder',
		value: builderData,
	};

	// Use createTemplate with proper structure
	return createTemplate({
		name: templateName,
		type: CAMPAIGN_CHANNEL.EMAIL,
		subject: '',
		body: JSON.stringify(bodyData), // Store builder data in body field
		preview_text: '',
	});
};
