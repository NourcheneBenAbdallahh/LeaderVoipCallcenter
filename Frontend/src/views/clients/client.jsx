import React, { useState, useEffect, useMemo, useRef } from "react";
import api from "api";
import ClientTable from "./ClientTableComponent";
import { Container, Row, Col, Card, CardHeader, CardBody, Spinner, Button } from "reactstrap";
import ClientSearchBar from "./ClientSearchBarComponent";
import ClientFilters from "./ClientFiltersComponent";
import ClientPagination from "./ClientPaginationComponent";
import { useLocation, useNavigate } from "react-router-dom";
import useBadgeColor from "utils/useBadgeColor";
import HeaderTroisCards from "components/Headers/HeaderTroisCards";

const API_BASE = "/api";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recherche globale
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  // Filtres min/max
  const [minEmis, setMinEmis] = useState("");
  const [maxEmis, setMaxEmis] = useState("");
  const [minRecus, setMinRecus] = useState("");
  const [maxRecus, setMaxRecus] = useState("");

  // Tri local
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination serveur
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);

  // KPIs (page courante)
  const totalAppelsEmis = clients.reduce((s, c) => s + (Number(c.NB_appel_Emis) || 0), 0);
  const totalAppelsRecus = clients.reduce((s, c) => s + (Number(c.NB_Appel_Recu) || 0), 0);

  // Focus via URL
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const focusId = searchParams.get("focus");
  const [highlightId, setHighlightId] = useState(null);
  const [fromFocus, setFromFocus] = useState(false);
  const rowRef = useRef(null);

  // Sélection multi
  const [selectedClients, setSelectedClients] = useState([]);

  const { getBadgeColor } = useBadgeColor();

  /* ---------- Tri local ---------- */
  const handleSort = (field) => {
    if (sortField === field) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDirection("asc"); }
  };

  const sortClients = (data) => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      if (typeof av === "number" && typeof bv === "number") {
        return sortDirection === "asc" ? av - bv : bv - av;
      }
      return sortDirection === "asc"
        ? av.toString().localeCompare(bv.toString())
        : bv.toString().localeCompare(av.toString());
    });
  };

  /* ---------- Fetch ---------- */
  const loadClients = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: clientsPerPage,
        appelsEmisMin: minEmis || undefined,
        appelsEmisMax: maxEmis || undefined,
        appelsRecusMin: minRecus || undefined,
        appelsRecusMax: maxRecus || undefined,
      };
      if (globalSearchTerm) params.q = globalSearchTerm;

      const res = await api.get(`${API_BASE}/clientsopti`, { params });
      const { clients: data, total } = res.data || {};
      if (Array.isArray(data) && data.length) {
        console.log("clientsopti sample row:", data[0]);
      }
      setClients(Array.isArray(data) ? data : []);
      setTotalCount(Number(total) || 0);
    } catch (e) {
      console.error("Erreur lors de la récupération des clients :", e);
      setClients([]); setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
    setSelectedClients([]);
  }, [currentPage, minEmis, maxEmis, minRecus, maxRecus, clientsPerPage, globalSearchTerm]);

  // Appliquer filtres -> reset page
  const fetchFilteredClients = (minE, maxE, minR, maxR) => {
    setMinEmis(minE);
    setMaxEmis(maxE);
    setMinRecus(minR);
    setMaxRecus(maxR);
    setCurrentPage(1);
  };

  // Recherche globale -> reset page
  const handleGlobalSearch = (term) => {
    setGlobalSearchTerm(term);
    setCurrentPage(1);
  };

  // Arrivée avec ?focus=ID → injecte dans la recherche pour être sûr de l'avoir
  useEffect(() => {
    if (focusId) {
      setFromFocus(true);
      setGlobalSearchTerm(String(focusId));
      setCurrentPage(1);
    }
  }, [focusId]);

  // Quand les données arrivent, surligne si présent
  useEffect(() => {
    if (!focusId) return;
    const onPage = clients.some((c) => String(c.IDClient) === String(focusId));
    setHighlightId(onPage ? String(focusId) : null);
  }, [focusId, clients]);

  // Scroll vers la ligne surlignée
  useEffect(() => {
    if (highlightId && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, clients]);

  /* ---------- Sélection ---------- */
  const handleSelectClient = (id, checked) => {
    setSelectedClients((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const handleSelectAllClients = (checked, source) => {
    if (checked) setSelectedClients(source.map((c) => c.IDClient));
    else setSelectedClients([]);
  };

  const sorted = sortClients(clients);


  /* ---------- Réinitialiser tout + retirer ?focus ---------- */
  const clearAll = () => {
    setMinEmis(""); setMaxEmis(""); setMinRecus(""); setMaxRecus("");
    setSortField(""); setSortDirection("asc");
    setGlobalSearchTerm("");
    setCurrentPage(1);
    setHighlightId(null);
    setSelectedClients([]);

    if (fromFocus) {
      // supprime le query param focus
      navigate("/admin/clients", { replace: true });
      setFromFocus(false);
    }
  };

  return (
    <>
   <HeaderTroisCards
  title="Journal des clients"
  name1="Total Clients"
  value1={totalCount}
  name2="Tot Appels Émis (page)"
  value2={totalAppelsEmis}
  name3="Tot Appels Reçus (page)"
  value3={totalAppelsRecus}
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
                {fromFocus && (
                  <div className="d-flex justify-content-end mb-2">
                    <Button size="sm" color="secondary" onClick={clearAll}>
                      Initialiser
                    </Button>
                  </div>
                )}

                <ClientFilters
                  minEmis={minEmis} setMinEmis={setMinEmis}
                  maxEmis={maxEmis} setMaxEmis={setMaxEmis}
                  minRecus={minRecus} setMinRecus={setMinRecus}
                  maxRecus={maxRecus} setMaxRecus={setMaxRecus}
                  fetchFilteredClients={fetchFilteredClients}
                  onReset={clearAll}
                />

                {loading ? (
                  <div className="text-center">
                    <Spinner color="primary" /> Chargement...
                  </div>
                ) : (
                  <ClientTable
                    clients={sorted}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    handleSort={handleSort}
                    handleCopy={() => {}}
                    getBadgeColor={getBadgeColor}
                    highlightId={highlightId}
                    rowRef={rowRef}
                    selectedClients={selectedClients}
                    onSelectClient={handleSelectClient}
                    onSelectAllClients={(checked) => handleSelectAllClients(checked, sorted)}
                  />
                )}

      

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
