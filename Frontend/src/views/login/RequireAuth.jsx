import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "./Login";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = getToken();
 // console.log("RequireAuth - Vérification du token :", token, "Chemin actuel :", location.pathname);

  if (!token) {
  //  console.log("RequireAuth - Aucun token, redirection vers /auth/login");
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  //console.log("RequireAuth - Token valide, accès autorisé");
  return children;
}