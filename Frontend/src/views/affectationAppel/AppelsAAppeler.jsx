// src/views/affectationAppel/AppelsAApeller.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card, CardBody, Spinner } from "reactstrap";
import Header from "components/Headers/Header.js";
import AppelsTable from "../journalAppel/AppelsTable.jsx";
import FilterChips from "../journalAppel/FilterChips.jsx";
import ClientPagination from "../clients/ClientPaginationComponent.jsx";
import { useAppelsAApellerData } from "./hooks/useAppelsAApellerData.jsx";
import AffectationControls from "./AffectationControls.jsx";
import AffectationFiltersDrawer from "./AffectationFiltersDrawer.jsx";

const AppelsAApeller = () => {
  const {
    rows, total, loading,
    page, limit, filters,
    setPage, applyFilters, clearOneFilter, resetAll
  } = useAppelsAApellerData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen((s) => !s);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSelectRow = (id, checked) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const handleSelectAll = (checked) => {
    setSelectedRows(checked ? rows.map(r => r.IDAppel) : []);
  };

  const onSearchChange = (val) => {
    applyFilters((prev) => ({ ...prev, q: val, page: 1 }));
  };

  const getBadgeColor = (statut) => (statut === "À appeler" ? "primary" : "secondary");

  const statuts = [
    { value: "À appeler", label: "À appeler" }
  ];
  const agents = []; // à remplir si nécessaire

  return (
    <>
      <Header title="Appels à appeler" totalClients={total} />

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
                <FilterChips filters={filters} onRemove={clearOneFilter} />

                {loading ? (
                  <div className="text-center my-4">
                    <Spinner color="primary" /> Chargement…
                  </div>
                ) : (
                  <>
                    <AppelsTable
                      data={rows}
                      getBadgeColor={getBadgeColor}
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

export default AppelsAApeller;
