import React from "react";
import { Table, Button, Badge } from "reactstrap";
import { FaClipboard } from "react-icons/fa";

const AgentTable = ({ agents }) => {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert("Copié dans le presse-papier !"))
      .catch(() => alert("Erreur lors de la copie."));
  };

  const getEtatBadge = (etat) => {
    return etat === 1 ? (
      <Badge color="success">Actif</Badge>
    ) : (
      <Badge color="danger">Inactif</Badge>
    );
  };

  return (
    <Table className="align-middle table-flush" responsive hover>
      <thead className="thead-light">
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
          <th>Copier Login</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent) => (
          <tr key={agent.IDAgent_Emmission}>
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
            <td>
              <Button color="link" onClick={() => handleCopy(agent.Login)} title="Copier login">
                <FaClipboard />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default AgentTable;
