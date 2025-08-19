import React, { useState } from "react";
import { Container, Row, Col, Card, CardBody, Spinner } from "reactstrap";
import Header from "components/Headers/Header.js";
import AppelsTable from "../journalAppel/AppelsTable.jsx";
import FilterChips from "../journalAppel/FilterChips.jsx";
import ClientPagination from "../clients/ClientPaginationComponent.jsx";
import { useAppelsAffectationData } from "./hooks/useAppelsAffectationData.jsx";
import AffectationControls from "../affectationAppel/AffectationControls.jsx";
import AffectationFiltersDrawer from "../affectationAppel/AffectationFiltersDrawer.jsx";

const AppelsAffectation = () => {
  const {
    rows, total, loading,
    page, limit, sortBy, sortDir, filters,
    setPage, applyFilters, clearOneFilter, resetAll, handleSort, dernierAppel
  } = useAppelsAffectationData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen((s) => !s);
  const [selectedRows, setSelectedRows] = useState([]);


  // Sélection d’une ligne
const handleSelectRow = (id, checked) => {
  setSelectedRows(prev =>
    checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id)
  );
};

// Sélection/Désélection de toutes les lignes visibles
const handleSelectAll = (checked) => {
  setSelectedRows(
    checked ? (rows ?? []).map(r => r.IDAppel) : []
  );
};

  // statuts/agents pour le drawer (adapte à tes vraies données)
  const statuts = [
    { value: "", label: "(Tous)" },
    { value: "À appeler", label: "À appeler" },
    { value: "Rappel", label: "Rappel" },
    { value: "Réception", label: "Réception" },
    { value: "Réclamation", label: "Réclamation" },
  ];
  const agents = []; // ex: [{id: 5, nom: "Imen OKBI"}, ...]

  const onSearchChange = (val) => {
    applyFilters((prev) => ({ ...prev, q: val, page: 1 }));
  };

  const onToggleAAppelerOnly = (checked) => {
    applyFilters((prev) => ({
      ...prev,
      aAppelerOnly: !!checked,
      statut: checked ? "À appeler" : prev.statut, // option: force statut
      page: 1
    }));
  };

  const getBadgeColor = (statut) => (statut === "À appeler" ? "primary" : "secondary");

  return (
    <>
      <Header title="Appels à affecter" totalClients={total} />

      <Container className="mt-[-3rem]" fluid>
        <Row>
          <Col>
            <Card className="shadow">
              <AffectationControls
                onOpenFilters={toggleDrawer}
                onReset={resetAll}
                searchValue={filters?.q ?? ""}
                onSearchChange={onSearchChange}
                aAppelerOnly={!!filters?.aAppelerOnly}
                onToggleAAppelerOnly={onToggleAAppelerOnly}
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

      <AffectationFiltersDrawer
        isOpen={drawerOpen}
        toggle={toggleDrawer}
        value={filters}
        onApply={applyFilters}
        agents={agents}
        statuts={statuts}
      />
    </>
  );
};
export default AppelsAffectation;
