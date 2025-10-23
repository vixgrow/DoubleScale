/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { EmailTemplate } from '@quillcrm/client';

/**
 * Prepare template data for API
 */
export const prepareTemplateForAPI = (template: Partial<EmailTemplate>) => {

	let bodyContent = template.body || '';
	if (template.body && typeof template.body === 'object') {
		bodyContent = JSON.stringify(template.body);
	}

	return {
		name: template.name,
		type: template.type || CAMPAIGN_CHANNEL.EMAIL,
		subject: template.subject || '',
		body: bodyContent,
		preview_text: template.preview_text || '',
		settings: template.settings || {},
	};
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
		return response;
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
): Promise<any> => {
	try {
		const preparedData = prepareTemplateForAPI(templateData);

		const response = (await apiFetch({
			path: `/qc/v1/templates/${templateId}`,
			method: 'PUT',
			data: preparedData,
		})) as any;

		// Return response as-is (already in backend structure)
		return response;
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

		return response;
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
