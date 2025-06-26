import { useState, useEffect } from 'react';

const getIsMobile = () => (typeof window !== 'undefined' ? window.innerWidth < 768 : false);

/**
 * Hook pour détecter si l'appareil est de type mobile (largeur < 768px).
 * @returns Un booléen indiquant si l'affichage est mobile.
 */
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(getIsMobile());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(getIsMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isMobile };
}
