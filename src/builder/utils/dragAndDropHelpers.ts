import { v4 as uuidv4 } from 'uuid';
import { EmailSection } from '../../stores/email-builder/types';
import { TemplateConfig } from '../types/common';

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
 * Mark block as template block (simplified)
 */
export const markAsTemplateBlock = (
  blockConfig: { type: string; props: Record<string, any> },
  templateLayout?: any
): Record<string, any> => {
  // Extract the correct templateLayout for blocks with containerId
  let finalTemplateLayout;
  if (templateLayout && blockConfig.props?.inlineLayout) {
    const containerId = blockConfig.props?.containerId;
    // If templateLayout has a containerId key, extract the nested layout
    if (containerId && templateLayout[containerId]) {
      finalTemplateLayout = templateLayout[containerId];
    } else {
      // Otherwise use templateLayout directly (for grid templates)
      finalTemplateLayout = templateLayout;
    }
  }

  return {
    ...blockConfig.props,
    isTemplateBlock: true,
    ...(finalTemplateLayout ? { templateLayout: finalTemplateLayout } : {}),
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
  // Handle templates with multiple blocks
  if (template.blocks && Array.isArray(template.blocks)) {
    template.blocks.forEach((blockConfig) => {
      const blockProps = markAsTemplateBlock(blockConfig, template.layout);
      addBlockFn(sectionId, columnId, {
        id: uuidv4(),
        type: blockConfig.type,
        props: blockProps,
      });
    });
    return;
  }

  // Fallback: Add template as a single block (rarely used, all templates should have blocks array)
  addBlockFn(sectionId, columnId, {
    id: uuidv4(),
    type: template.type,
    props: {
      isTemplateBlock: true,
    },
  });
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
