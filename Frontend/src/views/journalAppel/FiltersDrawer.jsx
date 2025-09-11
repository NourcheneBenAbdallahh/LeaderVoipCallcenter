// src/views/journalAppel/FiltersDrawer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Drawer from "react-modern-drawer";
import api from "api";
import { Row, Col, Input, Label, Button, FormGroup, Spinner } from "reactstrap";

const EMPTY = {
  clientName: "",
  agentEmmissionName: "",
  agentReceptionName: "",
  Sous_Statut: [],
  dureeMin: "",
  dureeMax: "",
  dateFrom: "",
  dateTo: "",
  q: "",
};

const FALLBACK_SOUS_STATUTS = [
  "RECEPTION", "RAPPEL", "PROMESSE", "+75 ANS", "PLUS 6H", "RECLAMATION",
];

export default function FiltersDrawer({ isOpen, toggle, value, onApply }) {
  const [local, setLocal] = useState(EMPTY);

  // sous-statuts dynamiques
  const [allSousStatuts, setAllSousStatuts] = useState(FALLBACK_SOUS_STATUTS);
  const [ssLoading, setSsLoading] = useState(false);
  const [ssError, setSsError] = useState("");
  const [ssQuery, setSsQuery] = useState("");
  const fetchedOnce = useRef(false);

  // sync ouverture
  useEffect(() => {
    if (isOpen) setLocal(value || EMPTY);
  }, [isOpen, value]);

  // charger la liste des sous-statuts (1ère ouverture uniquement)
  useEffect(() => {
    if (!isOpen || fetchedOnce.current) return;
    (async () => {
      try {
        setSsLoading(true);
        setSsError("");
        const res = await api.get("/api/sous_statuts_sauf_aapellername");
        let list = res.data;

        if (Array.isArray(list) && list.length && typeof list[0] === "object") {
          list = list
            .map((x) => x.name ?? x.Nom ?? x.Sous_Statut ?? x.code ?? x.libelle)
            .filter(Boolean);
        }

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
    })();
  }, [isOpen]);

  // helpers
  const update = (k, v) => setLocal((s) => ({ ...s, [k]: v }));

  const toggleSousStatut = (code) => {
    setLocal((s) => {
      const set = new Set(s.Sous_Statut || []);
      if (set.has(code)) set.delete(code);
      else set.add(code);
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
      className="p-0"
    >
      {/* Wrapper pour contenu + boutons fixes */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0">Filtres</h5>
            <Button close onClick={toggle} />
          </div>

          <Row className="mb-3">
            <Col md="12">
              <Label>Client (nom / prénom)</Label>
              <Input
                placeholder="ex: Dupont Marie"
                value={local.clientName}
                onChange={(e) => update("clientName", e.target.value)}
              />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md="12">
              <Label>Agent Émission (nom)</Label>
              <Input
                placeholder="ex: Hanen / HANENH"
                value={local.agentEmmissionName}
                onChange={(e) => update("agentEmmissionName", e.target.value)}
              />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md="12">
              <Label>Agent Réception (nom)</Label>
              <Input
                placeholder="ex: Soumaya / SOUMAYA"
                value={local.agentReceptionName}
                onChange={(e) => update("agentReceptionName", e.target.value)}
              />
            </Col>
          </Row>

          {/* === Dates === */}
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

          {/* === Durée (secondes ou HH:MM:SS) === */}
          <Row className="mb-3">
            <Col md="6">
              <Label>Durée min (sec ou HH:MM:SS)</Label>
              <Input
                placeholder="ex: 90 ou 00:01:30"
                value={local.dureeMin}
                onChange={(e) => update("dureeMin", e.target.value)}
              />
            </Col>
            <Col md="6">
              <Label>Durée max (sec ou HH:MM:SS)</Label>
              <Input
                placeholder="ex: 600 ou 00:10:00"
                value={local.dureeMax}
                onChange={(e) => update("dureeMax", e.target.value)}
              />
            </Col>
          </Row>

          {/* === Sous-statuts === */}
          <Row className="mb-2">
            <Col md="12">
              <Label className="d-flex align-items-center justify-content-between">
                <span>Sous Statut</span>
                <span className="small text-muted">
                  {local.Sous_Statut?.length
                    ? `${local.Sous_Statut.length} sélectionné(s)`
                    : "—"}
                </span>
              </Label>

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

              <div
                style={{
                  maxHeight: 210,
                  overflowY: "auto",
                  border: "1px solid #e9ecef",
                  borderRadius: 6,
                  padding: 8,
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

          {/* === Recherche globale === */}
          <Row className="mb-3">
            <Col md="12">
              <Label>Recherche globale</Label>
              <Input
                type="text"
                placeholder="Commentaire, numéro, nom…"
                value={local.q}
                onChange={(e) => update("q", e.target.value)}
              />
            </Col>
          </Row>
        </div>

        {/* === Boutons fixes en bas === */}
        <div
          style={{
            borderTop: "1px solid #e9ecef",
            padding: "12px 16px",
            background: "#fff",
          }}
          className="d-flex gap-2"
        >
          <Button
            color="primary"
            onClick={() => {
              onApply(local);
              toggle();
            }}
          >
            Appliquer
          </Button>
          <Button color="secondary" outline onClick={reset}>
            Réinitialiser
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
