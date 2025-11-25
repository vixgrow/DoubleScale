/**
 * Hook for handling image resize operations
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type ResizeHandleType =
  | 'nw' // top-left
  | 'n' // top
  | 'ne' // top-right
  | 'e' // right
  | 'se' // bottom-right
  | 's' // bottom
  | 'sw' // bottom-left
  | 'w'; // left

interface UseImageResizeOptions {
  onResize: (width: string, height: string) => void;
  minWidth?: number;
  minHeight?: number;
  initialWidth: string;
  initialHeight: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

interface ResizeState {
  isResizing: boolean;
  handleType: ResizeHandleType | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  aspectRatio: number;
}

export const useImageResize = ({
  onResize,
  minWidth = 50,
  minHeight = 50,
  initialWidth,
  initialHeight,
  containerRef: externalContainerRef,
}: UseImageResizeOptions) => {
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalContainerRef;
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  // Parse width/height values to pixels
  const parseValue = useCallback((value: string, containerSize: number): number => {
    if (value === 'auto') return 0;
    if (value.endsWith('%')) {
      const percent = parseFloat(value);
      return (containerSize * percent) / 100;
    }
    if (value.endsWith('px')) {
      return parseFloat(value);
    }
    return parseFloat(value) || 0;
  }, []);

  // Convert pixels back to original unit
  const formatValue = useCallback(
    (pixels: number, originalValue: string, containerSize: number): string => {
      if (originalValue === 'auto') {
        return 'auto';
      }
      if (originalValue.endsWith('%')) {
        const percent = (pixels / containerSize) * 100;
        return `${Math.round(percent)}%`;
      }
      return `${Math.round(pixels)}px`;
    },
    []
  );

  // Get container dimensions
  const getContainerDimensions = useCallback(() => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }, [containerRef]);

  // Get initial dimensions in pixels
  const getInitialDimensions = useCallback(() => {
    const containerDims = getContainerDimensions();
    if (!containerDims) return { width: 0, height: 0 };

    const widthPx = parseValue(initialWidth, containerDims.width);
    const heightPx =
      initialHeight === 'auto'
        ? containerDims.height
        : parseValue(initialHeight, containerDims.height);

    return { width: widthPx, height: heightPx };
  }, [initialWidth, initialHeight, parseValue, getContainerDimensions]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handleType: ResizeHandleType) => {
      e.preventDefault();
      e.stopPropagation();

      const containerDims = getContainerDimensions();
      if (!containerDims) return;

      const initialDims = getInitialDimensions();
      const aspectRatio = initialDims.width / initialDims.height;

      setResizeState({
        isResizing: true,
        handleType,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: initialDims.width,
        startHeight: initialDims.height,
        aspectRatio,
      });
    },
    [getContainerDimensions, getInitialDimensions]
  );

  useEffect(() => {
    if (!resizeState?.isResizing) return;

    let rafId: number | null = null;
    let lastUpdateTime = 0;
    const throttleMs = 16; // ~60fps

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeState || !containerRef.current) return;

      const now = performance.now();
      if (now - lastUpdateTime < throttleMs && rafId !== null) {
        return; // Throttle updates
      }
      lastUpdateTime = now;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const containerDims = getContainerDimensions();
        if (!containerDims) return;

        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;
        const shiftKey = e.shiftKey;

        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;

        const { handleType } = resizeState;

        // Calculate new dimensions based on handle type
        switch (handleType) {
          case 'nw': // top-left
            newWidth = resizeState.startWidth - deltaX;
            newHeight = resizeState.startHeight - deltaY;
            if (shiftKey) {
              const ratio = Math.min(
                deltaX / resizeState.startWidth,
                deltaY / resizeState.startHeight
              );
              newWidth = resizeState.startWidth * (1 - ratio);
              newHeight = newWidth / resizeState.aspectRatio;
            }
            break;
          case 'n': // top
            newHeight = resizeState.startHeight - deltaY;
            if (shiftKey) {
              newWidth = newHeight * resizeState.aspectRatio;
            }
            break;
          case 'ne': // top-right
            newWidth = resizeState.startWidth + deltaX;
            newHeight = resizeState.startHeight - deltaY;
            if (shiftKey) {
              const ratio = Math.min(
                deltaX / resizeState.startWidth,
                Math.abs(deltaY) / resizeState.startHeight
              );
              newWidth = resizeState.startWidth * (1 + ratio);
              newHeight = newWidth / resizeState.aspectRatio;
            }
            break;
          case 'e': // right
            newWidth = resizeState.startWidth + deltaX;
            if (shiftKey) {
              newHeight = newWidth / resizeState.aspectRatio;
            }
            break;
          case 'se': // bottom-right
            newWidth = resizeState.startWidth + deltaX;
            newHeight = resizeState.startHeight + deltaY;
            if (shiftKey) {
              const ratio = Math.min(
                deltaX / resizeState.startWidth,
                deltaY / resizeState.startHeight
              );
              newWidth = resizeState.startWidth * (1 + ratio);
              newHeight = newWidth / resizeState.aspectRatio;
            }
            break;
          case 's': // bottom
            newHeight = resizeState.startHeight + deltaY;
            if (shiftKey) {
              newWidth = newHeight * resizeState.aspectRatio;
            }
            break;
          case 'sw': // bottom-left
            newWidth = resizeState.startWidth - deltaX;
            newHeight = resizeState.startHeight + deltaY;
            if (shiftKey) {
              const ratio = Math.min(
                Math.abs(deltaX) / resizeState.startWidth,
                deltaY / resizeState.startHeight
              );
              newWidth = resizeState.startWidth * (1 - ratio);
              newHeight = newWidth / resizeState.aspectRatio;
            }
            break;
          case 'w': // left
            newWidth = resizeState.startWidth - deltaX;
            if (shiftKey) {
              newHeight = newWidth / resizeState.aspectRatio;
            }
            break;
        }

        // Apply minimum constraints
        newWidth = Math.max(newWidth, minWidth);
        newHeight = Math.max(newHeight, minHeight);

        // Always use pixels when resizing (not percentages)
        const formattedWidth = `${Math.round(newWidth)}px`;
        const formattedHeight =
          initialHeight === 'auto'
            ? `${Math.round(newHeight)}px`
            : `${Math.round(newHeight)}px`;

        onResize(formattedWidth, formattedHeight);
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setResizeState(null);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState, minWidth, minHeight, initialHeight, getContainerDimensions, onResize]);

  return {
    containerRef,
    handleMouseDown,
    isResizing: resizeState?.isResizing || false,
  };
};

