import { Navigate, useLocation } from "react-router-dom";

export default function RequireRegion({ children }) {
  const location = useLocation();
  const region = (localStorage.getItem("region") || "").toLowerCase();
  if (!region) {
    return <Navigate to="/select-region" state={{ from: location }} replace />;
  }
  return children;
}
