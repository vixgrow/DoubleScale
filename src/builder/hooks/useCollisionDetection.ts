import {
  closestCenter,
  CollisionDetection,
  pointerWithin
} from '@dnd-kit/core';
import { LIBRARY_TEMPLATE_TYPES } from '@doublescale/utils/dragAndDropHelpers';

const filterByType = (
  droppableContainers: { values: () => Iterable<{ data?: { current?: { type?: string } } }> },
  type: string
) =>
  Array.from(droppableContainers.values()).filter(
    (container) => container.data?.current?.type === type
  );

export const useCollisionDetection = (): CollisionDetection => {
  return (args) => {
    const { active, droppableContainers } = args;
    const activeType = active.data?.current?.type as string | undefined;

    const canvasContainers = Array.from(droppableContainers.values()).filter(
      (container) =>
        container.id === 'canvas' || container.id === 'canvas-blocks'
    );

    const isOverCanvas =
      pointerWithin({
        ...args,
        droppableContainers: canvasContainers,
      }).length > 0;

    // Layouts stay section-level. Library / saved blocks can also land
    // inside a section (column or between existing blocks).
    if (activeType === 'layout' || LIBRARY_TEMPLATE_TYPES.includes(activeType as any)) {
      if (!isOverCanvas) {
        return [];
      }

      if (LIBRARY_TEMPLATE_TYPES.includes(activeType as any)) {
        const blockContainers = filterByType(droppableContainers, 'block');
        const blockHits = pointerWithin({
          ...args,
          droppableContainers: blockContainers,
        });
        if (blockHits.length > 0) {
          return blockHits;
        }

        const columnContainers = filterByType(droppableContainers, 'column');
        const columnHits = pointerWithin({
          ...args,
          droppableContainers: columnContainers,
        });
        if (columnHits.length > 0) {
          return columnHits;
        }
      }

      const dropZoneContainers = filterByType(
        droppableContainers,
        'section-drop-zone'
      );

      if (dropZoneContainers.length > 0) {
        return closestCenter({
          ...args,
          droppableContainers: dropZoneContainers,
        });
      }

      return closestCenter({
        ...args,
        droppableContainers: canvasContainers,
      });
    }

    // Section reordering - only detect other sections
    if (activeType === 'section') {
      const sectionContainers = filterByType(droppableContainers, 'section');

      return closestCenter({
        ...args,
        droppableContainers: sectionContainers,
      });
    }

    if (activeType === 'block') {
      if (!isOverCanvas) {
        return [];
      }

      const columnContainers = filterByType(droppableContainers, 'column');
      const blockContainers = filterByType(droppableContainers, 'block');

      return pointerWithin({
        ...args,
        droppableContainers: [...columnContainers, ...blockContainers],
      });
    }

    if (activeType === 'element') {
      if (!isOverCanvas) {
        return [];
      }

      const blockContainers = filterByType(droppableContainers, 'block');
      const blockHits = pointerWithin({
        ...args,
        droppableContainers: blockContainers,
      });
      if (blockHits.length > 0) {
        return blockHits;
      }

      const columnContainers = filterByType(droppableContainers, 'column');
      return closestCenter({
        ...args,
        droppableContainers: columnContainers,
      });
    }

    return pointerWithin(args);
  };
};
