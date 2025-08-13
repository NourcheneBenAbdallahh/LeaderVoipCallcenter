import React from "react";
import { Badge } from "reactstrap";

const labelize = (k) => ({
  IDAgent_Reception: "Agent Récep.",
  IDAgent_Emmission: "Agent Émiss.",
  IDClient: "Client",
  dureeMin: "Durée ≥",
  dureeMax: "Durée ≤",
  dateFrom: "Du",
  dateTo: "Au",
  Sous_Statut: "Sous Statut"
}[k] || k);

const FilterChips = ({ filters, onRemove }) => {
  const items = [];

  Object.entries(filters).forEach(([k, v]) => {
    if (v === "" || v == null) return;
    if (Array.isArray(v) && !v.length) return;

    if (Array.isArray(v)) {
      items.push(
        <Badge key={k} color="info" pill className="mr-2 mb-2" role="button" onClick={() => onRemove(k)}>
          {labelize(k)}: {v.join(", ")} ✕
        </Badge>
      );
    } else {
      items.push(
        <Badge key={k} color="info" pill className="mr-2 mb-2" role="button" onClick={() => onRemove(k)}>
          {labelize(k)}: {v} ✕
        </Badge>
      );
    }
  });

  if (!items.length) return null;
  return <div className="mb-3 d-flex flex-wrap">{items}</div>;
};

export default FilterChips;
