// src/views/clients/Clients.jsx
import React, { useState, useEffect, useMemo } from "react";
import api from "api";
import ClientTable from "./ClientTableComponent";

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
import ClientSearchBar from "./ClientSearchBarComponent";
import ClientFilters from "./ClientFiltersComponent";
import ClientPagination from "./ClientPaginationComponent";

import { useLocation } from "react-router-dom";
import AffecterModal from "./Affectation/AffecterModal";
//const API_BASE = "http://localhost:5000/api";

const API_BASE = "/api";

const Clients = () => {
  // ---- state principal (paginé depuis le backend) ----
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtres (côté serveur)
  const [minEmis, setMinEmis] = useState("");
  const [maxEmis, setMaxEmis] = useState("");
  const [minRecus, setMinRecus] = useState("");
  const [maxRecus, setMaxRecus] = useState("");

  // tri (local, sur la page courante seulement)
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // recherche (local, sur la page courante uniquement — si tu veux global, ajoute un paramètre q côté backend)
  const [searchTerm, setSearchTerm] = useState("");

  // pagination (côté serveur)
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 20; // 10/20/50 -> choisi; le backend limite hard à 200 dans le service
  const [totalCount, setTotalCount] = useState(0);

  // pour header (totaux de la page courante; si tu veux les totaux globaux, on fera une route /clientsopti/aggregates)
  const totalAppelsEmis = clients.reduce((sum, c) => sum + (Number(c.NB_appel_Emis) || 0), 0);
  const totalAppelsRecus = clients.reduce((sum, c) => sum + (Number(c.NB_Appel_Recu) || 0), 0);

  // focus ?highlight id via URL ?focus=123
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const focusId = searchParams.get("focus");
  const [highlightId, setHighlightId] = useState(null);

  // sélection multi
  const [selectedClients, setSelectedClients] = useState([]);

  // ---------------- utils UI ----------------
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

  const getBadgeColor = (statut) => {
    switch (statut) {
      case "PROMESSE": return "warning";
      case "RECEPTION": return "primary";
      case "RAPPEL": return "danger";
      case "PLUS 2H":
      case "PLUS 6H": return "secondary";
      case "NRP":
      case "REFUS":
      case "CLIENT FROID": return "dark";
      case "RECLAMATION":
      case "LIGNE SUSPENDU": return "info";
      case "+75 ANS":
      case "+65 ANS": return "success";
      case "TCHATCHE":
      case "ATTENTE PAYEMENT FACTURE":
      case "A RAPPELER": return "danger";
      case "DU 10 AU 20":
      case "DU 1ER AU 10": return "light";
      case "JUSTE 1H":
      case "4H": return "secondary";
      default: return "secondary";
    }
  };

  // ---------------- appels API ----------------
  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${API_BASE}/clientsopti`, {
        params: {
          page: currentPage,
          limit: clientsPerPage,
          appelsEmisMin: minEmis || 0,
          appelsEmisMax: maxEmis || 1000000,
          appelsRecusMin: minRecus || 0,
          appelsRecusMax: maxRecus || 1000000,
        },
      });
      const { clients: data, total } = res.data;
      setClients(Array.isArray(data) ? data : []);
      setTotalCount(Number(total) || 0);
    } catch (error) {
      console.error("Erreur lors de la récupération des clients :", error);
    } finally {
      setLoading(false);
    }
  };

  // Au montage & à chaque changement de page/filtres -> fetch paginé
  useEffect(() => {
    loadClients();
    // reset sélection à chaque page
    setSelectedClients([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, minEmis, maxEmis, minRecus, maxRecus, clientsPerPage]);

  // Appliquer filtres via bouton "Appliquer" (dans ClientFilters) => POST /filter + reset page 1
  const fetchFilteredClients = async (minE, maxE, minR, maxR) => {
    // on pousse d'abord les filtres dans le state, puis on va page 1
    setMinEmis(minE);
    setMaxEmis(maxE);
    setMinRecus(minR);
    setMaxRecus(maxR);
    setCurrentPage(1);
    // pas besoin d'appeler POST ici : useEffect relancera GET /clientsopti avec les bons params
  };

  // focusId : on surligne si l’ID est présent sur la page courante
  useEffect(() => {
    if (!focusId) return;
    setHighlightId(Number(focusId));
  }, [focusId]);

  // sélection
  const handleSelectClient = (id, checked) => {
    setSelectedClients(prev => {
      if (checked) return [...prev, id];
      return prev.filter(x => x !== id);
    });
  };

  const handleSelectAllClients = (checked) => {
    if (checked) setSelectedClients(sortedAndSearched.map(c => c.IDClient));
    else setSelectedClients([]);
  };

  // filtre recherche (local à la page)
  const filteredLocal = clients.filter((client) => {
    if (!searchTerm) return true;
    return Object.values(client).join(" ").toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedLocal = sortClients(filteredLocal);
  // NB : pagination est déjà côté serveur; ici on n’applique plus de slice.
  const sortedAndSearched = sortedLocal;

  // affectation
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
    console.log("Affectation OK !");
    // éventuellement: loadClients();
  };

  return (
    <>
      <Header
        name1="Total Clients"
        name2="Tot Appels Émis (page)"
        name3="Tot Appels Reçus (page)"
        totalClients={totalCount}          // total global (vient du backend)
        totalAppelsEmis={totalAppelsEmis}  // somme de la page
        totalAppelsRecus={totalAppelsRecus} // somme de la page
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
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
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
                  fetchFilteredClients={fetchFilteredClients} // déclenche page 1 + useEffect
                />

                {loading ? (
                  <div className="text-center">
                    <Spinner color="primary" /> Chargement...
                  </div>
                ) : (
                  <ClientTable
                    clients={sortedAndSearched}     // déjà paginés par le serveur
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
                  totalClients={totalCount}       // total global
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
