import React, { useState } from "react";
import {
  Container, Row, Col, Card, CardBody, Spinner
} from "reactstrap";
import Header from "components/Headers/Header.js";
import AppelsTable from "./AppelsTable.jsx";
import FiltersDrawer from "./FiltersDrawer.jsx";
import FilterChips from "./FilterChips.jsx";
import ClientPagination from "../clients/ClientPaginationComponent";

import AppelsControls from "./AppelsControls.jsx";
import { useJournalAppelsData } from ".//hooks/useJournalAppelsData.jsx";

const JournalAppels = () => {
  const {
    // state
    rows, total, loading,
    page, limit, sortBy, sortDir, filters,

    // actions
    setPage, applyFilters, clearOneFilter, resetAll, handleSort,
  } = useJournalAppelsData();

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen((s) => !s);

  return (
    <>
      <Header title="Journal des appels" totalClients={total} />
      <Container className="mt-[-3rem]" fluid>
        <Row>
          <Col>
            <Card className="shadow">
              <AppelsControls
                onOpenFilters={toggleDrawer}
                onReset={resetAll}
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
