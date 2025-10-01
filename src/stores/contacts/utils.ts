/**
 * Internal dependencies
 */
import type { Filter as FilterType } from '@quillcrm/client';

/**
 * Generate a query key for caching
 */
export const generateQueryKey = (
  filters: FilterType[],
  keywords: string,
  page: number,
  perPage: number
): string => {
  return JSON.stringify({ filters, keywords, page, perPage });
};
