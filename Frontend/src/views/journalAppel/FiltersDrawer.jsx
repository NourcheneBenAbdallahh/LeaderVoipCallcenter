// src/views/journalAppel/FiltersDrawer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Drawer from "react-modern-drawer";
import api from "api";
import {
  Row, Col, Input, Label, Button, FormGroup, Spinner
} from "reactstrap";

const EMPTY = {
  IDAgent_Reception: "",
  IDAgent_Emmission: "",
  Sous_Statut: [],
  dureeMin: "",
  dureeMax: "",
  dateFrom: "",
  dateTo: "",
  IDClient: "",
  q: ""
};

const FALLBACK_SOUS_STATUTS = [
  "RECEPTION","RAPPEL","PROMESSE","+75 ANS","PLUS 6H","RECLAMATION"
];

const FiltersDrawer = ({ isOpen, toggle, value, onApply }) => {
  // état local (utilisé uniquement pendant l’édition dans le drawer)
  const [local, setLocal] = useState(EMPTY);

  // sous-statuts dynamiques
  const [allSousStatuts, setAllSousStatuts] = useState(FALLBACK_SOUS_STATUTS);
  const [ssLoading, setSsLoading] = useState(false);
  const [ssError, setSsError] = useState("");
  const [ssQuery, setSsQuery] = useState("");
  const fetchedOnce = useRef(false);

useEffect(() => {
    if (isOpen) setLocal(value || EMPTY);
  }, [isOpen]);

  //sous-statuts 
  useEffect(() => {
    if (!isOpen) return;
    if (fetchedOnce.current) return;

    const fetchSousStatuts = async () => {
      try {
        setSsLoading(true);
        setSsError("");
//        const res = await api.get("http://localhost:5000/api/sous_statuts_sauf_aapellername");

        const res = await api.get("/api/sous_statuts_sauf_aapellername");
        let list = res.data;

        // tolérance sur le format de la réponse
        if (Array.isArray(list) && list.length && typeof list[0] === "object") {
          list = list
            .map((x) => x.name ?? x.Nom ?? x.Sous_Statut ?? x.code ?? x.libelle)
            .filter(Boolean);
        }

        // dédoublonner + trier
        const unique = Array.from(new Set(list)).sort((a, b) =>
          a.toString().localeCompare(b.toString(), "fr", { sensitivity: "base" })
        );

        if (unique.length) setAllSousStatuts(unique);
        fetchedOnce.current = true;
      } catch (e) {
        console.error("Erreur sous-statuts :", e);
        setSsError("Impossible de charger les sous-statuts (fallback utilisé).");
        setAllSousStatuts(FALLBACK_SOUS_STATUTS);
      } finally {
        setSsLoading(false);
      }
    };

    fetchSousStatuts();
  }, [isOpen]);

  // helpers locaux
  const update = (k, v) => setLocal((s) => ({ ...s, [k]: v }));

  const toggleSousStatut = (code) => {
    setLocal((s) => {
      const set = new Set(s.Sous_Statut || []);
      if (set.has(code)) set.delete(code); else set.add(code);
      return { ...s, Sous_Statut: Array.from(set) };
    });
  };

  const reset = () => setLocal(EMPTY);

  const filteredSousStatuts = useMemo(() => {
    const q = ssQuery.trim().toLowerCase();
    if (!q) return allSousStatuts;
    return allSousStatuts.filter((s) => s.toLowerCase().includes(q));
  }, [allSousStatuts, ssQuery]);

  const selectAllVisible = () => {
    setLocal((s) => {
      const current = new Set(s.Sous_Statut || []);
      filteredSousStatuts.forEach((v) => current.add(v));
      return { ...s, Sous_Statut: Array.from(current) };
    });
  };

  const clearAllSousStatut = () => update("Sous_Statut", []);

  return (
    <Drawer
      open={isOpen}
      onClose={toggle}
      direction="left"
      size={420}
      lockBackgroundScroll
      className="p-3"
    >
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Filtres</h5>
        <Button close onClick={toggle} />
      </div>

      {/* Agents */}
      <Row className="mb-3">
        <Col md="6">
          <Label>ID Agent Réception</Label>
          <Input
            type="number" min="0"
            value={local.IDAgent_Reception || ""}
            onChange={(e) => update("IDAgent_Reception", e.target.value)}
            placeholder="ex: 22"
          />
        </Col>
        <Col md="6">
          <Label>ID Agent Émission</Label>
          <Input
            type="number" min="0"
            value={local.IDAgent_Emmission || ""}
            onChange={(e) => update("IDAgent_Emmission", e.target.value)}
            placeholder="ex: 173"
          />
        </Col>
      </Row>

      {/* Dates */}
      <Row className="mb-3">
        <Col md="6">
          <Label>Date de</Label>
          <Input
            type="date"
            value={local.dateFrom || ""}
            onChange={(e) => update("dateFrom", e.target.value)}
          />
        </Col>
        <Col md="6">
          <Label>à</Label>
          <Input
            type="date"
            value={local.dateTo || ""}
            onChange={(e) => update("dateTo", e.target.value)}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md="6">
          <Label>Durée min (sec)</Label>
          <Input
            type="number" min="0" placeholder="0"
            value={local.dureeMin || ""}
            onChange={(e) => update("dureeMin", e.target.value)}
          />
        </Col>
        <Col md="6">
          <Label>Durée max (sec)</Label>
          <Input
            type="number" min="0" placeholder="600"
            value={local.dureeMax || ""}
            onChange={(e) => update("dureeMax", e.target.value)}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md="6">
          <Label>ID Client</Label>
          <Input
            type="number" min="0"
            value={local.IDClient || ""}
            onChange={(e) => update("IDClient", e.target.value)}
            placeholder="ex: 76463"
          />
        </Col>

        <Col md="6">
          <Label className="d-flex align-items-center justify-content-between">
            <span>Sous Statut</span>
            <span className="small text-muted">
              {local.Sous_Statut?.length ? `${local.Sous_Statut.length} sélectionné(s)` : "—"}
            </span>
          </Label>

          {/* recherche locale + état chargement */}
          <div className="mb-2 d-flex align-items-center" style={{ gap: 8 }}>
            <Input
              type="search"
              placeholder="Rechercher…"
              value={ssQuery}
              onChange={(e) => setSsQuery(e.target.value)}
            />
            {ssLoading && <Spinner size="sm" />}
          </div>
          {ssError && <div className="text-danger small mb-1">{ssError}</div>}

          {/* Liste scrollable */}
          <div
            style={{
              maxHeight: 210,
              overflowY: "auto",
              border: "1px solid #e9ecef",
              borderRadius: 6,
              padding: 8
            }}
          >
            {filteredSousStatuts.map((s) => (
              <FormGroup check inline key={s} className="mr-3 mb-2">
                <Label check>
                  <Input
                    type="checkbox"
                    checked={local.Sous_Statut?.includes(s) || false}
                    onChange={() => toggleSousStatut(s)}
                  />{" "}
                  {s}
                </Label>
              </FormGroup>
            ))}
            {!ssLoading && filteredSousStatuts.length === 0 && (
              <div className="text-muted small">Aucun résultat.</div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="d-flex justify-content-end mt-2" style={{ gap: 8 }}>
            <Button size="sm" color="secondary" outline onClick={clearAllSousStatut}>
              Effacer
            </Button>
            <Button size="sm" color="light" onClick={selectAllVisible}>
              Tout (visible)
            </Button>
          </div>
        </Col>
      </Row>

   
      {/* Actions */}
      <div className="d-flex gap-2 mt-2">
        <Button
          color="primary"
          onClick={() => { onApply(local); toggle(); }}
        >
          Appliquer
        </Button>
        <Button color="secondary" outline onClick={reset}>
          Réinitialiser
        </Button>
      </div>
    </Drawer>
  );
};

export default FiltersDrawer;