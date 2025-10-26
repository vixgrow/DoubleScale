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
 * Create a new template
 */
export const createTemplate = async (
	templateData: Partial<EmailTemplate>
): Promise<EmailTemplate> => {
	try {
		const response = await apiFetch({
			path: '/qc/v1/templates',
			method: 'POST',
			data: templateData,
		});
		return response as EmailTemplate;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			errorMessage || __('Failed to create template', 'quillcrm')
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
		const response = await apiFetch({
			path: `/qc/v1/templates/${templateId}`,
			method: 'PUT',
			data: templateData,
		});

		return response as EmailTemplate;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			errorMessage || __('Failed to update template', 'quillcrm')
		);
	}
};

/**
 * Save template - smart endpoint that decides create vs update
 * Backend logic:
 * - No ID: Create new
 * - ID + template in use: Create new (preserve original)
 * - ID + NOT in use: Update existing
 */
export const saveTemplate = async (
	templateData: Partial<EmailTemplate>
): Promise<EmailTemplate> => {
	try {
		const response = await apiFetch({
			path: '/qc/v1/templates/save',
			method: 'POST',
			data: templateData,
		});

		return response as EmailTemplate;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			errorMessage || __('Failed to save template', 'quillcrm')
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
		const response = await apiFetch({
			path: `/qc/v1/templates/${templateId}`,
		});

		return response as EmailTemplate;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			errorMessage || __('Failed to fetch template', 'quillcrm')
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
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			errorMessage || __('Failed to delete template', 'quillcrm')
		);
	}
};

interface BuilderData {
	sections: unknown[];
	globalSettings: Record<string, unknown>;
	buttonSettings: Record<string, unknown>;
}

/**
 * Save email as template (for builder "Save as Template" feature)
 * Saves builder data as a reusable template in the library
 */
export const saveEmailAsTemplate = async (
	templateName: string,
	builderData: BuilderData
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
