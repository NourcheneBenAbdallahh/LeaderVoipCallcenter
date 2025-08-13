import React from "react";

import { Row, Col, Input, Button } from "reactstrap";

const ClientFilters = ({ minEmis, setMinEmis, maxEmis, setMaxEmis, minRecus, setMinRecus, maxRecus, setMaxRecus, fetchFilteredClients }) => (
  <Row className="mb-4">
    <Col md="3">
      <Input
        type="number"
        placeholder="Min. Appels Émis"
        value={minEmis}
        onChange={(e) => setMinEmis(e.target.value)}
        className="text-sm"
      />
    </Col>
    <Col md="3">
      <Input
        type="number"
        placeholder="Max. Appels Émis"
        value={maxEmis}
        onChange={(e) => setMaxEmis(e.target.value)}
        className="text-sm"
      />
    </Col>
    <Col md="3">
      <Input
        type="number"
        placeholder="Min. Appels Reçus"
        value={minRecus}
        onChange={(e) => setMinRecus(e.target.value)}
        className="text-sm"
      />
    </Col>
    <Col md="3">
      <Input
        type="number"
        placeholder="Max. Appels Reçus"
        value={maxRecus}
        onChange={(e) => setMaxRecus(e.target.value)}
        className="text-sm"
      />
    </Col>
 <Col md="12" className="d-flex justify-content-center gap-2 mt-3">
  <Button
    color="primary"
    onClick={() => fetchFilteredClients(minEmis, maxEmis, minRecus, maxRecus)}
    className="text-sm"
  >
    Filtrer
  </Button>
  <Button
    color="secondary"
    onClick={() => {
      setMinEmis("");
      setMaxEmis("");
      setMinRecus("");
      setMaxRecus("");
      fetchFilteredClients(0, 1000000, 0, 1000000);
    }}
    className="text-sm"
  >
    Réinitialiser
  </Button>
</Col>

  </Row>
);export default ClientFilters;
