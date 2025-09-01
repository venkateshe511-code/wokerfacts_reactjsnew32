import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        screenWidth: width,
        screenHeight: height,
      });
    };

    // Set initial state
    updateResponsiveState();

    // Add event listener
    window.addEventListener('resize', updateResponsiveState);

    // Cleanup
    return () => window.removeEventListener('resize', updateResponsiveState);
  }, []);

  return state;
}

// Helper functions for common responsive checks
export const useIsMobile = () => {
  const { isMobile } = useResponsive();
  return isMobile;
};

export const useIsTablet = () => {
  const { isTablet } = useResponsive();
  return isTablet;
};

export const useIsDesktop = () => {
  const { isDesktop } = useResponsive();
  return isDesktop;
};

// Responsive breakpoint constants
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

// Helper function to get responsive value based on screen size
export function getResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T,
  wide?: T
) {
  const { isMobile, isTablet, isDesktop, screenWidth } = useResponsive();
  
  if (isMobile) return mobile;
  if (isTablet) return tablet ?? mobile;
  if (isDesktop && screenWidth < BREAKPOINTS.wide) return desktop ?? tablet ?? mobile;
  return wide ?? desktop ?? tablet ?? mobile;
}
