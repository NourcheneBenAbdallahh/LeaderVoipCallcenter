import React from "react";
import { Table, Button, Badge } from "reactstrap";


const fmtSecToHMS = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}h ${m}min ${s}s`;
};


const ClientTable = ({
  clients,
  sortField,
  sortDirection,
  handleSort,
  handleCopy,
  getBadgeColor,
  highlightId,
  rowRef,             
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
          "Nom",
          "Prenom",
          "Adresse",
          "CodePostal",
          "Ville",
          "Telephone","Mobile",
          "Email",
          "Sous_Statut",
          "NB_appel_Emis",
          "NB_Appel_Recu",          
          "Cumul_temps",

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
            ref={isHighlight ? rowRef : null} 
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
            <td className="px-4 py-2">{client.Nom || "—"}</td>
            <td className="px-4 py-2">{client.Prenom || "—"}</td>
            <td className="px-4 py-2">{client.Adresse || "—"}</td>
            <td className="px-4 py-2">{client.CodePostal || "—"}</td>
            <td className="px-4 py-2">
              {client.Ville || "—"}
            </td>
            <td className="px-4 py-2">
              {client.Telephone || "—"}
            </td>   <td className="px-4 py-2">
              {client.Mobile || "—"}
            </td>
            <td className="px-4 py-2">{client.Email || "—"}</td>
            <td className="px-4 py-2">
              <Badge color={getBadgeColor(client.Sous_Statut)}>
                {client.Sous_Statut || "—"}
              </Badge>
            </td>
            <td className="px-4 py-2">{client.NB_appel_Emis}</td>
            <td className="px-4 py-2">{client.NB_Appel_Recu}</td>
<td className="px-4 py-2">
  {client.Cumul_temps != null ? fmtSecToHMS(client.Cumul_temps) : "—"}
</td>

        
          </tr>
        );
      })}
    </tbody>
  </Table>
);

export default ClientTable;
