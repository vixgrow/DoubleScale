/**
 * Email Builder Types
 */

/**
 * Email Template interface
 */
export interface Template {
  id: number;
  name: string;
  type: string;
  subject: string;
  body: any;
  settings: any;
  hidden: number;
  preview_text?: string;
  thumbnail?: string;
  category?: string;
  is_pro?: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  parsed_body?: any;
  parsed_settings?: any;
}

/**
 * Templates list response
 */
export interface TemplatesResponse {
  templates: Template[];
  total: number;
  pages: number;
}

/**
 * Query options for templates
 */
export interface TemplateQueryOptions {
  type?: string;
  per_page?: number;
  page?: number;
  orderby?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
  category?: string;
  hidden?: number;
  is_pro?: number;
}

/**
 * Block definition
 */
export interface Block {
  type: string;
  name: string;
  defaultProps: any;
}
