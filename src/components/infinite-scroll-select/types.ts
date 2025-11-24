/**
 * TypeScript types for InfiniteScrollSelect component
 */

export interface InfiniteScrollSelectProps {
  // Core props
  value?: string | number;
  onValueChange: (value: string | number, item?: any) => void;
  placeholder?: string;

  // API configuration
  apiEndpoint: string; // e.g., '/qc/v1/contacts'
  apiParams?: Record<string, any>; // Additional query params
  searchParamName?: string; // Default: 'search'

  // Data formatting
  getOptionLabel: (item: any) => string;
  getOptionValue: (item: any) => string | number;
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
}

export interface InfiniteScrollSelectState {
  items: any[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  searchTerm: string;
  error: string | null;
}
