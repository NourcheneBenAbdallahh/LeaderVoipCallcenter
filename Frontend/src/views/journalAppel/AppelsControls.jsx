import React from "react";
import { CardHeader, Button } from "reactstrap";

const AppelsControls = ({ onOpenFilters, onReset }) => {
  return (
    <CardHeader className="d-flex align-items-center justify-content-between">
      <h3 className="mb-0">Journal des appels</h3>
      <div className="d-flex gap-2">
        <Button color="primary" onClick={onOpenFilters}>Filtres</Button>
        <Button color="secondary" outline onClick={onReset}>Réinitialiser</Button>
      </div>
    </CardHeader>
  );
};

export default AppelsControls;
