// src/views/agents/Agents.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  Container, Row, Col, Card, CardHeader, CardBody, Spinner
} from "reactstrap";
import Header from "components/Headers/Header.js";
import AgentTable from "./AgentTableComponent";
import ClientSearchBar from "../clients/ClientSearchBarComponent";
import ClientPagination from "../clients/ClientPaginationComponent";
import { useLocation } from "react-router-dom";

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const agentsPerPage = 10;

  // focus
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const focusId = searchParams.get("focus"); // string | null
  const [highlightId, setHighlightId] = useState(null);
  const rowRef = useRef(null);

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

  const filteredAgents = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return agents.filter((agent) =>
      Object.values(agent).join(" ").toLowerCase().includes(s)
    );
  }, [agents, searchTerm]);

  useEffect(() => {
    if (!focusId || !filteredAgents.length) return;
    const idx = filteredAgents.findIndex(a => String(a.IDAgent_Emmission) === String(focusId));
    if (idx >= 0) {
      const page = Math.floor(idx / agentsPerPage) + 1;
      setCurrentPage(page);
      setHighlightId(String(focusId));
      // petit délai pour laisser la pagination rendre la ligne
      setTimeout(() => {
        if (rowRef.current) rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [focusId, filteredAgents, agentsPerPage]);

  // Pagination locale
  const indexOfLast = currentPage * agentsPerPage;
  const indexOfFirst = indexOfLast - agentsPerPage;
  const paginatedAgents = filteredAgents.slice(indexOfFirst, indexOfLast);
  const totalAgents = filteredAgents.length;

  return (
    <>
      <Header 
      name1="Total Agents Emmis"
    name2="Compte Actif"
      name3="Compte Inactif"
      totalClients={agents.length}
       title="Liste des agents" />
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
                    <AgentTable
                      agents={paginatedAgents}
                      highlightId={highlightId}
                      rowRef={rowRef}
                    />
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
