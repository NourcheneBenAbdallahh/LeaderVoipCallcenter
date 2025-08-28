import React from "react";
import { FaClipboard } from "react-icons/fa";
import { Table, Button, Badge } from "reactstrap";


const ClientTable = ({
  clients,
  sortField,
  sortDirection,
  handleSort,
  handleCopy,
  getBadgeColor,
  onAffecter,
  highlightId,          
    selectedClients,
  onSelectClient,
  onSelectAllClients,
}) => (
  <Table className="align-middle table-flush" responsive hover>
    <thead style={{ backgroundColor: "#e0f0ff" }}>
      <tr>
          <th>
  <input
    type="checkbox"
    checked={selectedClients.length === clients.length && clients.length > 0}
    onChange={(e) => onSelectAllClients(e.target.checked)}
  />
</th>

         {[
          "IDClient",
          "Nom",
          "Prenom",
          "Adresse",
          "CodePostal",
          "Ville",
          "Telephone",
          "Email",
          "Sous_Statut",
          "NB_appel_Emis",
          "NB_Appel_Recu",
        ].map((field) => (
          <th
            key={field}
            onClick={() => handleSort(field)}
            className="cursor-pointer px-4 py-2"
          >
            {field.replace(/_/g, " ")}{" "}
            {sortField === field && (sortDirection === "asc" ? "▲" : "▼")}
          </th>
        ))}
        <th className="px-4 py-2">Actions</th>
      </tr>
    </thead>

    <tbody>
  {clients.map((client) => {
    const isHighlight = String(client.IDClient) === String(highlightId);
    const isChecked = selectedClients.includes(client.IDClient); 

    return (
      <tr
        key={client.IDClient ?? "—"}
        id={`client-${client.IDClient}`}           
        className={`hover:bg-gray-50 ${isHighlight ? "row-highlight" : ""}`} 
        style={isHighlight ? { background: "rgba(66,153,225,0.12)" } : undefined}
      >
        <td>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onSelectClient(client.IDClient, e.target.checked)}
          />
        </td>
        <td className="px-4 py-2">{client.IDClient || "—"}</td>
        <td className="px-4 py-2">{client.Nom || "—"}</td>
        <td className="px-4 py-2">{client.Prenom || "—"}</td>
        <td className="px-4 py-2">{client.Adresse || "—"}</td>
        <td className="px-4 py-2">{client.CodePostal || "—"}</td>
        <td className="px-4 py-2">{client.Ville || "—"}</td>
        <td className="px-4 py-2">
          {client.Telephone || "—"}{" "}
     
        </td>
        <td className="px-4 py-2">{client.Email || "—"}</td>
        <td className="px-4 py-2">
          <Badge color={getBadgeColor(client.Sous_Statut)}>
            {client.Sous_Statut}
          </Badge>
        </td>
        <td className="px-4 py-2">{client.NB_appel_Emis}</td>
        <td className="px-4 py-2">{client.NB_Appel_Recu}</td>

        <td className="px-4 py-2">
          <Button color="success" size="sm" onClick={() => onAffecter(client)}>
            Affecter
          </Button>
        </td>
      </tr>
    );
  })}
</tbody>

  </Table>
);

export default ClientTable;


/*copier 
     <Button
            color="link"
            onClick={() => handleCopy(client.Telephone)}
            className="ml-2 text-lg"
            title="Copier le numéro"
          >
            <FaClipboard />
          </Button>*/ 