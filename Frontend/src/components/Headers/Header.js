import { Card, CardBody, CardTitle, Container, Row, Col } from "reactstrap";

const Header = ({
  totalClients, name1,
  totalAppelsEmis, name2,
  totalAppelsRecus, name3,
  attrb4, name4,
  delta1, delta2, delta3, delta4,
}) => {
  const renderDelta = (d) => {
    if (!d) return null; 
    return (
      <p className="mt-3 mb-0 text-muted text-sm">
        <span className={`${d.up ? "text-success" : "text-danger"} mr-2`}>
          <i className={`fas ${d.up ? "fa-arrow-up" : "fa-arrow-down"}`} /> {d.value}
        </span>{" "}
        <span className="text-nowrap">{d.label}</span>
      </p>
    );
  };

  return (
    <>
      <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
        <Container fluid>
          <div className="header-body">
            {/* ---- Titre personnalisé ---- */}
            <Row className="mb-4">
              <Col>
                <h2 className="text-white">
                  {`Bienvenue dans la plateforme ${localStorage.getItem("region") ?? ""}`}
                </h2>
              </Col>
            </Row>

            <Row>
              {/* ---- Card 1 ---- */}
              <Col lg="6" xl="3">
                <Card className="card-stats mb-4 mb-xl-0">
                  <CardBody>
                    <Row>
                      <div className="col">
                        <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                          {name1 ?? "-"}
                        </CardTitle>
                        <span className="h2 font-weight-bold mb-0">
                          {totalClients ?? "-"}
                        </span>
                      </div>
                      <Col className="col-auto">
                        <div className="icon icon-shape bg-danger text-white rounded-circle shadow">
                          <i className="fas fa-chart-bar" />
                        </div>
                      </Col>
                    </Row>
                    {renderDelta(delta1)}
                  </CardBody>
                </Card>
              </Col>

              {/* ---- Card 2 ---- */}
              <Col lg="6" xl="3">
                <Card className="card-stats mb-4 mb-xl-0">
                  <CardBody>
                    <Row>
                      <div className="col">
                        <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                          {name2 ?? "-"}
                        </CardTitle>
                        <span className="h2 font-weight-bold mb-0">
                          {totalAppelsEmis ?? "-"}
                        </span>
                      </div>
                      <Col className="col-auto">
                        <div className="icon icon-shape bg-warning text-white rounded-circle shadow">
                          <i className="fas fa-chart-pie" />
                        </div>
                      </Col>
                    </Row>
                    {renderDelta(delta2)}
                  </CardBody>
                </Card>
              </Col>

              {/* ---- Card 3 ---- */}
              <Col lg="6" xl="3">
                <Card className="card-stats mb-4 mb-xl-0">
                  <CardBody>
                    <Row>
                      <div className="col">
                        <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                          {name3 ?? "-"}
                        </CardTitle>
                        <span className="h2 font-weight-bold mb-0">
                          {totalAppelsRecus ?? "-"}
                        </span>
                      </div>
                      <Col className="col-auto">
                        <div className="icon icon-shape bg-yellow text-white rounded-circle shadow">
                          <i className="fas fa-users" />
                        </div>
                      </Col>
                    </Row>
                    {renderDelta(delta3)}
                  </CardBody>
                </Card>
              </Col>

              {/* ---- Card 4 ---- */}
              <Col lg="6" xl="3">
                <Card className="card-stats mb-4 mb-xl-0">
                  <CardBody>
                    <Row>
                      <div className="col">
                        <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                          {name4 ?? "-"}
                        </CardTitle>
                        <span className="h2 font-weight-bold mb-0">
                          {attrb4 ?? "-"}
                        </span>
                      </div>
                      <Col className="col-auto">
                        <div className="icon icon-shape bg-info text-white rounded-circle shadow">
                          <i className="fas fa-percent" />
                        </div>
                      </Col>
                    </Row>
                    {renderDelta(delta4)}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </Container>
      </div>
    </>
  );
};

export default Header;
