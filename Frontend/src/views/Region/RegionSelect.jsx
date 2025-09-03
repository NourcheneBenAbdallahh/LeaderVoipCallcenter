import React from "react";
import { Container, Row, Col, Card, CardBody, Button } from "reactstrap";
import { useNavigate, useLocation } from "react-router-dom";

const regions = [
  { key: "tunis",  label: "Tunis",  icon: "ni ni-pin-3" },
  { key: "sousse", label: "Sousse", icon: "ni ni-building" },
  { key: "NewOk", label: "NewOk", icon: "ni ni-world" },
];

export default function RegionSelect() {
  const navigate = useNavigate();
  const next = useLocation().state?.from?.pathname || "/auth/login";

  const choose = (key) => {
    localStorage.setItem("region", key);
    console.log("region selected: ", key);
    navigate(next, { replace: true });
  };

return (
  <>
    <div
      className="header py-8"
      style={{
        background: "linear-gradient(87deg, #4F99E3 0, #117AEF 100%)",
      }}
    >
      <Container>
        <div className="header-body text-center">
          <h1 className="text-white mb-2 font-weight-bold">Choisissez votre région</h1>
          <p className="text-light mt-2 mb-0">
            Cette sélection détermine la base de données utilisée.
          </p>
        </div>
      </Container>
      <div className="separator separator-bottom separator-skew zindex-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2560 100"
          preserveAspectRatio="none"
        >
          <polygon
            style={{ fill: "#172B4D" }}
            points="2560 0 2560 100 0 100"
          />
        </svg>
      </div>
    </div>

    <Container className="mt--7 pb-5">
      <Row className="justify-content-center">
        {regions.map((r) => (
          <Col key={r.key} lg="3" md="4" sm="6" xs="12" className="mb-4">
            <Card className="shadow-lg border-0 h-100">
              <CardBody className="d-flex flex-column align-items-center text-center">
                <div
                  className="icon icon-shape text-white rounded-circle shadow mb-4"
                  style={{
                    background: "linear-gradient(87deg, #4F99E3 0, #117AEF 100%)",
                  }}
                >
                  <i className={`${r.icon} fa-2x`} />
                </div>
                <h5 className="text-default font-weight-bold mb-3">
                  {r.label}
                </h5>
                <Button
                  style={{
                    background: "linear-gradient(87deg, #4F99E3 0, #117AEF 100%)",
                    border: "none",
                  }}
                  onClick={() => choose(r.key)}
                  block
                >
                  Continuer
                </Button>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  </>
);

}
