import { useState } from 'react';
import * as emailBuilderApi from '../api/email-builder-api';
import type { TemplateQueryOptions } from '../types/email-builder';

/**
 * Hook for interacting with the Email Builder API
 */
export function useEmailBuilder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get all templates
   */
  const getTemplates = async (options: TemplateQueryOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await emailBuilderApi.getTemplates(options);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a template by ID
   */
  const getTemplate = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const template = await emailBuilderApi.getTemplate(id);
      return template;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new template
   */
  const createTemplate = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const template = await emailBuilderApi.createTemplate(data);
      return template;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update a template
   */
  const updateTemplate = async (id: number, data: any) => {
    setLoading(true);
    setError(null);

    try {
      const template = await emailBuilderApi.updateTemplate(id, data);
      return template;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a template
   */
  const deleteTemplate = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await emailBuilderApi.deleteTemplate(id);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render a template
   */
  const renderTemplate = async (id: number, mergeTags = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await emailBuilderApi.renderTemplate(id, mergeTags);
      return response.html;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get available blocks
   */
  const getBlocks = async () => {
    setLoading(true);
    setError(null);

    try {
      const blocks = await emailBuilderApi.getBlocks();
      return blocks;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    renderTemplate,
    getBlocks,
  };
}

export default useEmailBuilder;