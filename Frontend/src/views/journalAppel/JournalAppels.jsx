import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, Spinner } from "reactstrap";
import Header from "components/Headers/Header.js";
import AppelsTable from "./AppelsTable.jsx";
import FiltersDrawer from "./FiltersDrawer.jsx";
import FilterChips from "./FilterChips.jsx";
import ClientPagination from "../clients/ClientPaginationComponent";
import AppelsControls from "./AppelsControls.jsx";
import { useJournalAppelsData } from "./hooks/useJournalAppelsData.jsx";
import useBadgeColor from "utils/useBadgeColor.js";
import api from "api";

const JournalAppels = () => {
  const {
    rows,
    total,
    loading,
    page,
    limit,
    sortBy,
    sortDir,
    filters,
    setPage,
    applyFilters,
    clearOneFilter,
    resetAll,
    handleSort,
    dernierAppel,
    avgDurationLabel

  } = useJournalAppelsData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen((s) => !s);

  const [selectedRows, setSelectedRows] = useState([]);

  const handleSelectRow = (id, checked) => {
    setSelectedRows((prev) => {
      if (checked) return [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedRows(rows.map((r) => r.IDAppel));
    else setSelectedRows([]);
  };

  const [agents, setAgents] = useState([]);
useEffect(() => {
  let alive = true;
  (async () => {
    try {
      //      const { data } = await api.get("http://localhost:5000/api/agents");
      const { data } = await api.get("/api/agents");


      const raw = Array.isArray(data?.agents)
        ? data.agents
        : (Array.isArray(data) ? data : []);

      const filtered = raw;

      const list = filtered
        .map(a => {
          const id =
            a.IDAgent_Emmission ??
            a.IDAgent_Reception ??
            a.IDAgent ??
            a.id;

          const nom =
            `${a.Prenom ?? ""} ${a.Nom ?? ""}`.trim() ||
            a.Login ||
            `Agent ${id ?? ""}`;

          return { id, nom };
        })
        .filter(a => a.id != null);

      if (alive) setAgents(list);
    } catch (e) {
      console.error("Erreur chargement agents:", e);
      if (alive) setAgents([]);
    }
  })();

  return () => { alive = false; };
}, []);

  const agentNameById = Object.fromEntries((agents || []).map(a => [a.id, a.nom]));

const toKey = (v) => (v == null ? "" : String(v).trim());


  // --- agents Réception ---
const [agentsRecep, setAgentsReception] = useState([]);

useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const { data } = await api.get("/api/agentsReception");

      // Rendre robuste selon le shape renvoyé par l'API
      const raw =
        Array.isArray(data?.agentsReception) ? data.agentsReception :
        Array.isArray(data?.agentsRecep)     ? data.agentsRecep     :
        Array.isArray(data?.agents)          ? data.agents          :
        Array.isArray(data)                  ? data                 : [];

      const list = raw
        .map(a => {
          const id  = a.IDAgent_Reception ?? a.IDAgent ?? a.id ?? a.ID;
          const nom =
            `${a.Prenom ?? ""} ${a.Nom ?? ""}`.trim() ||
            a.Login ||
            (id != null ? `Agent ${id}` : "");
          return { id: toKey(id), nom };
        })
        .filter(a => a.id !== "" && a.nom !== "");

      if (alive) setAgentsReception(list);
    } catch (e) {
      console.error("Erreur chargement agents Réception:", e);
      if (alive) setAgentsReception([]);
    }
  })();
  return () => { alive = false; };
}, []);

  const agentReceptionNameById = Object.fromEntries((agentsRecep || []).map(a => [a.id, a.nom]));

  // clients
  const [clients, setClients] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        //        const res = await api.get("http://localhost:5000/api/clients");

        const res = await api.get("/api/clients");
        const list = (Array.isArray(res.data) ? res.data : [])
          .map(c => ({
            id: c.IDClient ?? c.id,
            nom: `${c.Prenom ?? ""} ${c.Nom ?? ""}`.trim() || c.RaisonSociale || `Client ${c.IDClient ?? c.id ?? ""}`,
          }))
          .filter(c => c.id != null);
        if (alive) setClients(list);
      } catch (e) {
        console.error("Erreur chargement clients:", e);
        if (alive) setClients([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const clientNameById = Object.fromEntries((clients || []).map(c => [c.id, c.nom]));

  const { getBadgeColor } = useBadgeColor();

  return (
<>
      <Header
        title="Journal des appels"
        totalClients={total}
        name1="Total Appels"
        name2="Durée moyenne"    

        totalAppelsEmis={`${avgDurationLabel}`}

      />

      <Container className="mt-[-3rem]" fluid>
        <Row>
          <Col>
            <Card className="shadow">
              <AppelsControls
                onOpenFilters={toggleDrawer}
                onReset={resetAll}
                searchValue={filters.q}
                onSearchChange={(val) => applyFilters({ ...filters, q: val })}
              />
              <CardBody>
                <FilterChips filters={filters} onRemove={clearOneFilter} />

                {loading ? (
                  <div className="text-center my-4">
                    <Spinner color="primary" /> Chargement…
                  </div>
                ) : (
                  <>
                    <AppelsTable
                      data={rows}
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      getBadgeColor={getBadgeColor}
                      dernierAppel={dernierAppel}
                      clientNameById={clientNameById}
                      agentReceptionNameById={agentReceptionNameById}
                      agentNameById={agentNameById}

                      selectedRows={selectedRows}
                      onSelectRow={handleSelectRow}
                      onSelectAll={handleSelectAll}
                    />

                    <ClientPagination
                      currentPage={page}
                      totalClients={total}
                      clientsPerPage={limit}
                      setCurrentPage={setPage}
                    />
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <FiltersDrawer
        isOpen={drawerOpen}
        toggle={toggleDrawer}
        value={filters}
        onApply={applyFilters}
      />
    </>
  );
};

export default JournalAppels;