// utils/URLMask.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const URLMask = () => {
  const location = useLocation();

  useEffect(() => {
    // Empêcher l'affichage de l'URL dans la barre d'adresse
    const cleanUrl = window.location.origin + '/';
    
    // Masquer immédiatement l'URL
    if (window.location.href !== cleanUrl) {
      window.history.replaceState({}, '', cleanUrl);
    }

    // Intercepter tous les changements de navigation
    const handleNavigation = () => {
      window.history.replaceState({}, '', cleanUrl);
    };

    // Écouter les événements de navigation
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, [location]);

  return null;
};

export default URLMask;