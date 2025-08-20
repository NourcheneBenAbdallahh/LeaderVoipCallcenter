import React, { useEffect, useState } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Button, Row, Col
} from "reactstrap";

const getAgentId = (a) => a?.id ?? a?.IDAgent_Emmission ?? a?.IDAgent ?? null;
const getAgentLabel = (a) => {
  const id = getAgentId(a);
  const nom = a?.nom ?? a?.Nom ?? "";
  const prenom = a?.Prenom ?? "";
  const np = `${nom} ${prenom}`.trim();
  return id != null ? `${id} — ${np || (a?.Login ?? "Agent")}` : (np || (a?.Login ?? "Agent"));
};

const AffectationFiltersDrawer = ({
  isOpen,
  toggle,
  value = {},
  onApply = () => {},
  agents = [],
}) => {
  const [local, setLocal] = useState({
    q: "",
    dateMin: "",
    dateMax: "",
    IDAgent: "",
  });

  useEffect(() => {
    setLocal({
      q: value.q ?? "",
      dateMin: value.dateMin ?? "",
      dateMax: value.dateMax ?? "",
      IDAgent: value.IDAgent ?? "",
    });
  }, [value, isOpen]);

  const handleChange = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));

  const handleApply = () => {
    // on renvoie l'ID tel quel (string). Si tu veux un number: parseInt(...) côté hook.
    onApply({ ...value, ...local, page: 1 });
    toggle && toggle();
  };

  const handleReset = () => {
    setLocal({ q: "", dateMin: "", dateMax: "", IDAgent: "" });
  };

  const safeAgents = Array.isArray(agents) ? agents.filter(a => getAgentId(a) != null) : [];

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
      <ModalHeader toggle={toggle}>Filtres avancés</ModalHeader>
      <ModalBody>
        <Row>
          <Col md="6">
            <FormGroup>
              <Label>Date min</Label>
              <Input
                type="date"
                value={local.dateMin}
                onChange={(e) => handleChange("dateMin", e.target.value)}
              />
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label>Date max</Label>
              <Input
                type="date"
                value={local.dateMax}
                onChange={(e) => handleChange("dateMax", e.target.value)}
              />
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md="12">
            <FormGroup>
              <Label>Agent (ID — Nom Prénom)</Label>
              <Input
                type="select"
                value={local.IDAgent}
                onChange={(e) => handleChange("IDAgent", e.target.value)}
              >
                <option value="">(Tous)</option>
                {safeAgents.map((a) => {
                  const id = getAgentId(a);
                  return (
                    <option key={id} value={id}>
                      {getAgentLabel(a)}
                    </option>
                  );
                })}
              </Input>
            </FormGroup>
          </Col>
        </Row>
      </ModalBody>

      <ModalFooter>
        <Button color="secondary" onClick={handleReset}>Réinitialiser</Button>
        <Button color="primary" onClick={handleApply}>Appliquer</Button>
      </ModalFooter>
    </Modal>
  );
};

export default AffectationFiltersDrawer;
