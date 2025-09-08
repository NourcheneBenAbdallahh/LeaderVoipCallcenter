import React, { useState } from "react";
import { Input, Button, InputGroup, InputGroupAddon } from "reactstrap";

const ClientSearchBar = ({ searchTerm, setSearchTerm, onSearch }) => {
  const [localTerm, setLocalTerm] = useState(searchTerm);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(localTerm);
  };

  const handleClear = () => {
    setLocalTerm("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex align-items-center">
      <InputGroup>
        <Input
          type="text"
          placeholder="🔍 Rechercher parmi tous les clients..."
          value={localTerm}
          onChange={(e) => setLocalTerm(e.target.value)}
          className="text-sm"
        />
        {localTerm && (
          <InputGroupAddon addonType="append">
            <Button color="link" onClick={handleClear} className="text-danger">
              ×
            </Button>
          </InputGroupAddon>
        )}
        <InputGroupAddon addonType="append">
          <Button type="submit" color="primary" className="text-sm">
            Rechercher
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
};

export default ClientSearchBar;