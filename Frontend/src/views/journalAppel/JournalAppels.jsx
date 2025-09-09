import React, { useEffect, useMemo, useRef, useState } from "react";
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

const TTL = 5 * 60 * 1000; // 5 min
const CK_AGENTS      = "journal:agents:v1";
const CK_AGENTS_REC  = "journal:agentsReception:v1";
const CK_CLIENTS     = "journal:clients:v1";

function readList(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, list } = JSON.parse(raw);
    if (!ts || !list) return null;
    if (Date.now() - ts > TTL) return null;
    return list;
  } catch { return null; }
}
function writeList(key, list) {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), list })); } catch {}
}
const toKey = (v) => (v == null ? "" : String(v).trim());

const JournalAppels = () => {
  const {
    rows, total, loading, page, limit, sortBy, sortDir, filters,
    setPage, applyFilters, clearOneFilter, resetAll, handleSort,
    avgDurationLabel
  } = useJournalAppelsData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen((s) => !s);

  const [selectedRows, setSelectedRows] = useState([]);
  const handleSelectRow = (id, checked) => {
    setSelectedRows((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };
  const handleSelectAll = (checked) => {
    if (checked) setSelectedRows(rows.map((r) => r.IDAppel));
    else setSelectedRows([]);
  };

  /* =============== AGENTS (émission) =============== */
  const [agents, setAgents] = useState([]);
  useEffect(() => {
    let alive = true;
    const cached = readList(CK_AGENTS);
    if (cached && alive) setAgents(cached);

    (async () => {
      try {
        const { data } = await api.get("/api/agents");
        const raw = Array.isArray(data?.agents) ? data.agents : (Array.isArray(data) ? data : []);
        const list = raw
          .map(a => {
            const id =
              a.IDAgent_Emmission ?? a.IDAgent_Reception ?? a.IDAgent ?? a.id ?? a.ID;
            const nom =
              `${a.Prenom ?? ""} ${a.Nom ?? ""}`.trim() ||
              a.Login ||
              (id != null ? `Agent ${id}` : "");
            return { id: toKey(id), nom };
          })
          .filter(a => a.id !== "" && a.nom !== "");
        if (alive) { setAgents(list); writeList(CK_AGENTS, list); }
      } catch (e) {
        console.error("Erreur chargement agents:", e);
        if (alive && !cached) setAgents([]);
      }
    })();

    return () => { alive = false; };
  }, []);

  const agentNameById = Object.fromEntries((agents || []).map(a => [a.id, a.nom]));

  /* ============ AGENTS Réception ============ */
  const [agentsRecep, setAgentsReception] = useState([]);
  useEffect(() => {
    let alive = true;
    const cached = readList(CK_AGENTS_REC);
    if (cached && alive) setAgentsReception(cached);

    (async () => {
      try {
        const { data } = await api.get("/api/agentsReception");
        const raw =
          Array.isArray(data?.agentsReception) ? data.agentsReception :
          Array.isArray(data?.agentsRecep)     ? data.agentsRecep     :
          Array.isArray(data?.agents)          ? data.agents          :
          Array.isArray(data)                  ? data                 : [];
        const list = raw
          .map(a => {
            const id  = a.IDAgent_Reception ?? a.IDAgent ?? a.id ?? a.ID;
            const nom = `${a.Prenom ?? ""} ${a.Nom ?? ""}`.trim() || a.Login || (id != null ? `Agent ${id}` : "");
            return { id: toKey(id), nom };
          })
          .filter(a => a.id !== "" && a.nom !== "");
        if (alive) { setAgentsReception(list); writeList(CK_AGENTS_REC, list); }
      } catch (e) {
        console.error("Erreur chargement agents Réception:", e);
        if (alive && !cached) setAgentsReception([]);
      }
    })();

    return () => { alive = false; };
  }, []);

  const agentReceptionNameById = Object.fromEntries((agentsRecep || []).map(a => [a.id, a.nom]));

  /* ==================== CLIENTS ==================== */
  const [clients, setClients] = useState([]);
  useEffect(() => {
    let alive = true;
    const cached = readList(CK_CLIENTS);
    if (cached && alive) setClients(cached);

    (async () => {
      try {
        const res = await api.get("/api/clients");
        const list = (Array.isArray(res.data) ? res.data : [])
          .map(c => ({
            id: c.IDClient ?? c.id ?? c.ID,
            nom: `${c.Prenom ?? ""} ${c.Nom ?? ""}`.trim() || c.RaisonSociale || `Client ${c.IDClient ?? c.id ?? ""}`,
          }))
          .filter(c => c.id != null);
        if (alive) { setClients(list); writeList(CK_CLIENTS, list); }
      } catch (e) {
        console.error("Erreur chargement clients:", e);
        if (alive && !cached) setClients([]);
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
