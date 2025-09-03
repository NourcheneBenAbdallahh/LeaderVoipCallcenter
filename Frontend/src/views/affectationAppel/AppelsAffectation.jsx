import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, Spinner } from "reactstrap";
import Header from "components/Headers/Header.js";
import FilterChips from "../journalAppel/FilterChips.jsx";
import ClientPagination from "../clients/ClientPaginationComponent.jsx";

import useAppelsAApellerData from "./hooks/useAppelsAApellerData.jsx";
import AffectationControls from "../affectationAppel/AffectationControls.jsx";
import AffectationFiltersDrawer from "../affectationAppel/AffectationFiltersDrawer.jsx";
import api from "api";
import AffectationTable from "./AffectationTable.jsx";
import EditAppelModal from "../affectationAppel/Editaffectation/EditAppelModal.jsx";

const AppelsAffectation = () => {
  const {
    rows, total, loading,
    page, limit, filters,
    setPage, applyFilters, resetAll,
  } = useAppelsAApellerData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen((s) => !s);

  const [selectedRows, setSelectedRows] = useState([]);
  const handleSelectRow = (id, checked) => {
    setSelectedRows(prev =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id)
    );
  };
  const handleSelectAll = (checked) => {
    setSelectedRows(checked ? (rows ?? []).map(r => r.IDAppel) : []);
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

  // recherche globale
  const onSearchChange = (val) => applyFilters({ q: val, page: 1 });

  // couleurs badge

  const statuts = [{ value: "À APPELER", label: "À APPELER" }];

  const handleRemoveChip = (key) => applyFilters({ [key]: "", page: 1 });

  const agentNameById = Object.fromEntries((agents || []).map(a => [a.id, a.nom]));
  const clientNameById = Object.fromEntries((clients || []).map(c => [c.id, c.nom]));

  // --- Modal Edition ---
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const openEdit = (row) => { setEditingRow(row); setEditOpen(true); };
  const closeEdit = () => { setEditOpen(false); setEditingRow(null); };

  // Vue locale pour patcher après save (si ton hook ne propose pas de setter des rows)
  const [localRows, setLocalRows] = useState(null);
  const effectiveRows = localRows ?? rows;

  const handleSavedRow = (updated) => {
    setLocalRows(prev => {
      const src = prev ?? rows;
      return src.map(r => (r.IDAppel === updated.IDAppel ? { ...r, ...updated } : r));
    });
  };

  return (
    <>
      <Header 
      title="Appels à appeler"
      name1="Total Appels"

       totalClients={total} />

      <Container className="mt-[-3rem]" fluid>
        <Row>
          <Col>
            <Card className="shadow">
              <AffectationControls
                onOpenFilters={toggleDrawer}
                onReset={resetAll}
                searchValue={filters?.q ?? ""}
                onSearchChange={onSearchChange}
              />

              <CardBody>
                <FilterChips filters={filters || {}} onRemove={handleRemoveChip} />

                {loading ? (
                  <div className="text-center my-4">
                    <Spinner color="primary" /> Chargement…
                  </div>
                ) : (
                  <>
                    <AffectationTable
                      data={effectiveRows}
                      sortBy={null}
                      sortDir={null}
                      onSort={() => {}}
                      dernierAppel={null}
                      agentNameById={agentNameById}
                      clientNameById={clientNameById}
                      selectedRows={selectedRows}
                      onSelectRow={handleSelectRow}
                      onSelectAll={handleSelectAll}
                      onEdit={openEdit}
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

      <AffectationFiltersDrawer
        isOpen={drawerOpen}
        toggle={toggleDrawer}
        value={filters || {}}
        onApply={applyFilters}
        agents={agents || []}
        statuts={statuts || []}
      />

      <EditAppelModal
        isOpen={editOpen}
        onClose={closeEdit}
        appel={editingRow}
        onSaved={handleSavedRow}
      />
    </>
  );
};

export default AppelsAffectation;
