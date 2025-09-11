import React, { useState, useEffect } from "react";
import { Row, Col, Input, Button } from "reactstrap";

const ClientFilters = ({
  minEmis, setMinEmis,
  maxEmis, setMaxEmis,
  minRecus, setMinRecus,
  maxRecus, setMaxRecus,
  fetchFilteredClients,
  onReset,                     // ⬅️ appel du reset global
}) => {
  // contrôles locaux pour éviter d'envoyer à chaque frappe
  const [lMinE, setLMinE] = useState(minEmis || "");
  const [lMaxE, setLMaxE] = useState(maxEmis || "");
  const [lMinR, setLMinR] = useState(minRecus || "");
  const [lMaxR, setLMaxR] = useState(maxRecus || "");

  useEffect(() => { setLMinE(minEmis || ""); }, [minEmis]);
  useEffect(() => { setLMaxE(maxEmis || ""); }, [maxEmis]);
  useEffect(() => { setLMinR(minRecus || ""); }, [minRecus]);
  useEffect(() => { setLMaxR(maxRecus || ""); }, [maxRecus]);

  const apply = () => fetchFilteredClients(lMinE, lMaxE, lMinR, lMaxR);

  const resetAll = () => {
    setLMinE(""); setLMaxE(""); setLMinR(""); setLMaxR("");
    if (onReset) onReset();          // vide tout + retire ?focus via parent
  };

  return (
    <Row className="mb-4">
      <Col md="3">
        <Input
          type="number"
          placeholder="Min. Appels Émis"
          value={lMinE}
          onChange={(e) => setLMinE(e.target.value)}
          className="text-sm"
        />
      </Col>
      <Col md="3">
        <Input
          type="number"
          placeholder="Max. Appels Émis"
          value={lMaxE}
          onChange={(e) => setLMaxE(e.target.value)}
          className="text-sm"
        />
      </Col>
      <Col md="3">
        <Input
          type="number"
          placeholder="Min. Appels Reçus"
          value={lMinR}
          onChange={(e) => setLMinR(e.target.value)}
          className="text-sm"
        />
      </Col>
      <Col md="3">
        <Input
          type="number"
          placeholder="Max. Appels Reçus"
          value={lMaxR}
          onChange={(e) => setLMaxR(e.target.value)}
          className="text-sm"
        />
      </Col>

      <Col md="12" className="d-flex justify-content-center gap-2 mt-3">
        <Button color="primary" onClick={apply} className="text-sm">
          Filtrer
        </Button>
        <Button color="secondary" onClick={resetAll} className="text-sm">
          Réinitialiser
        </Button>
      </Col>
    </Row>
  );
};

export default ClientFilters;
