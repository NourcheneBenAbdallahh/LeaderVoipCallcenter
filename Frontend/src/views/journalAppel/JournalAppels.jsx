import React, { useState } from "react";
import { Container, Row, Col, Card, CardBody, Spinner } from "reactstrap";
import Header from "components/Headers/Header.js";
import AppelsTable from "./AppelsTable.jsx";
import FiltersDrawer from "./FiltersDrawer.jsx";
import FilterChips from "./FilterChips.jsx";
import ClientPagination from "../clients/ClientPaginationComponent";
import AppelsControls from "./AppelsControls.jsx";
import { useJournalAppelsData } from "./hooks/useJournalAppelsData.jsx";

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
      case "À APPELER": return "primary";
      case "TRAITE": return "success";
      case "NE REPOND PAS": return "dark";
      default: return "secondary";
    }
  };

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