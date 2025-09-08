import React, { useState, useEffect, useMemo } from "react";
import api from "api";
import ClientTable from "./ClientTableComponent";
import { Container, Row, Col, Card, CardHeader, CardBody, Spinner } from "reactstrap";
import Header from "components/Headers/Header.js";
import ClientSearchBar from "./ClientSearchBarComponent";
import ClientFilters from "./ClientFiltersComponent";
import ClientPagination from "./ClientPaginationComponent";
import { useLocation } from "react-router-dom";
import AffecterModal from "./Affectation/AffecterModal";
import useBadgeColor from "utils/useBadgeColor";

const API_BASE = "/api";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Recherche globale
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  const [minEmis, setMinEmis] = useState("");
  const [maxEmis, setMaxEmis] = useState("");
  const [minRecus, setMinRecus] = useState("");
  const [maxRecus, setMaxRecus] = useState("");

  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 20;
  const [totalCount, setTotalCount] = useState(0);

  const totalAppelsEmis = clients.reduce((sum, c) => sum + (Number(c.NB_appel_Emis) || 0), 0);
  const totalAppelsRecus = clients.reduce((sum, c) => sum + (Number(c.NB_Appel_Recu) || 0), 0);

  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const focusId = searchParams.get("focus");
  const [highlightId, setHighlightId] = useState(null);

  const [selectedClients, setSelectedClients] = useState([]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortClients = (data) => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortField] ?? "";
      const bValue = b[sortField] ?? "";
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return sortDirection === "asc" 
        ? aValue.toString().localeCompare(bValue.toString()) 
        : bValue.toString().localeCompare(aValue.toString());
    });
  };

  const handleCopy = (text) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => alert("Numéro copié !"))
        .catch(() => alert("Erreur de copie."));
    }
  };

  const { getBadgeColor } = useBadgeColor();

  const loadClients = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: clientsPerPage,
        appelsEmisMin: minEmis ,
        appelsEmisMax: maxEmis,
        appelsRecusMin: minRecus,
        appelsRecusMax: maxRecus ,
      };

      // Ajoute le paramètre de recherche globale si spécifié
      if (globalSearchTerm) {
        params.q = globalSearchTerm;
      }

      const res = await api.get(`${API_BASE}/clientsopti`, { params });
      
      const { clients: data, total } = res.data;
      setClients(Array.isArray(data) ? data : []);
      setTotalCount(Number(total) || 0);
    } catch (error) {
      console.error("Erreur lors de la récupération des clients :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
    setSelectedClients([]);
  }, [currentPage, minEmis, maxEmis, minRecus, maxRecus, clientsPerPage, globalSearchTerm]);

  const fetchFilteredClients = async (minE, maxE, minR, maxR) => {
    setMinEmis(minE);
    setMaxEmis(maxE);
    setMinRecus(minR);
    setMaxRecus(maxR);
    setCurrentPage(1);
  };

  const handleGlobalSearch = (term) => {
    setGlobalSearchTerm(term);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!focusId) return;
    setHighlightId(Number(focusId));
  }, [focusId]);

  const handleSelectClient = (id, checked) => {
    setSelectedClients(prev => {
      if (checked) return [...prev, id];
      return prev.filter(x => x !== id);
    });
  };

  const handleSelectAllClients = (checked) => {
    if (checked) setSelectedClients(sortedClients.map(c => c.IDClient));
    else setSelectedClients([]);
  };

  const sortedClients = sortClients(clients);

  const [affModalOpen, setAffModalOpen] = useState(false);
  const [clientToAffect, setClientToAffect] = useState(null);

  const handleOpenAffecter = (client) => {
    setClientToAffect(client);
    setAffModalOpen(true);
  };

  const handleCloseAffecter = () => {
    setAffModalOpen(false);
    setClientToAffect(null);
  };

  const handleAffectationSuccess = () => {
    loadClients(); // Recharger les données après affectation
  };

  return (
    <>
      <Header 
        name1="Total Clients" 
        name2="Tot Appels Émis (page)" 
        name3="Tot Appels Reçus (page)" 
        totalClients={totalCount}
        totalAppelsEmis={totalAppelsEmis}
        totalAppelsRecus={totalAppelsRecus}
      />
      
      <Container className="mt-[-3rem]" fluid>
        <Row>
          <Col>
            <Card className="shadow">
              <CardHeader>
                <Row className="items-center justify-between">
                  <Col xs="12" md="6">
                    <h3 className="mb-0">Liste des clients</h3>
                  </Col>
                  <Col xs="12" md="6" className="text-md-right mt-2 md:mt-0">
                    <ClientSearchBar 
                      searchTerm={globalSearchTerm}
                      setSearchTerm={setGlobalSearchTerm}
                      onSearch={handleGlobalSearch}
                    />
                  </Col>
                </Row>
              </CardHeader>
              
              <CardBody>
                <ClientFilters 
                  minEmis={minEmis}
                  setMinEmis={setMinEmis}
                  maxEmis={maxEmis}
                  setMaxEmis={setMaxEmis}
                  minRecus={minRecus}
                  setMinRecus={setMinRecus}
                  maxRecus={maxRecus}
                  setMaxRecus={setMaxRecus}
                  fetchFilteredClients={fetchFilteredClients}
                />
                
                {loading ? (
                  <div className="text-center">
                    <Spinner color="primary" /> Chargement...
                  </div>
                ) : (
                  <ClientTable 
                    clients={sortedClients}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    handleSort={handleSort}
                    handleCopy={handleCopy}
                    getBadgeColor={getBadgeColor}
                    highlightId={highlightId}
                    selectedClients={selectedClients}
                    onSelectClient={handleSelectClient}
                    onSelectAllClients={handleSelectAllClients}
                    onAffecter={handleOpenAffecter}
                  />
                )}
                
                <AffecterModal 
                  isOpen={affModalOpen}
                  onClose={handleCloseAffecter}
                  client={clientToAffect}
                  onSuccess={handleAffectationSuccess}
                />
                
                <ClientPagination 
                  currentPage={currentPage}
                  totalClients={totalCount}
                  clientsPerPage={clientsPerPage}
                  setCurrentPage={setCurrentPage}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Clients;