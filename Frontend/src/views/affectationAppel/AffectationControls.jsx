// views/appelsAffectation/AffectationControls.jsx
import React, { useEffect, useRef, useState } from "react";
import { CardHeader, Button, Input, CustomInput, Label } from "reactstrap";

const AffectationControls = ({
  onOpenFilters,
  onReset,
  searchValue = "",
  onSearchChange,
  aAppelerOnly = false,
  onToggleAAppelerOnly
}) => {
  const [q, setQ] = useState(searchValue);

  // garder callback sans la mettre en deps
  const cbRef = useRef(onSearchChange);
  useEffect(() => { cbRef.current = onSearchChange; }, [onSearchChange]);

  // resync si parent change (ex: reset)
  useEffect(() => { setQ(searchValue || ""); }, [searchValue]);

  // éviter le trigger au 1er render
  const didMountRef = useRef(false);

  // debounce 300ms seulement sur q
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    const t = setTimeout(() => { cbRef.current && cbRef.current(q); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const handleReset = () => {
    setQ("");
    onReset && onReset();
  };

  return (
    <CardHeader className="d-flex align-items-center justify-content-between">
      <h3 className="mb-0">Appels à affecter</h3>

      <div className="d-flex align-items-center" style={{ gap: 12 }}>
        <div style={{ width: 280 }}>
          <Input
            type="search"
            placeholder="Rechercher (tous champs)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") cbRef.current && cbRef.current(q); }}
          />
        </div>

      

        <Button color="primary" onClick={onOpenFilters}>Filtres</Button>
        <Button color="secondary" outline onClick={handleReset}>Réinitialiser</Button>
      </div>
    </CardHeader>
  );
};

export default AffectationControls;
