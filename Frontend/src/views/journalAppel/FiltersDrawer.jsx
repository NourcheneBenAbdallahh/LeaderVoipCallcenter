// src/views/journalAppel/FiltersDrawer.jsx
import React, { useEffect, useState } from "react";
import Drawer from "react-modern-drawer";
import { Row, Col, Input, Label, Button, FormGroup } from "reactstrap";

const SOUS_STATUTS = ["RECEPTION","RAPPEL","PROMESSE","+75 ANS","PLUS 6H","RECLAMATION"];

const FiltersDrawer = ({ isOpen, toggle, value, onApply }) => {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value, isOpen]);

  const update = (k, v) => setLocal((s) => ({ ...s, [k]: v }));
  const toggleSousStatut = (code) => {
    setLocal((s) => {
      const set = new Set(s.Sous_Statut || []);
      if (set.has(code)) set.delete(code); else set.add(code);
      return { ...s, Sous_Statut: Array.from(set) };
    });
  };
  const reset = () => {
    const empty = {
      IDAgent_Reception: "", IDAgent_Emmission: "",
      Sous_Statut: [], dureeMin: "", dureeMax: "",
      dateFrom: "", dateTo: "", IDClient: ""
    };
    setLocal(empty);
  };

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

      <Row className="mb-3">
        <Col md="6">
          <Label>ID Agent Réception</Label>
          <Input type="number" min="0"
            value={local.IDAgent_Reception || ""}
            onChange={(e) => update("IDAgent_Reception", e.target.value)}
            placeholder="ex: 22"
          />
        </Col>
        <Col md="6">
          <Label>ID Agent Émission</Label>
          <Input type="number" min="0"
            value={local.IDAgent_Emmission || ""}
            onChange={(e) => update("IDAgent_Emmission", e.target.value)}
            placeholder="ex: 173"
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md="6">
          <Label>Date de</Label>
          <Input type="date"
            value={local.dateFrom || ""}
            onChange={(e) => update("dateFrom", e.target.value)}
          />
        </Col>
        <Col md="6">
          <Label>à</Label>
          <Input type="date"
            value={local.dateTo || ""}
            onChange={(e) => update("dateTo", e.target.value)}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md="6">
          <Label>Durée min (sec)</Label>
          <Input type="number" min="0" placeholder="0"
            value={local.dureeMin || ""}
            onChange={(e) => update("dureeMin", e.target.value)}
          />
        </Col>
        <Col md="6">
          <Label>Durée max (sec)</Label>
          <Input type="number" min="0" placeholder="600"
            value={local.dureeMax || ""}
            onChange={(e) => update("dureeMax", e.target.value)}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md="6">
          <Label>ID Client</Label>
          <Input type="number" min="0"
            value={local.IDClient || ""}
            onChange={(e) => update("IDClient", e.target.value)}
            placeholder="ex: 76463"
          />
        </Col>
        <Col md="6">
          <Label>Sous Statut</Label>
          <div className="d-flex flex-wrap gap-3">
            {SOUS_STATUTS.map((s) => (
              <FormGroup check inline key={s} className="mr-3">
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
          </div>
        </Col>
      </Row>

      <div className="d-flex gap-2 mt-2">
        <Button color="primary" onClick={() => { onApply(local); toggle(); }}>
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
