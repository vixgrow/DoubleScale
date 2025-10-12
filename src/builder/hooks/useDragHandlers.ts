import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from 'react';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { blocksRegistry } from '../blocks/BlockRegister';
import {
  handleTemplateDropOnCanvas,
  isTemplateSection,
  TemplateConfig,
  TemplateType,
} from '../utils/dragAndDropHelpers';
import { generateBlockId, generateColumnId, generateSectionId } from '../utils/idGenerator';

export const useDragHandlers = () => {
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

    if (!over || active.id === over.id) {
      return;
    }

    const templateTypes: TemplateType[] = [
      'library-template',
      'header-template',
      'email-body-template',
      'footer-template',
      'image-gallery-template',
    ];

    const activeType = active.data?.current?.type as TemplateType;
    if (templateTypes.includes(activeType) && active.data?.current) {
      const template = active.data.current.template as TemplateConfig;
      const overData = over.data?.current;

      const handled = handleTemplateDropOnCanvas(
        template,
        over.id,
        overData,
        (section) => dispatch(STORE_KEY).addSection(section),
        (sectionId, columnId, block) =>
          dispatch(STORE_KEY).addBlock(sectionId, columnId, block)
      );

      if (handled) {
        return;
      }
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
      const overData = over.data?.current;

      if (overData?.type === 'column') {
        const { sectionId, columnId } = overData;

        const targetSection = sections.find((s) => s.id === sectionId);
        if (targetSection && isTemplateSection(targetSection)) {
          return;
        }

        const blockDef = blocksRegistry[blockType];
        if (blockDef) {
          dispatch(STORE_KEY).addBlock(sectionId, columnId, {
            id: generateBlockId(),
            type: blockType,
            props: { ...blockDef.defaultProps },
          });
        }
        return;
      }
    }

    if (active.data?.current?.type === 'layout') {
      const layoutItem = active.data.current.item;

      const newSection = {
        id: generateSectionId(),
        columns: layoutItem.width.map((width: number) => ({
          id: generateColumnId(),
          width,
          blocks: [],
        })),
        styles: {},
      };
      dispatch(STORE_KEY).addSection(newSection);
    }
  };

  return {
    activeItem,
    handleDragStart,
    handleDragEnd,
  };
};

