import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Spinner
} from "reactstrap";

import Header from "components/Headers/Header.js";
import AgentTable from "./AgentTableComponent";
import ClientSearchBar from "../clients/ClientSearchBarComponent"; // réutilisé
import ClientPagination from "../clients/ClientPaginationComponent"; // réutilisé

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const agentsPerPage = 10;

  // Chargement des agents
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/agents")
      .then((res) => {
        setAgents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement agents :", err);
        setLoading(false);
      });
  }, []);

  // Filtrage
  const filteredAgents = agents.filter((agent) =>
    Object.values(agent)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const paginatedAgents = filteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);
  const totalAgents = filteredAgents.length;

  return (
    <>
      <Header totalClients={agents.length} title="Liste des agents" />
      <Container className="mt-[-3rem]" fluid>
        <Row>
          <Col>
            <Card className="shadow">
              <CardHeader>
                <Row className="items-center justify-between">
                  <Col xs="12" md="6">
                    <h3 className="mb-0">Liste des agents</h3>
                  </Col>
                  <Col xs="12" md="6" className="text-md-right mt-2 md:mt-0">
                    <ClientSearchBar
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center">
                    <Spinner color="primary" /> Chargement...
                  </div>
                ) : (
                  <>
                    <AgentTable agents={paginatedAgents} />
                    <ClientPagination
                      currentPage={currentPage}
                      totalClients={totalAgents}
                      clientsPerPage={agentsPerPage}
                      setCurrentPage={setCurrentPage}
                    />
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Agents;
