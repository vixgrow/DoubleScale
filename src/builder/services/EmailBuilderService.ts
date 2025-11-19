/**
 * Email Builder Service
 * 
 * Centralized business logic for email builder operations.
 * This separates concerns by moving complex logic out of components.
 */

import {
  generateBlockId,
  generateColumnId,
  generateSectionId,
} from '@/builder/utils/idGenerator';
import { getRegisteredBlocks } from '../../stores/blocks-registry';
import type {
  BlockType,
  EmailBlock,
  EmailColumn,
  EmailSection,
  LayoutTemplate,
  TemplateConfig,
} from '../types/common';

export class EmailBuilderService {
  /**
   * Creates a new section from a layout template
   */
  static createSection(layout: LayoutTemplate): EmailSection {
    const sectionId = generateSectionId();

    const columns: EmailColumn[] = layout.width.map((width) => ({
      id: generateColumnId(),
      width,
      blocks: [],
    }));

    return {
      id: sectionId,
      columns,
      layout: {
        name: layout.name,
        width: layout.width,
        value: layout.value,
      },
      styles: {
        backgroundColor: 'transparent',
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
    };
  }

  /**
   * Creates a new block from a block type
   */
  static createBlock(blockType: BlockType): EmailBlock {
    const blockDef = getRegisteredBlocks()[blockType];

    if (!blockDef) {
      throw new Error(`Unknown block type: ${blockType}`);
    }

    return {
      id: generateBlockId(),
      type: blockType,
      props: { ...blockDef.defaultProps },
    };
  }

  /**
   * Duplicates a section with new IDs
   */
  static duplicateSection(section: EmailSection): EmailSection {
    return {
      ...section,
      id: generateSectionId(),
      columns: section.columns.map((column) => ({
        ...column,
        id: generateColumnId(),
        blocks: column.blocks.map((block) => ({
          ...block,
          id: generateBlockId(),
        })),
      })),
    };
  }

  /**
   * Duplicates a block with a new ID
   */
  static duplicateBlock(block: EmailBlock): EmailBlock {
    return {
      ...block,
      id: generateBlockId(),
      props: { ...block.props },
    };
  }

  /**
   * Creates blocks from a template configuration
   */
  static createBlocksFromTemplate(
    template: TemplateConfig,
    sectionId: string,
    columnId: string
  ): EmailBlock[] {
    return template.blocks.map((blockConfig) => ({
      id: generateBlockId(),
      type: blockConfig.type as BlockType,
      props: { ...blockConfig.props },
    }));
  }

  /**
   * Validates a section structure
   */
  static validateSection(section: EmailSection): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!section.id) {
      errors.push('Section must have an ID');
    }

    if (!section.columns || section.columns.length === 0) {
      errors.push('Section must have at least one column');
    }

    if (section.columns) {
      section.columns.forEach((column, index) => {
        if (!column.id) {
          errors.push(`Column ${index} must have an ID`);
        }
        if (typeof column.width !== 'number') {
          errors.push(`Column ${index} must have a numeric width`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a block structure
   */
  static validateBlock(block: EmailBlock): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!block.id) {
      errors.push('Block must have an ID');
    }

    if (!block.type) {
      errors.push('Block must have a type');
    }

    if (!getRegisteredBlocks()[block.type]) {
      errors.push(`Unknown block type: ${block.type}`);
    }

    if (!block.props) {
      errors.push('Block must have props');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Moves a section up in the list
   */
  static moveSectionUp(sections: EmailSection[], sectionId: string): EmailSection[] {
    const index = sections.findIndex((s) => s.id === sectionId);

    if (index <= 0) {
      return sections; // Already at top or not found
    }

    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [
      newSections[index],
      newSections[index - 1],
    ];

    return newSections;
  }

  /**
   * Moves a section down in the list
   */
  static moveSectionDown(sections: EmailSection[], sectionId: string): EmailSection[] {
    const index = sections.findIndex((s) => s.id === sectionId);

    if (index === -1 || index === sections.length - 1) {
      return sections; // Not found or already at bottom
    }

    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [
      newSections[index + 1],
      newSections[index],
    ];

    return newSections;
  }

  /**
   * Finds a section by ID
   */
  static findSection(sections: EmailSection[], sectionId: string): EmailSection | undefined {
    return sections.find((s) => s.id === sectionId);
  }

  /**
   * Finds a column by ID within a section
   */
  static findColumn(
    section: EmailSection,
    columnId: string
  ): EmailColumn | undefined {
    return section.columns.find((c) => c.id === columnId);
  }

  /**
   * Finds a block by ID within a section and column
   */
  static findBlock(
    sections: EmailSection[],
    sectionId: string,
    columnId: string,
    blockId: string
  ): EmailBlock | undefined {
    const section = this.findSection(sections, sectionId);
    if (!section) return undefined;

    const column = this.findColumn(section, columnId);
    if (!column) return undefined;

    return column.blocks.find((b) => b.id === blockId);
  }

  /**
   * Checks if a section is a template section
   */
  static isTemplateSection(section: EmailSection): boolean {
    return section.columns.length === 1 && section.columns[0].blocks.length > 0;
  }

  /**
   * Converts sections to builder data format for saving
   */
  static toBuilderData(
    sections: EmailSection[],
    globalSettings: any,
    buttonSettings: any
  ) {
    return {
      type: 'builder',
      value: {
        sections,
        globalSettings,
        buttonSettings,
      },
    };
  }

  /**
   * Parses builder data from saved format
   */
  static fromBuilderData(data: any): {
    sections: EmailSection[];
    globalSettings: any;
    buttonSettings: any;
  } | null {
    if (!data || data.type !== 'builder') {
      return null;
    }

    return {
      sections: data.value?.sections || [],
      globalSettings: data.value?.globalSettings || {},
      buttonSettings: data.value?.buttonSettings || {},
    };
  }
}

