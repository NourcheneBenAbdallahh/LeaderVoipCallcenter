// src/views/agents/AgentTableComponent.jsx
import React from "react";
import { Table, Button, Badge } from "reactstrap";
import { FaClipboard } from "react-icons/fa";

const AgentTable = ({ agents, highlightId, rowRef }) => {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert("Copié dans le presse-papier !"))
      .catch(() => alert("Erreur lors de la copie."));
  };

  const getEtatBadge = (etat) => (etat === 1
    ? <Badge color="success">Actif</Badge>
    : <Badge color="danger">Inactif</Badge>
  );

  return (
    <Table className="align-middle table-flush" responsive hover>
      <thead style={{ backgroundColor: "#e0f0ff" }}>
        <tr className="bg-gray-100">
          <th>ID</th>
          <th>Nom</th>
          <th>Prénom</th>
          <th>Login</th>
          <th>Email</th>
          <th>État</th>
          <th>Admin</th>
          <th>Ajout</th>
          <th>Modif</th>
          <th>Suppression</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent) => {
          const isHighlight = String(agent.IDAgent_Emmission) === String(highlightId);
          return (
            <tr
              key={agent.IDAgent_Emmission}
              ref={isHighlight ? rowRef : null}
              style={isHighlight ? { backgroundColor: "#fff8d5" } : undefined}
            >
              <td>{agent.IDAgent_Emmission}</td>
              <td>{agent.Nom || "—"}</td>
              <td>{agent.Prenom || "—"}</td>
              <td>{agent.Login || "—"}</td>
              <td>{agent.Adresse_email || "—"}</td>
              <td>{getEtatBadge(agent.Etat_Compte)}</td>
              <td>{agent.Administrateur ? "✅" : "❌"}</td>
              <td>{agent.Ajout ? "✅" : "❌"}</td>
              <td>{agent.Modification ? "✅" : "❌"}</td>
              <td>{agent.Supression ? "✅" : "❌"}</td>
             
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default AgentTable;
