/**
 * useDeviceType Hook
 * 
 * Detects device type based on viewport width and touch capability
 * Returns whether the device should use mobile interactions (tap-to-open bottom sheets)
 * or desktop interactions (hover tooltips)
 */

'use client';

import { useState, useEffect } from 'react';

export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkDeviceType = () => {
      // Check viewport width (tablets and smaller)
      const viewportWidth = window.innerWidth;
      const isMobileViewport = viewportWidth < 768; // md breakpoint in Tailwind

      // Check touch capability
      const hasTouchSupport = 
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        ('msMaxTouchPoints' in navigator && (navigator as Navigator & { msMaxTouchPoints: number }).msMaxTouchPoints > 0);

      setIsMobile(isMobileViewport);
      setIsTouch(hasTouchSupport);
    };

    // Check on mount
    checkDeviceType();

    // Re-check on resize
    window.addEventListener('resize', checkDeviceType);
    
    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  // Use mobile behavior if viewport is mobile OR if device has touch and viewport is tablet-sized
  const useMobileBehavior = isMobile || (isTouch && window.innerWidth < 1024);

  return {
    isMobile,
    isTouch,
    useMobileBehavior,
    isDesktop: !isMobile && !isTouch,
  };
}
