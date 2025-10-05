/**
 * wordpress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Template data interface
 */
export interface TemplateData {
  name: string;
  type?: string;
  subject?: string;
  body: string;
  settings?: any;
  hidden?: number;
  preview_text?: string;
  thumbnail?: string;
  category?: string;
  is_pro?: number;
  created_by?: number;
}

/**
 * Save email as template
 *
 * @param templateData Template data to save
 * @returns Promise with the created template
 */
export const saveEmailAsTemplate = async (
  templateData: TemplateData
): Promise<any> => {
  try {
    const response = await apiFetch({
      path: '/qc/v1/email-templates',
      method: 'POST',
      data: templateData,
    });

    return response;
  } catch (error: any) {
    console.error('Error saving template:', error);
    throw new Error(
      error.message || 'Failed to save template. Please try again.'
    );
  }
};

/**
 * Update an existing template
 *
 * @param templateId Template ID
 * @param templateData Template data to update
 * @returns Promise with the updated template
 */
export const updateTemplate = async (
  templateId: number,
  templateData: Partial<TemplateData>
): Promise<any> => {
  try {
    const response = await apiFetch({
      path: `/qc/v1/email-templates/${templateId}`,
      method: 'PUT',
      data: templateData,
    });

    return response;
  } catch (error: any) {
    console.error('Error updating template:', error);
    throw new Error(
      error.message || 'Failed to update template. Please try again.'
    );
  }
};

/**
 * Get all templates
 *
 * @param params Query parameters
 * @returns Promise with templates list
 */
export const getTemplates = async (params?: any): Promise<any> => {
  try {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    const response = await apiFetch({
      path: `/qc/v1/email-templates${queryString}`,
      method: 'GET',
    });

    return response;
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    throw new Error(
      error.message || 'Failed to fetch templates. Please try again.'
    );
  }
};

/**
 * Get a single template
 *
 * @param templateId Template ID
 * @returns Promise with the template
 */
export const getTemplate = async (templateId: number): Promise<any> => {
  try {
    const response = await apiFetch({
      path: `/qc/v1/email-templates/${templateId}`,
      method: 'GET',
    });

    return response;
  } catch (error: any) {
    console.error('Error fetching template:', error);
    throw new Error(
      error.message || 'Failed to fetch template. Please try again.'
    );
  }
};

/**
 * Delete a template
 *
 * @param templateId Template ID
 * @returns Promise with the deletion result
 */
export const deleteTemplate = async (templateId: number): Promise<any> => {
  try {
    const response = await apiFetch({
      path: `/qc/v1/email-templates/${templateId}`,
      method: 'DELETE',
    });

    return response;
  } catch (error: any) {
    console.error('Error deleting template:', error);
    throw new Error(
      error.message || 'Failed to delete template. Please try again.'
    );
  }
};
