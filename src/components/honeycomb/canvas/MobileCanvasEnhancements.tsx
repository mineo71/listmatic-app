/* eslint-disable react-hooks/exhaustive-deps */
// src/components/honeycomb/canvas/MobileCanvasEnhancements.tsx
// This file contains mobile-specific enhancements for the HoneycombCanvas

import { useCallback, useRef, useEffect } from 'react';

interface MobileCanvasHook {
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  offset: { x: number; y: number };
  setOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  onCursorMove?: (position: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const useMobileCanvasEnhancements = ({
  zoom,
  setZoom,
  offset,
  setOffset,
  onCursorMove,
  containerRef
}: MobileCanvasHook) => {
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const lastZoomRef = useRef(zoom);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const touchCountRef = useRef(0);
  const cursorThrottleRef = useRef<NodeJS.Timeout | null>(null);
  
  // Constants for mobile interaction
  const MOBILE_LIMITS = {
    minX: -3000,
    maxX: 3000,
    minY: -3000,
    maxY: 3000,
    minZoom: 0.5,
    maxZoom: 4,
    tapTimeout: 300,
    doubleTapTimeout: 300,
  };

  // Update zoom ref when zoom changes
  useEffect(() => {
    lastZoomRef.current = zoom;
  }, [zoom]);

  // Limit offset to bounds
  const limitOffsetToBounds = useCallback((newOffset: { x: number; y: number }) => {
    return {
      x: Math.max(MOBILE_LIMITS.minX, Math.min(MOBILE_LIMITS.maxX, newOffset.x)),
      y: Math.max(MOBILE_LIMITS.minY, Math.min(MOBILE_LIMITS.maxY, newOffset.y)),
    };
  }, []);

  // Enhanced zoom at point function for mobile
  const zoomAtPoint = useCallback((newZoom: number, clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    newZoom = Math.max(MOBILE_LIMITS.minZoom, Math.min(MOBILE_LIMITS.maxZoom, newZoom));
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;
    
    lastZoomRef.current = newZoom;
    setZoom(newZoom);
    
    const newOffsetX = mouseX - worldX * newZoom;
    const newOffsetY = mouseY - worldY * newZoom;
    
    setOffset(limitOffsetToBounds({
      x: newOffsetX,
      y: newOffsetY
    }));
  }, [zoom, offset, setZoom, setOffset, limitOffsetToBounds, containerRef]);

  // Throttled cursor position update
  const updateCursorPosition = useCallback((clientX: number, clientY: number) => {
    if (onCursorMove && containerRef.current) {
      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }
      
      cursorThrottleRef.current = setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const worldX = (clientX - rect.left - offset.x) / zoom;
          const worldY = (clientY - rect.top - offset.y) / zoom;
          onCursorMove({ x: worldX, y: worldY });
        }
      }, 50); // Throttle to 20fps for mobile performance
    }
  }, [onCursorMove, containerRef, offset, zoom]);

  // Enhanced touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default mobile behaviors
    touchStartTimeRef.current = Date.now();
    touchCountRef.current = e.touches.length;

    if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      lastTouchDistanceRef.current = distance;
      isDraggingRef.current = false;
    } else if (e.touches.length === 1) {
      // Single finger touch - prepare for pan
      const touch = e.touches[0];
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
      
      // Update cursor position for shared mode
      updateCursorPosition(touch.clientX, touch.clientY);
    }
  }, [updateCursorPosition]);

  // Enhanced touch move handler
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      // Two finger pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const delta = distance / lastTouchDistanceRef.current;
      const newZoom = lastZoomRef.current * delta;
      
      // Zoom at the midpoint between the two touches
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      
      zoomAtPoint(newZoom, midX, midY);
      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      // Single finger pan
      const touch = e.touches[0];
      const dx = touch.clientX - lastMousePosRef.current.x;
      const dy = touch.clientY - lastMousePosRef.current.y;
      
      setOffset(prev => limitOffsetToBounds({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
      
      // Update cursor position for shared mode
      updateCursorPosition(touch.clientX, touch.clientY);
    }
  }, [limitOffsetToBounds, setOffset, zoomAtPoint, updateCursorPosition]);

  // Enhanced touch end handler
  const handleTouchEnd = useCallback(() => {
    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    // Handle tap gestures
    if (touchCountRef.current === 1 && touchDuration < MOBILE_LIMITS.tapTimeout && !isDraggingRef.current) {
      // Single tap - could be used for selection in the future
      console.log('Single tap detected');
    }
    
    lastTouchDistanceRef.current = null;
    isDraggingRef.current = false;
  }, []);

  // Enhanced mouse handlers for desktop/hybrid devices
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      
      // Update cursor position for shared mode
      updateCursorPosition(e.clientX, e.clientY);
    }
  }, [updateCursorPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Update cursor position for shared mode
    updateCursorPosition(e.clientX, e.clientY);

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;

      setOffset(prev => limitOffsetToBounds({
        x: prev.x + dx,
        y: prev.y + dy
      }));

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [setOffset, limitOffsetToBounds, updateCursorPosition]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Enhanced wheel handler with mobile consideration
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    // Reduce sensitivity on mobile devices
    const isMobile = 'ontouchstart' in window;
    const zoomFactor = isMobile ? 
      (e.deltaY > 0 ? 0.9 : 1.1) : 
      (e.deltaY > 0 ? 0.8 : 1.25);
    
    const newZoom = lastZoomRef.current * zoomFactor;
    zoomAtPoint(newZoom, e.clientX, e.clientY);
  }, [zoomAtPoint]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (cursorThrottleRef.current) {
      clearTimeout(cursorThrottleRef.current);
      cursorThrottleRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
    zoomAtPoint,
    limitOffsetToBounds,
    cleanup,
    MOBILE_LIMITS,
  };
};

// Mobile-specific utility functions
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         ('ontouchstart' in window) ||
         (window.innerWidth <= 768);
};

export const getOptimalCanvasSettings = () => {
  const mobile = isMobileDevice();
  
  return {
    maxParticipantCursors: mobile ? 3 : 10, // Limit cursor count on mobile
    cursorUpdateInterval: mobile ? 100 : 50, // Less frequent updates on mobile
    maxVisibleHexagons: mobile ? 50 : 200, // Limit rendered hexagons on mobile
    enableSmoothAnimations: !mobile, // Disable some animations on mobile for performance
    touchSensitivity: mobile ? 1.2 : 1.0, // Increase touch sensitivity on mobile
  };
};