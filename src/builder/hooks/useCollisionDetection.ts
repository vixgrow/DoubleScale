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
      const canvasContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) =>
          container.id === 'canvas' ||
          container.id === 'canvas-blocks'
      );

      // Check if we're over the canvas first
      const canvasCollision = pointerWithin({
        ...args,
        droppableContainers: canvasContainers,
      });

      // Only detect drop zones if we're over the canvas
      if (canvasCollision.length === 0) {
        return [];
      }

      const dropZoneContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) => container.data?.current?.type === 'section-drop-zone'
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
      // Allow canvas drop (for empty canvas)
      const canvasContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) =>
          container.id === 'canvas' ||
          container.id === 'canvas-blocks'
      );

      // Check if we're over the canvas first
      const canvasCollision = pointerWithin({
        ...args,
        droppableContainers: canvasContainers,
      });

      // Only detect drop zones if we're over the canvas
      if (canvasCollision.length === 0) {
        return [];
      }

      // Use section-drop-zones (same as layouts)
      const dropZoneContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) => container.data?.current?.type === 'section-drop-zone'
      );

      const allContainers = [...dropZoneContainers, ...canvasContainers];

      return closestCenter({
        ...args,
        droppableContainers: allContainers,
      });
    }

    if (active.data?.current?.type === 'block') {
      // First check if we're over the canvas
      const canvasContainers = Array.from(
        droppableContainers.values()
      ).filter((container) =>
        container.id === 'canvas' || container.id === 'canvas-blocks'
      );

      const canvasCollision = pointerWithin({
        ...args,
        droppableContainers: canvasContainers,
      });

      // Only detect collisions if we're over the canvas
      if (canvasCollision.length === 0) {
        return [];
      }

      const columnContainers = Array.from(
        droppableContainers.values()
      ).filter((container) =>
        container.data?.current?.type === 'column'
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
      // First check if we're over the canvas
      const canvasContainers = Array.from(
        droppableContainers.values()
      ).filter((container) =>
        container.id === 'canvas' || container.id === 'canvas-blocks'
      );

      const canvasCollision = pointerWithin({
        ...args,
        droppableContainers: canvasContainers,
      });

      // Only detect column collisions if we're over the canvas
      if (canvasCollision.length === 0) {
        return [];
      }

      const columnContainers = Array.from(
        droppableContainers.values()
      ).filter((container) =>
        container.data?.current?.type === 'column'
      );

      return closestCenter({
        ...args,
        droppableContainers: columnContainers,
      });
    }

    return pointerWithin(args);
  };
};

