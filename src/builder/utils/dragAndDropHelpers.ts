import { v4 as uuidv4 } from 'uuid';
import { EmailSection } from '../../stores/email-builder/types';

/**
 * Template type for drag and drop operations
 */
export type TemplateType =
  | 'library-template'
  | 'header-template'
  | 'email-body-template'
  | 'footer-template'
  | 'image-gallery-template';

/**
 * Template configuration interface
 */
export interface TemplateConfig {
  type: string;
  layout?: string;
  blocks: Array<{
    type: string;
    props: Record<string, any>;
  }>;
  props?: Record<string, any>;
}

/**
 * Creates a new section with default styles
 */
export const createNewSection = (): EmailSection => ({
  id: uuidv4(),
  columns: [
    {
      id: uuidv4(),
      width: 100,
      blocks: [],
    },
  ],
  styles: {
    backgroundColor: '#fff',
    padding: '20px',
  },
});

/**
 * Adds template layout information to block props
 */
export const addTemplateLayoutToBlockProps = (
  blockConfig: { type: string; props: Record<string, any> },
  template: TemplateConfig
): Record<string, any> => {
  return {
    ...blockConfig.props,
    templateLayout:
      template.layout?.[blockConfig.props.containerId] || null,
    templateType: template.type || 'library-template',
  };
};

/**
 * Checks if the drop target accepts templates
 */
export const isValidTemplateDropTarget = (
  overId: string | number | undefined,
  overData: any
): boolean => {
  return (
    overId === 'canvas' ||
    overId === 'canvas-blocks' ||
    overData?.acceptes?.includes('library-template')
  );
};

/**
 * Creates blocks from a template configuration
 */
export const createBlocksFromTemplate = (
  template: TemplateConfig,
  sectionId: string,
  columnId: string,
  addBlockFn: (sectionId: string, columnId: string, block: any) => void
): void => {
  // Handle logo-button layout with flex justify-between
  if (template.type === 'logo-button' && template.layout && template.blocks.length >= 2) {
    const containerBlockId = `container-${Date.now()}`;

    // Add logo block with inline properties
    addBlockFn(sectionId, columnId, {
      id: uuidv4(),
      type: template.blocks[0].type,
      props: {
        ...template.blocks[0].props,
        width: 'auto',
        align: 'left',
        inlineLayout: true,
        containerId: containerBlockId,
        templateLayout: template.layout,
      },
    });

    // Add button block with inline properties
    addBlockFn(sectionId, columnId, {
      id: uuidv4(),
      type: template.blocks[1].type,
      props: {
        ...template.blocks[1].props,
        width: '50%',
        align: 'right',
        inlineLayout: true,
        containerId: containerBlockId,
        templateLayout: template.layout,
      },
    });
    return;
  }

  // Handle templates with multiple blocks
  if (template.blocks && Array.isArray(template.blocks)) {
    template.blocks.forEach((blockConfig) => {
      const blockProps = addTemplateLayoutToBlockProps(blockConfig, template);
      addBlockFn(sectionId, columnId, {
        id: uuidv4(),
        type: blockConfig.type,
        props: blockProps,
      });
    });
    return;
  }

  // Fallback: Add template as a single block
  addBlockFn(sectionId, columnId, {
    id: uuidv4(),
    type: template.type,
    props: template.props || {},
  });
};

/**
 * Checks if a section is a template section (locked for editing)
 */
export const isTemplateSection = (section: EmailSection): boolean => {
  const hasTemplateLayout = section.columns.some((column) =>
    column.blocks.some((block) => block.props?.templateLayout !== undefined)
  );

  const hasTemplatePattern = section.columns.some((column) =>
    column.blocks.some((block) => {
      if (block.type === 'image' && block.props?.alt === 'Company Logo')
        return true;
      if ((block.type as string) === 'preheader') return true;
      if (block.props?.templateType) return true;
      if (block.type === 'text' && block.props?.content?.includes('©'))
        return true;
      if (block.type === 'text' && block.props?.content?.includes('Welcome'))
        return true;
      return false;
    })
  );

  return hasTemplateLayout || hasTemplatePattern;
};

/**
 * Handles dropping a template onto the canvas
 */
export const handleTemplateDropOnCanvas = (
  template: TemplateConfig,
  overId: string | number | undefined,
  overData: any,
  addSectionFn: (section: EmailSection) => void,
  addBlockFn: (sectionId: string, columnId: string, block: any) => void
): boolean => {
  if (!isValidTemplateDropTarget(overId, overData)) {
    return false;
  }

  const newSection = createNewSection();
  addSectionFn(newSection);

  const sectionId = newSection.id;
  const columnId = newSection.columns[0].id;

  createBlocksFromTemplate(template, sectionId, columnId, addBlockFn);
  return true;
};
