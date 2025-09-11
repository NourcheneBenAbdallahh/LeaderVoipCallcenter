// utils/RoutePersist.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RoutePersist = () => {
  const location = useLocation();

  useEffect(() => {
    // Sauvegarder le chemin actuel dans le localStorage
    if (location.pathname !== '/' && location.pathname !== '/select-region') {
      localStorage.setItem('lastPath', location.pathname + location.search);
    }
  }, [location]);

  return null;
};

export default RoutePersist;