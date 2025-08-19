import React, { useEffect, useState } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Row, Col, Button
} from "reactstrap";

const defaultLocal = {
  statut: "",
  idAgent: "",
  dateFrom: "",
  dateTo: "",
  minDuree: "",
  maxDuree: ""
};

const AffectationFiltersDrawer = ({ isOpen, toggle, value = {}, onApply, agents = [], statuts = [] }) => {
  const [local, setLocal] = useState({ ...defaultLocal, ...value });

  useEffect(() => {
    setLocal({ ...defaultLocal, ...value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleChange = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));

  const handleApply = () => {
    onApply && onApply({
      ...value,
      statut: local.statut || "",
      idAgent: local.idAgent || "",
      dateFrom: local.dateFrom || "",
      dateTo: local.dateTo || "",
      minDuree: local.minDuree || "",
      maxDuree: local.maxDuree || "",
      page: 1 // reset pagination quand on filtre
    });
    toggle && toggle();
  };

  const handleClear = () => {
    setLocal(defaultLocal);
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
      <ModalHeader toggle={toggle}>Filtres</ModalHeader>
      <ModalBody>
        <Row>
          <Col md="6">
            <FormGroup>
              <Label>Statut</Label>
              <Input
                type="select"
                value={local.statut}
                onChange={(e) => handleChange("statut", e.target.value)}
              >
                <option value="">(Tous)</option>
                {statuts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Input>
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label>Agent</Label>
              <Input
                type="select"
                value={local.idAgent}
                onChange={(e) => handleChange("idAgent", e.target.value)}
              >
                <option value="">(Tous)</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </Input>
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md="6">
            <FormGroup>
              <Label>Du</Label>
              <Input
                type="date"
                value={local.dateFrom}
                onChange={(e) => handleChange("dateFrom", e.target.value)}
              />
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label>Au</Label>
              <Input
                type="date"
                value={local.dateTo}
                onChange={(e) => handleChange("dateTo", e.target.value)}
              />
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md="6">
            <FormGroup>
              <Label>Durée min (sec)</Label>
              <Input
                type="number"
                min="0"
                value={local.minDuree}
                onChange={(e) => handleChange("minDuree", e.target.value)}
              />
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label>Durée max (sec)</Label>
              <Input
                type="number"
                min="0"
                value={local.maxDuree}
                onChange={(e) => handleChange("maxDuree", e.target.value)}
              />
            </FormGroup>
          </Col>
        </Row>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClear}>Effacer</Button>
        <Button color="primary" onClick={handleApply}>Appliquer</Button>
      </ModalFooter>
    </Modal>
  );
};

export default AffectationFiltersDrawer;
