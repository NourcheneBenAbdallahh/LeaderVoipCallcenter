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
}) => (
  <Table className="align-middle table-flush" responsive>
<thead style={{ backgroundColor: "#e0f0ff" }}>
      <tr>
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
      {clients.map((client) => (
        <tr key={client.IDClient || "—"} className="hover:bg-gray-50">
          <td className="px-4 py-2">{client.IDClient || "—"}</td>
          <td className="px-4 py-2">{client.Nom || "—"}</td>
          <td className="px-4 py-2">{client.Prenom || "—"}</td>
          <td className="px-4 py-2">{client.Adresse || "—"}</td>
          <td className="px-4 py-2">{client.CodePostal || "—"}</td>
          <td className="px-4 py-2">{client.Ville || "—"}</td>
          <td className="px-4 py-2">
            {client.Telephone || "—"}{" "}
            <Button
              color="link"
              onClick={() => handleCopy(client.Telephone)}
              className="ml-2 text-lg"
              title="Copier le numéro"
            >
              <FaClipboard />
            </Button>
          </td>
          <td className="px-4 py-2">{client.Email || "—"}</td>
          <td className="px-4 py-2">
            <Badge color={getBadgeColor(client.Sous_Statut)}>
              {client.Sous_Statut}
            </Badge>
          </td>
          <td className="px-4 py-2">{client.NB_appel_Emis}</td>
          <td className="px-4 py-2">{client.NB_Appel_Recu}</td>

          {/* ✅ Nouvelle colonne : Bouton Affecter */}
          <td className="px-4 py-2">
            <Button
              color="success"
              size="sm"
              onClick={() => onAffecter(client)}
            >
              Affecter
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
);

export default ClientTable;
