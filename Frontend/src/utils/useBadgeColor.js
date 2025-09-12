import { useCallback } from "react";

export default function useBadgeColor() {
  const normalize = (v) => {
    return (v || "")
      .toString()
      .normalize("NFD")         // enlève accents
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")      // supprime espaces
      .toUpperCase()
      .trim();
  };

  const colorMap = {
    PROMESSE: "warning",

    RECEPTION: "primary",
    RECEPTION2023: "primary",
    RECEPTIONSUITERELANCE: "primary",

    "4H": "danger",         // rouge
    "PLUS2H": "orange",     // orange (custom si ton thème accepte sinon "warning")
    "PLUS6H": "secondary",  // gris
    "6H": "secondary",
    "8H": "dark",           // noir
    "12H": "info",          // bleu clair
    "12HFIXE+PORTABLE": "info",

    RAPPEL: "danger",
    RAPPEL1: "danger",
    RAPPEL2: "danger",

    NRP: "dark",
    NEREPONDPAS: "dark",
    REFUS: "danger",
    CLIENTFROID: "secondary",

    RECLAMATION: "info",
    RECLAMATIONSUITE: "info",
    RECEPRELANCE: "info",
    LIGNESUSPENDU: "secondary",
    LIGNERESTREINTE: "secondary",

    "+75ANS": "success",
    "+65ANS": "success",
    OKVALIDE: "success",
    TRAITE: "success",

    TCHATCHE: "purple",     // violet (tu peux remplacer par "secondary" si pas dispo)
    "ARAPPELER": "warning",
    "AAPPELER": "warning",

    "DU10AU20": "light",
    "DU1ERAU10": "light",

    JUSTE1H: "secondary",
    JUSTEUNEHEURE: "secondary",

    APPELANNULATION: "danger",
    DEPASSEMENT: "danger",
    HORSCIBLE: "secondary",
    NONVALIDE: "dark",
    OKNONVALIDE: "dark",
  };

  const getBadgeColor = useCallback((statut) => {
    const key = normalize(statut);
    return colorMap[key] || "secondary"; // couleur par défaut
  }, []);

  return { getBadgeColor };
}
