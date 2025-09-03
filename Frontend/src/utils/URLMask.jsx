import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Garde l'URL du navigateur toujours égale à `fixed` */
export default function URLMask({ fixed = "/app" }) {
  const location = useLocation();
  useEffect(() => {
    if (window.location.pathname !== fixed) {
      window.history.replaceState({}, "", fixed);
    }
    // à chaque changement de route (clé), on re-fixe l'URL
  }, [location.key, fixed]);
  return null;
}
