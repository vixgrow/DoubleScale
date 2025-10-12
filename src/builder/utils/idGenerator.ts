/**
 * ID Generation Utilities
 * 
 * Provides consistent, unique ID generation for blocks, sections, and columns.
 * Replaces Math.random() approach with more reliable methods.
 */

let counter = 0;

/**
 * Generates a unique ID with optional prefix
 * 
 * @param prefix - Optional prefix for the ID (e.g., 'block', 'section')
 * @returns A unique ID string
 * 
 * @example
 * generateId('block') // Returns: 'block-1699564832123-1'
 * generateId() // Returns: 'id-1699564832123-2'
 */
export const generateId = (prefix: string = 'id'): string => {
  counter++;
  return `${prefix}-${Date.now()}-${counter}`;
};

/**
 * Generates a section ID
 */
export const generateSectionId = (): string => {
  return generateId('section');
};

/**
 * Generates a column ID
 */
export const generateColumnId = (): string => {
  return generateId('column');
};

/**
 * Generates a block ID
 */
export const generateBlockId = (): string => {
  return generateId('block');
};

/**
 * Generates a template ID
 */
export const generateTemplateId = (): string => {
  return generateId('template');
};

/**
 * Generates a random string for non-critical uses (CSS classes, etc.)
 * 
 * @param length - Length of the random string
 * @returns A random alphanumeric string
 * 
 * @example
 * generateRandomString(8) // Returns: 'a7b3c9f2'
 */
export const generateRandomString = (length: number = 9): string => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};

/**
 * Checks if an ID is valid
 * 
 * @param id - The ID to validate
 * @returns True if the ID is valid
 */
export const isValidId = (id: string): boolean => {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Check if it matches our ID pattern: prefix-timestamp-counter
  const pattern = /^[a-z]+-\d+-\d+$/;
  return pattern.test(id);
};

/**
 * Extracts the prefix from an ID
 * 
 * @param id - The ID to extract from
 * @returns The prefix, or null if invalid
 * 
 * @example
 * getIdPrefix('block-1699564832123-1') // Returns: 'block'
 */
export const getIdPrefix = (id: string): string | null => {
  if (!isValidId(id)) {
    return null;
  }

  return id.split('-')[0];
};

/**
 * Resets the counter (useful for testing)
 */
export const resetCounter = (): void => {
  counter = 0;
};

