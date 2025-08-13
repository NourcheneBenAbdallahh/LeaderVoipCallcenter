import {Input  } from "reactstrap";

const ClientSearchBar = ({ searchTerm, setSearchTerm }) => (
  <Input
    type="text"
    placeholder="🔍 Rechercher..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="max-w-xs float-right text-sm"
  />
);export default ClientSearchBar;