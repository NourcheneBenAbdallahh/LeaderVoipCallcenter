import React, { useEffect, useState } from "react";
import { CardHeader, Button, Input } from "reactstrap";

const AppelsControls = ({ onOpenFilters, onReset, searchValue = "", onSearchChange }) => {
  // on garde une valeur locale pour debouncer les frappes
  const [q, setQ] = useState(searchValue);

  // si la valeur parent change (ex: reset), on resynchronise
  useEffect(() => { setQ(searchValue || ""); }, [searchValue]);

  // debounce 300ms avant de prévenir le parent
  useEffect(() => {
    const t = setTimeout(() => {
      onSearchChange && onSearchChange(q);
    }, 300);
    return () => clearTimeout(t);
  }, [q, onSearchChange]);

  return (
    <CardHeader className="d-flex align-items-center justify-content-between">
      <h3 className="mb-0">Journal des appels</h3>

      <div className="d-flex gap-2 align-items-center" style={{ gap: 12 }}>
        <div style={{ width: 280 }}>
          <Input
            type="search"
            placeholder="Rechercher (tous champs)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Button color="primary" onClick={onOpenFilters}>Filtres</Button>
        <Button color="secondary" outline onClick={onReset}>Réinitialiser</Button>
      </div>
    </CardHeader>
  );
};

export default AppelsControls;
