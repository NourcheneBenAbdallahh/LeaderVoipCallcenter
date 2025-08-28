import React, { useState, useEffect } from "react";
import axios from "axios";
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

//import id client
import { useLocation } from "react-router-dom";
import { useMemo } from "react";

import AffecterModal from "./Affectation/AffecterModal";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [minEmis, setMinEmis] = useState("");
  const [maxEmis, setMaxEmis] = useState("");
  const [minRecus, setMinRecus] = useState("");
  const [maxRecus, setMaxRecus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 10;

  const totalAppelsEmis = clients.reduce((sum, client) => sum + client.NB_appel_Emis, 0);
  const totalAppelsRecus = clients.reduce((sum, client) => sum + client.NB_Appel_Recu, 0);

  //clientbuId
  const location = useLocation();
const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
const focusId = searchParams.get("focus"); // string ou null
const [highlightId, setHighlightId] = useState(null);


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
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return sortDirection === "asc"
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString());
    });
  };

  const handleCopy = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
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

  const fetchFilteredClients = async (minEmis, maxEmis, minRecus, maxRecus) => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/clients/filter", {
        appelsEmisMin: parseInt(minEmis) || 0,
        appelsEmisMax: parseInt(maxEmis) || 1000000,
        appelsRecusMin: parseInt(minRecus) || 0,
        appelsRecusMax: parseInt(maxRecus) || 1000000,
      });
      setClients(response.data.clients);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du filtrage des clients :", error);
      setLoading(false);
    }
  };

  //selectionner
const [selectedClients, setSelectedClients] = useState([]);

  const handleSelectClient = (id, checked) => {
    setSelectedClients(prev => {
      if (checked) return [...prev, id];
      return prev.filter(x => x !== id);
    });
  };

  const handleSelectAllClients = (checked) => {
    if (checked) setSelectedClients(paginatedClients.map(c => c.IDClient));
    else setSelectedClients([]);
  };
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/clients")
      .then((response) => {
        setClients(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des clients :", error);
        setLoading(false);
      });
  }, []);

  //idimport
useEffect(() => {
  if (!focusId || clients.length === 0) return;

  // 1) applique la recherche (si tu veux garder ta barre de recherche comme point d'entrée)
  setSearchTerm(focusId);

  // 2) reproduis le pipeline (filtre + tri) pour trouver l’index du client
  const filtered = clients.filter((c) =>
    Object.values(c).join(" ").toLowerCase().includes(String(focusId).toLowerCase())
  );
  const sorted = sortClients(filtered);

  // essaie de trouver le client EXACT par ID (plus précis que la recherche globale)
  const exactIdx = sorted.findIndex(c => String(c.IDClient) === String(focusId));
  const idx = exactIdx >= 0 ? exactIdx : 0;

  // 3) calcule la page à afficher
  const page = Math.floor(idx / clientsPerPage) + 1;
  setCurrentPage(page);

  // 4) garde l’ID à surligner
  setHighlightId(Number(focusId));
}, [focusId, clients]); // eslint-disable-line react-hooks/exhaustive-deps


  const filteredClients = clients.filter((client) => {
    const matchSearch =
      searchTerm === "" ||
      Object.values(client)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchEmis = minEmis === "" || client.NB_appel_Emis >= parseInt(minEmis);
    const matchRecus = minRecus === "" || client.NB_Appel_Recu >= parseInt(minRecus);
    return matchSearch && matchEmis && matchRecus;
  });

  const sortedClients = sortClients(filteredClients);
  const totalClients = sortedClients.length;
  const totalPages = Math.ceil(totalClients / clientsPerPage);
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const paginatedClients = sortedClients.slice(indexOfFirstClient, indexOfLastClient);


//affectation client
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
    // Option: refetch la liste des clients / appels, ou toast
    // refetch();
    // toast.success("Affectation réussie !");
    console.log("Affectation OK !");
  };

  return (
    <>
      <Header
        name1="Total Clients"
        name2="Total Appels Émis"
        name3=" Total Appels Reçus"
        totalClients={clients.length}
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
                    <ClientSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
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
                    clients={paginatedClients}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    handleSort={handleSort}
                    handleCopy={handleCopy}
                    getBadgeColor={getBadgeColor}
                      highlightId={highlightId}            //parid
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
                  totalClients={totalClients}
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
};export default Clients;
