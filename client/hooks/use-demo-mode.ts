import { useState, useEffect } from 'react';

/**
 * Hook to detect if demo mode is enabled
 * @returns {boolean} true if demo mode was selected during registration
 */
export const useDemoMode = (): boolean => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const demoMode = localStorage.getItem('demoMode');
    setIsDemoMode(demoMode === 'true');
  }, []);

  return isDemoMode;
};
