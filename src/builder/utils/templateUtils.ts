/**
 * Template Utilities
 * 
 * Centralized utilities for handling template blocks and sections.
 * Templates are pre-built layouts that users can edit but not restructure.
 */

import { EmailBlock, EmailSection } from '../../stores/email-builder/types';

/**
 * Check if a block is part of a template (locked from deletion/reordering)
 */
export const isTemplateBlock = (block: EmailBlock): boolean => {
  return block.props?.isTemplateBlock === true;
};

/**
 * Check if a section contains template blocks
 */
export const isTemplateSection = (section: EmailSection): boolean => {
  return section.columns.some((column) =>
    column.blocks.some((block) => isTemplateBlock(block))
  );
};

/**
 * Check if a section is a template section by ID
 * (searches through provided sections array)
 */
export const isSectionTemplate = (sectionId: string, sections: EmailSection[]): boolean => {
  const section = sections.find((s) => s.id === sectionId);
  return section ? isTemplateSection(section) : false;
};

/**
 * Mark blocks as template blocks
 */
export const markAsTemplateBlocks = (
  blocks: Array<{ type: string; props: Record<string, any> }>
): Array<{ type: string; props: Record<string, any> }> => {
  return blocks.map((block) => ({
    ...block,
    props: {
      ...block.props,
      isTemplateBlock: true,
    },
  }));
};

