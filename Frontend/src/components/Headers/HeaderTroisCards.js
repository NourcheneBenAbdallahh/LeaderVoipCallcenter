// src/components/Headers/HeaderTroisCards.jsx
import { Card, CardBody, CardTitle, Container, Row, Col } from "reactstrap";

function HeaderTroisCards({ title, name1, value1, name2, value2, name3, value3 }) {
  const region = localStorage.getItem("region") ?? "";

  return (
    <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
      <Container fluid>
        <div className="header-body">
          {/* ---- Titre ---- */}
          <Row className="mb-4">
            <Col>
              <h2 className="text-white">
                {title ?? `Bienvenue dans la plateforme ${region}`}
              </h2>
            </Col>
          </Row>

          <Row>
            {/* ---- Card 1 ---- */}
            <Col lg="6" xl="4">
              <Card className="card-stats mb-4 mb-xl-0">
                <CardBody>
                  <Row>
                    <div className="col">
                      <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                        {name1 ?? "-"}
                      </CardTitle>
                      <span className="h2 font-weight-bold mb-0">
                        {value1 ?? "-"}
                      </span>
                    </div>
                    <Col className="col-auto">
                      <div className="icon icon-shape bg-danger text-white rounded-circle shadow">
                        <i className="fas fa-users" />
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>

            {/* ---- Card 2 ---- */}
            <Col lg="6" xl="4">
              <Card className="card-stats mb-4 mb-xl-0">
                <CardBody>
                  <Row>
                    <div className="col">
                      <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                        {name2 ?? "-"}
                      </CardTitle>
                      <span className="h2 font-weight-bold mb-0">
                        {value2 ?? "-"}
                      </span>
                    </div>
                    <Col className="col-auto">
                      <div className="icon icon-shape bg-warning text-white rounded-circle shadow">
                        <i className="fas fa-phone" />
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>

            {/* ---- Card 3 ---- */}
            <Col lg="6" xl="4">
              <Card className="card-stats mb-4 mb-xl-0">
                <CardBody>
                  <Row>
                    <div className="col">
                      <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                        {name3 ?? "-"}
                      </CardTitle>
                      <span className="h2 font-weight-bold mb-0">
                        {value3 ?? "-"}
                      </span>
                    </div>
                    <Col className="col-auto">
                      <div className="icon icon-shape bg-success text-white rounded-circle shadow">
                        <i className="fas fa-chart-line" />
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
}

export default HeaderTroisCards;
