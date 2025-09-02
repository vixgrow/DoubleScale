/**
 * Email Builder API utilities
 * 
 * A set of functions for working with the email builder API endpoints
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { Block, Template, TemplateQueryOptions, TemplatesResponse } from '../types/email-builder';

/**
 * Base path for email builder API endpoints
 */
const BASE_PATH = '/qc/v1';

/**
 * Get all templates
 * 
 * @param options Query options
 * @returns Templates response
 */
export const getTemplates = async (options: TemplateQueryOptions = {}): Promise<TemplatesResponse> => {
  const defaultOptions = {
    type: 'email',
    per_page: 20,
    page: 1,
    orderby: 'id',
    order: 'DESC',
  };

  const params = { ...defaultOptions, ...options };
  const path = addQueryArgs(`${BASE_PATH}/email-templates`, params);

  try {
    return await apiFetch({ path }) as TemplatesResponse;
  } catch (error: any) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }
};

/**
 * Get a template by ID
 * 
 * @param id Template ID
 * @returns Template object
 */
export const getTemplate = async (id: number): Promise<Template> => {
  try {
    return await apiFetch({
      path: `${BASE_PATH}/email-templates/${id}`
    }) as Template;
  } catch (error: any) {
    throw new Error(`Failed to fetch template: ${error.message}`);
  }
};

/**
 * Create a new template
 * 
 * @param data Template data
 * @returns Created template
 */
export const createTemplate = async (data: any): Promise<Template> => {
  try {
    return await apiFetch({
      path: `${BASE_PATH}/email-templates`,
      method: 'POST',
      data
    }) as Template;
  } catch (error: any) {
    throw new Error(`Failed to create template: ${error.message}`);
  }
};

/**
 * Update a template
 * 
 * @param id Template ID
 * @param data Template data
 * @returns Updated template
 */
export const updateTemplate = async (id: number, data: any): Promise<Template> => {
  try {
    return await apiFetch({
      path: `${BASE_PATH}/email-templates/${id}`,
      method: 'PUT',
      data
    }) as Template;
  } catch (error: any) {
    throw new Error(`Failed to update template: ${error.message}`);
  }
};

/**
 * Delete a template
 * 
 * @param id Template ID
 * @returns Delete response
 */
export const deleteTemplate = async (id: number): Promise<{ deleted: boolean, previous: Template }> => {
  try {
    return await apiFetch({
      path: `${BASE_PATH}/email-templates/${id}`,
      method: 'DELETE'
    }) as { deleted: boolean, previous: Template };
  } catch (error: any) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }
};

/**
 * Render a template
 * 
 * @param id Template ID
 * @param mergeTags Merge tags to apply
 * @returns Rendered HTML
 */
export const renderTemplate = async (id: number, mergeTags = {}): Promise<{ html: string }> => {
  try {
    return await apiFetch({
      path: `${BASE_PATH}/email-templates/${id}/render`,
      method: 'POST',
      data: {
        merge_tags: mergeTags
      }
    }) as { html: string };
  } catch (error: any) {
    throw new Error(`Failed to render template: ${error.message}`);
  }
};

/**
 * Get available blocks
 * 
 * @returns List of blocks
 */
export const getBlocks = async (): Promise<Block[]> => {
  try {
    return await apiFetch({
      path: `${BASE_PATH}/email-blocks`
    }) as Block[];
  } catch (error: any) {
    throw new Error(`Failed to fetch blocks: ${error.message}`);
  }
};
