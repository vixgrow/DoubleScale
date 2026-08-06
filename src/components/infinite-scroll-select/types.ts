/**
 * TypeScript types for InfiniteScrollSelect component
 */

import type { ReactNode } from 'react';

export interface InfiniteScrollSelectProps {
  // Core props
  value?: string | number;
  onValueChange: (value: string | number, item?: any) => void;
  placeholder?: string;

  // API configuration
  apiEndpoint: string; // e.g., '/doublescale/v1/contacts'
  apiParams?: Record<string, any>; // Additional query params
  searchParamName?: string; // Default: 'search'

  // Data formatting
  getOptionLabel: (item: any) => string;
  getOptionValue: (item: any) => string | number;
  /**
   * Optional heading an item belongs under. When provided, consecutive items
   * sharing a heading render beneath a sticky group label. Items returning an
   * empty string are listed ungrouped. Omit for a flat list (the default).
   */
  getOptionGroup?: (item: any) => string;
  /** Optional richer row content; falls back to getOptionLabel. */
  renderOption?: (item: any) => ReactNode;
  dataPath?: string; // Path to data in response (e.g., 'data')
  totalPath?: string; // Path to total count (e.g., 'total')

  // Pagination
  perPage?: number; // Default: 20

  // Pre-selected value handling
  selectedItem?: any; // Ensure this item is in the list

  // UI customization
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  inputClassName?: string;
  /** Raise above nested dialogs (e.g. contact detail → add deal). Default 200000. */
  menuZIndex?: number;
}

export interface InfiniteScrollSelectState {
  items: any[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  searchTerm: string;
  error: string | null;
}
