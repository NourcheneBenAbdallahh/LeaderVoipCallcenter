import { useCallback } from "react";

/**
 * Hook qui fournit une fonction getBadgeColor pour les sous-statuts
 */
export default function useBadgeColor() {
  const getBadgeColor = useCallback((statut) => {
    switch ((statut || "").toUpperCase()) {
      case "PROMESSE": return "warning";
      case "RECEPTION":
      case "RECEPTION 2023":
      case "RECEPTION SUITE RELANCE": return "primary";

      case "RAPPEL":
      case "RAPPEL 1":
      case "RAPPEL 2": return "danger";

      case "PLUS 2H":
      case "PLUS 6H":
      case "4H":
      case "6H":
      case "8H":
      case "12H":
      case "12H FIXE+PORTABLE":
      case "12H FIXE + PORTABLE": return "danger";

      case "NRP":
      case "NE REPOND PAS":
      case "REFUS":
      case "CLIENT FROID": return "dark";

      case "RECLAMATION":
      case "RECLAMATION SUITE":
      case "RECEP RELANCE":
      case "LIGNE SUSPENDU":
      case "LIGNE RESTREINTE": return "info";

      case "+75 ANS":
      case "+65 ANS":
      case "OK VALIDE":
      case "TRAITE": return "success";

      case "TCHATCHE":
      case "ATTENTE PAYEMENT FACTURE":
      case "A RAPPELER":
      case "À APPELER": return "danger";

      case "DU 10 AU 20":
      case "DU 1ER AU 10": return "light";

      case "JUSTE 1H":
      case "JUSTE UNE HEURE": return "secondary";

      case "APPEL ANNULATION":
      case "DEPASSEMENT":
      case "HORS CIBLE":
      case "NON VALIDE":
      case "OK NON VALIDE": return "warning";

      default: return "secondary";
    }
  }, []);

  return { getBadgeColor };
}
