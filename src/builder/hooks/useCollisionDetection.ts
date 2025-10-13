import {
  closestCenter,
  CollisionDetection,
  pointerWithin
} from '@dnd-kit/core';

export const useCollisionDetection = (): CollisionDetection => {
  return (args) => {
    const { active, droppableContainers } = args;

    // Layout items - detect drop zones between sections
    if (active.data?.current?.type === 'layout') {
      const dropZoneContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) => container.data?.current?.type === 'section-drop-zone'
      );

      const canvasContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) =>
          container.id === 'canvas' ||
          container.id === 'canvas-blocks'
      );

      const allContainers = [...dropZoneContainers, ...canvasContainers];

      return closestCenter({
        ...args,
        droppableContainers: allContainers,
      });
    }

    // Section reordering - only detect other sections
    if (active.data?.current?.type === 'section') {
      const sectionContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) => container.data?.current?.type === 'section'
      );

      return closestCenter({
        ...args,
        droppableContainers: sectionContainers,
      });
    }

    // Template types (library items) - work same as layouts (use drop zones)
    const templateTypes = [
      'library-template',
      'header-template',
      'email-body-template',
      'hero-image-template',
      'image-gallery-template',
      'footer-template',
      'preheader-template',
    ];

    if (
      active.data?.current?.type &&
      templateTypes.includes(active.data.current.type)
    ) {
      // Use section-drop-zones (same as layouts)
      const dropZoneContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) => container.data?.current?.type === 'section-drop-zone'
      );

      // Allow canvas drop (for empty canvas)
      const canvasContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) =>
          container.id === 'canvas' ||
          container.id === 'canvas-blocks'
      );

      const allContainers = [...dropZoneContainers, ...canvasContainers];

      return closestCenter({
        ...args,
        droppableContainers: allContainers,
      });
    }

    if (active.data?.current?.type === 'block') {
      const columnContainers = Array.from(
        droppableContainers.values()
      ).filter((container) =>
        container.data?.current?.type === 'column' &&
        !container.data?.current?.isTemplateSection // Exclude template sections
      );

      const blockContainers = Array.from(
        droppableContainers.values()
      ).filter((container) => container.data?.current?.type === 'block');

      const allContainers = [...columnContainers, ...blockContainers];

      return pointerWithin({
        ...args,
        droppableContainers: allContainers,
      });
    }

    if (active.data?.current?.type === 'element') {
      const columnContainers = Array.from(
        droppableContainers.values()
      ).filter((container) =>
        container.data?.current?.type === 'column' &&
        !container.data?.current?.isTemplateSection // Exclude template sections
      );

      return closestCenter({
        ...args,
        droppableContainers: columnContainers,
      });
    }

    return pointerWithin(args);
  };
};

