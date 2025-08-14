import React from "react";
import { Row, Col, Input, Button } from "reactstrap";

const ClientPagination = ({
  currentPage,
  totalClients,
  clientsPerPage,
  setCurrentPage
}) => {
  const totalPages = Math.ceil(totalClients / clientsPerPage);
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;

const goToPage = (page) => {
  const validPage = Math.max(1, Math.min(page, totalPages));
  if (validPage !== currentPage) {
    setCurrentPage(validPage);
  }
};

  return (
    <Row className="mt-4 justify-content-center text-center">
      <Col md="8" className="d-flex flex-column align-items-center">
        <div className="mb-2 text-muted">
          <strong>
            {indexOfFirstClient + 1}-{Math.min(indexOfLastClient, totalClients)} sur {totalClients}
          </strong>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Button
            color="secondary"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ◀ Précédent
          </Button>

          <div className="d-flex align-items-center gap-1">
            <span className="text-sm">Page</span>
            <Input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(Number(e.target.value))}
              style={{ width: "70px", textAlign: "center" }}
              bsSize="sm"
            />
            <span className="text-sm">/ {totalPages}</span>
          </div>

          <Button
            color="secondary"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Suivant ▶
          </Button>
        </div>
      </Col>
    </Row>
  );
};

export default ClientPagination;
