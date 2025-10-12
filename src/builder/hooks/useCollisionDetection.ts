import {
  closestCenter,
  CollisionDetection,
  pointerWithin,
} from '@dnd-kit/core';

export const useCollisionDetection = (): CollisionDetection => {
  return (args) => {
    const { active, droppableContainers } = args;

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

    const templateTypes = [
      'library-template',
      'header-template',
      'email-body-template',
      'hero-image-template',
      'image-gallery-template',
      'footer-template',
    ];

    if (
      active.data?.current?.type &&
      templateTypes.includes(active.data.current.type)
    ) {
      const canvasContainers = Array.from(
        droppableContainers.values()
      ).filter(
        (container) =>
          container.id === 'canvas' ||
          container.id === 'canvas-blocks'
      );

      return pointerWithin({
        ...args,
        droppableContainers: canvasContainers,
      });
    }

    if (active.data?.current?.type === 'block') {
      const columnContainers = Array.from(
        droppableContainers.values()
      ).filter((container) => container.data?.current?.type === 'column');

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
      ).filter((container) => container.data?.current?.type === 'column');

      return closestCenter({
        ...args,
        droppableContainers: columnContainers,
      });
    }

    return pointerWithin(args);
  };
};

