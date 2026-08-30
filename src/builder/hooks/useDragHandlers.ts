import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from 'react';
import { getRegisteredBlocks } from '@/stores/blocks-registry';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { TemplateConfig, TemplateType } from '../types/common';
import type { SavedBlock } from '../types/common';
import {
  createBlocksFromTemplate,
  handleTemplateDropOnCanvas,
  LIBRARY_TEMPLATE_TYPES,
  markAsTemplateBlock,
  resolveColumnInsertTarget,
} from '@doublescale/utils/dragAndDropHelpers';
import { generateBlockId, generateColumnId, generateSectionId } from '@doublescale/utils/idGenerator';
import { isTemplateSection } from '@doublescale/utils/templateUtils';
import { buildSectionFromSavedBlock } from '../utils/savedBlockUtils';
import type { EmailBlock } from '../../stores/email-builder/types';

const scrollToBlock = (blockId: string) => {
  setTimeout(() => {
    const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
    blockElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
};

// Auto-select and scroll to a block (Blocks palette). Library drops skip
// selection so the sidebar stays on Library / My Blocks.
const selectAndScrollToBlock = (
  dispatch: any,
  blockId: string,
  sectionId: string,
  columnId: string
) => {
  setTimeout(() => {
    dispatch(STORE_KEY).selectBlock(blockId, sectionId, columnId);
    const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
    blockElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
};

export const useDragHandlers = (onDragEndCallback?: () => void) => {
  const dispatch = useDispatch();
  const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
  const [activeItem, setActiveItem] = useState<any>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data?.current?.type === 'section') {
      setActiveItem(null);
      return;
    }

    if (active.data?.current?.type === 'block') {
      setActiveItem(active.data.current);
      return;
    }

    setActiveItem(active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    const activeType = active.data?.current?.type as TemplateType;
    const isLibraryDrop = LIBRARY_TEMPLATE_TYPES.includes(activeType);

    // Keep Library / My Blocks open after a library drop so more items can
    // be added without reopening the accordion and switching to Settings.
    if (onDragEndCallback && over && !isLibraryDrop) {
      onDragEndCallback();
    }

    if (!over || active.id === over.id) {
      return;
    }

    const overData = over.data?.current;
    const pointerY = active.rect.current.translated
      ? active.rect.current.translated.top +
        active.rect.current.translated.height / 2
      : undefined;

    const insertBlocksIntoColumn = (
      target: { sectionId: string; columnId: string; index?: number },
      blocks: EmailBlock[]
    ) => {
      blocks.forEach((block, offset) => {
        const insertAt =
          target.index === undefined ? undefined : target.index + offset;
        dispatch(STORE_KEY).addBlock(
          target.sectionId,
          target.columnId,
          block,
          insertAt
        );
      });

      if (blocks[0]) {
        scrollToBlock(blocks[0].id);
      }
    };

    // Saved blocks are full sections — handle before flat block-list templates.
    if (activeType === 'saved-block-template' && active.data?.current) {
      const savedBlock = active.data.current.template as SavedBlock;

      if (!savedBlock?.content) {
        return;
      }

      const newSection = buildSectionFromSavedBlock(
        savedBlock.id,
        savedBlock.content
      );

      const columnTarget = resolveColumnInsertTarget(
        overData,
        over.id,
        over.rect,
        pointerY,
        sections
      );

      if (columnTarget) {
        const targetSection = sections.find(
          (section) => section.id === columnTarget.sectionId
        );
        if (targetSection && isTemplateSection(targetSection)) {
          return;
        }

        const flattenedBlocks = newSection.columns.flatMap(
          (column) => column.blocks
        );
        insertBlocksIntoColumn(columnTarget, flattenedBlocks);
        return;
      }

      if (overData?.type === 'section-drop-zone') {
        dispatch(STORE_KEY).addSection(newSection, overData.index);
      } else {
        dispatch(STORE_KEY).addSection(newSection);
      }

      const firstColumn = newSection.columns[0];
      const firstBlock = firstColumn?.blocks[0];
      if (firstBlock) {
        scrollToBlock(firstBlock.id);
      }
      return;
    }

    if (LIBRARY_TEMPLATE_TYPES.includes(activeType) && active.data?.current) {
      const template = active.data.current.template as TemplateConfig;

      const columnTarget = resolveColumnInsertTarget(
        overData,
        over.id,
        over.rect,
        pointerY,
        sections
      );

      if (columnTarget) {
        const targetSection = sections.find(
          (section) => section.id === columnTarget.sectionId
        );
        if (targetSection && isTemplateSection(targetSection)) {
          return;
        }

        let firstBlockId: string | undefined;
        createBlocksFromTemplate(
          template,
          columnTarget.sectionId,
          columnTarget.columnId,
          (sectionId, columnId, block, index) => {
            if (!firstBlockId) {
              firstBlockId = block.id;
            }
            dispatch(STORE_KEY).addBlock(sectionId, columnId, block, index);
          },
          columnTarget.index
        );

        if (firstBlockId) {
          scrollToBlock(firstBlockId);
        }
        return;
      }

      // If dropping on a drop zone, insert at specific position
      if (overData?.type === 'section-drop-zone') {
        const insertIndex = overData.index;

        // Create a new section from the template
        const newSectionId = generateSectionId();
        const newColumnId = generateColumnId();
        const newBlocks = template.blocks.map((blockConfig: any) => {
          // Mark blocks as template blocks (pass template layout for grids)
          const blockProps = markAsTemplateBlock(blockConfig, template.layout);
          return {
            id: generateBlockId(),
            type: blockConfig.type,
            props: blockProps,
          };
        });

        const newSection = {
          id: newSectionId,
          columns: [
            {
              id: newColumnId,
              width: 100,
              blocks: newBlocks,
            },
          ],
          styles: {},
        };

        // Insert at the drop zone position
        dispatch(STORE_KEY).addSection(newSection, insertIndex);

        if (newBlocks.length > 0) {
          scrollToBlock(newBlocks[0].id);
        }
        return;
      }

      // Otherwise, drop on empty canvas
      handleTemplateDropOnCanvas(
        template,
        over.id,
        overData,
        (section) => dispatch(STORE_KEY).addSection(section),
        (sectionId, columnId, block) =>
          dispatch(STORE_KEY).addBlock(sectionId, columnId, block),
        (_sectionId, _columnId, firstBlockId) => scrollToBlock(firstBlockId)
      );
      return;
    }

    if (
      active.data?.current?.type === 'section' &&
      over.data?.current?.type === 'section'
    ) {
      const activeSectionId = active.data.current.sectionId;
      const overSectionId = over.data.current.sectionId;
      dispatch(STORE_KEY).reorderSections(activeSectionId, overSectionId);
      return;
    }

    if (active.data?.current?.type === 'block') {
      const activeData = active.data.current;
      const overData = over.data?.current;

      if (overData?.type === 'column') {
        const { sectionId: toSectionId, columnId: toColumnId } =
          overData;
        const {
          blockId,
          sectionId: fromSectionId,
          columnId: fromColumnId,
        } = activeData;

        const targetSection = sections.find(
          (s) => s.id === toSectionId
        );
        if (targetSection && isTemplateSection(targetSection)) {
          return;
        }

        if (
          fromSectionId !== toSectionId ||
          fromColumnId !== toColumnId
        ) {
          dispatch(STORE_KEY).moveBlock(
            blockId,
            fromSectionId,
            fromColumnId,
            toSectionId,
            toColumnId,
            0
          );
        }
        return;
      }

      if (!overData) {
        return;
      }

      if (overData?.type === 'block') {
        const { sectionId: toSectionId, columnId: toColumnId } =
          overData;
        const {
          blockId,
          sectionId: fromSectionId,
          columnId: fromColumnId,
        } = activeData;

        const targetSection = sections.find(
          (s) => s.id === toSectionId
        );
        const targetColumn = targetSection?.columns.find(
          (c) => c.id === toColumnId
        );
        const targetBlockIndex =
          targetColumn?.blocks.findIndex((b) => b.id === over.id) ||
          0;

        let toIndex = targetBlockIndex;

        if (
          fromSectionId === toSectionId &&
          fromColumnId === toColumnId
        ) {
          toIndex = targetBlockIndex;
        } else {
          toIndex = targetBlockIndex + 1;
        }

        if (
          fromSectionId !== toSectionId ||
          fromColumnId !== toColumnId ||
          active.id !== over.id
        ) {
          try {
            dispatch(STORE_KEY).moveBlock(
              blockId,
              fromSectionId,
              fromColumnId,
              toSectionId,
              toColumnId,
              toIndex
            );
          } catch (error) {
            console.error('Error executing moveBlock:', error);
          }
        }
        return;
      }
    }

    if (active.data?.current?.type === 'element') {
      const { blockType } = active.data.current;
      const columnTarget = resolveColumnInsertTarget(
        overData,
        over.id,
        over.rect,
        pointerY,
        sections
      );

      if (columnTarget) {
        const targetSection = sections.find(
          (s) => s.id === columnTarget.sectionId
        );
        if (
          targetSection &&
          isTemplateSection(targetSection) &&
          blockType !== 'text'
        ) {
          return;
        }

        const blockDef = getRegisteredBlocks()[blockType];
        if (blockDef) {
          const newBlockId = generateBlockId();
          dispatch(STORE_KEY).addBlock(
            columnTarget.sectionId,
            columnTarget.columnId,
            {
              id: newBlockId,
              type: blockType,
              props: { ...blockDef.defaultProps },
            },
            columnTarget.index
          );
          selectAndScrollToBlock(
            dispatch,
            newBlockId,
            columnTarget.sectionId,
            columnTarget.columnId
          );
        }
      }
      return;
    }

    if (active.data?.current?.type === 'layout') {
      const layoutItem = active.data.current.item;
      const overData = over.data?.current;

      const newSection = {
        id: generateSectionId(),
        columns: layoutItem.width.map((width: number) => ({
          id: generateColumnId(),
          width,
          blocks: [],
        })),
        styles: {
          backgroundColor: 'transparent',
          padding: '40px 40px 40px 40px',
        },
      };

      // If dropping on a drop zone, insert at specific position
      if (overData?.type === 'section-drop-zone') {
        const insertIndex = overData.index;
        dispatch(STORE_KEY).addSection(newSection, insertIndex);
      } else {
        // Otherwise add at end (for empty canvas)
        dispatch(STORE_KEY).addSection(newSection);
      }
    }
  };

  return {
    activeItem,
    handleDragStart,
    handleDragEnd,
  };
};

