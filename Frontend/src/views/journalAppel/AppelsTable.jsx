import React, { useState } from "react";
import { Table, Badge, Modal, ModalHeader, ModalBody, Button } from "reactstrap";
import { Link } from "react-router-dom";
import CallHistoryByClientModal from "../dernierAppelParClient/CallHistoryByClientModal"; // <-- ajuste le chemin si besoin

/* ---------- utils ---------- */
const fmtDuree = (secs) => {
  const n = Number(secs) || 0;
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  return `${h}h ${m}min ${s}s`;
};

const onlyDigits = (v) => (v || "").replace(/\D/g, "").trim();

const SortHeader = ({ label, col, sortBy, sortDir, onSort }) => {
  const active = sortBy === col;
  const arrow = active ? (sortDir === "ASC" ? "▲" : "▼") : "";
  return (
    <th role="button" onClick={() => onSort(col)} title={`Trier par ${label}`}>
      {label} {arrow}
    </th>
  );
};

const typeBadge = (t) => {
  if (t === 1 || t === "1") return <Badge color="info">1</Badge>;
  if (t === 2 || t === "2") return <Badge color="success">2</Badge>;
  if (t === 0 || t === "0") return <Badge color="secondary">0</Badge>;
  return <Badge color="light">{t}</Badge>;
};

const getInitials = (full) =>
  (full ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "•";

// découpe "Prénom Nom"
const splitNomComplet = (full) => {
  const parts = String(full || "").trim().split(/\s+/);
  const nom = parts.length ? parts[parts.length - 1] : "";
  const prenom = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  return { Nom: nom, Prenom: prenom };
};

const AppelsTable = ({
  data,
  sortBy,
  sortDir,
  onSort,
  getBadgeColor,
  dernierAppel,
  selectedRows,
  onSelectRow,
  onSelectAll,
  clientNameById = {},
  agentReceptionNameById = {},
  agentNameById = {},
  onAffecter, // <<==== reçu du parent
}) => {
  const allSelected = data.length > 0 && data.every((r) => selectedRows.includes(r.IDAppel));

  const [modalOpen, setModalOpen] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  // --- ÉTAT pour l’historique (même logique que ClientPhoneSearch.jsx) ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [fallbackPhone, setFallbackPhone] = useState("");

  const handleCommentClick = (comment) => {
    setCommentContent(comment);
    setModalOpen(true);
  };

  const handleAffecterClick = (row) => {
    if (!onAffecter || !row?.IDClient) return;
    const fullName = clientNameById?.[row.IDClient] || "";
    const { Nom, Prenom } = splitNomComplet(fullName);
    onAffecter([{ IDClient: row.IDClient, Nom, Prenom }]);
  };

  // --- Ouvre l’historique client (copie/adaptation de ClientPhoneSearch.jsx) ---
  const openHistoryClient = (client, appel) => {
    if (!client?.IDClient) {
      console.error("IDClient manquant:", client);
      return;
    }
    const raw = (appel && appel.Numero) || client?.Mobile || client?.Telephone || "";
    const fb = onlyDigits(raw);
    setSelectedClient({ ...client, __fallbackPhone: fb });
    setFallbackPhone(fb);
    setIsHistoryOpen(true);
  };

  return (
    <>
      <Table className="align-middle table-flush" responsive hover>
        <thead style={{ backgroundColor: "#e0f0ff" }}>
          <tr className="bg-gray-100">
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <SortHeader label="Date" col="Date" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Heure" col="Heure" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Type" col="Type_Appel" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Durée" col="Duree_Appel" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th>Commentaire</th>
            <SortHeader label="Numéro" col="Numero" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Client" col="IDClient" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Agent Récep." col="IDAgent_Reception" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Agent Émiss." col="IDAgent_Emmission" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Sous Statut" col="Sous_Statut" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="px-4 py-2">Actions</th>
            <th className="px-4 py-2">Historique</th>
          </tr>
        </thead>

        <tbody>
          {data.map((r) => {
            const isDernier = r.IDAppel === dernierAppel?.IDAppel;
            const isSelected = selectedRows.includes(r.IDAppel);
            const canAffect = !!r.IDClient && !!clientNameById?.[r.IDClient];

            // Construit l’objet client minimal pour le modal
            const clientFullName = r.IDClient ? clientNameById[r.IDClient] : "";
            const { Nom, Prenom } = splitNomComplet(clientFullName);
            const clientMin = r.IDClient
              ? { IDClient: r.IDClient, Nom, Prenom }
              : null;

            // Construit l’objet appel minimal (le modal a besoin surtout de Numero)
            const appelMin = { Numero: r.Numero || "" };

            return (
              <tr
                key={r.IDAppel}
                style={{
                  backgroundColor: isDernier ? "#fff3cd" : isSelected ? "#cce5ff" : "transparent",
                }}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectRow(r.IDAppel, e.target.checked)}
                  />
                </td>

                <td>{r.Date ? new Date(r.Date).toLocaleDateString() : "—"}</td>
                <td>{r.Heure || "—"}</td>
                <td>{typeBadge(r.Type_Appel)}</td>
                <td>{fmtDuree(r.Duree_Appel)}</td>

                <td style={{ maxWidth: 320 }} title={r.Commentaire || ""}>
                  <div
                    className="text-truncate"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleCommentClick(r.Commentaire || "—")}
                  >
                    {r.Commentaire || "—"}
                  </div>
                </td>

                <td>{r.Numero || "—"}</td>

                <td>
                  {r.IDClient && clientNameById?.[r.IDClient] ? (
                    <Link
                      to={`/admin/clients?focus=${r.IDClient}`}
                      className="d-flex align-items-center text-primary"
                      title={clientNameById[r.IDClient]}
                    >
                      <span
                        className="rounded-circle border bg-light d-inline-flex align-items-center justify-content-center mr-2"
                        style={{ width: 22, height: 22, fontSize: 12 }}
                      >
                        {getInitials(clientNameById[r.IDClient])}
                      </span>
                      <span className="font-weight-bold">{clientNameById[r.IDClient]}</span>
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>

                <td>
                  {r.IDAgent_Reception && agentReceptionNameById?.[r.IDAgent_Reception] ? (
                    <Link
                      to={`/admin/agentsReception?focus=${r.IDAgent_Reception}`}
                      className="d-flex align-items-center text-primary"
                      title={agentReceptionNameById[r.IDAgent_Reception]}
                    >
                      <span
                        className="rounded-circle border bg-light d-inline-flex align-items-center justify-content-center mr-2"
                        style={{ width: 22, height: 22, fontSize: 12 }}
                      >
                        {getInitials(agentReceptionNameById[r.IDAgent_Reception])}
                      </span>
                      <span className="font-weight-bold">
                        {agentReceptionNameById[r.IDAgent_Reception]}
                      </span>
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>

                <td>
                  {r.IDAgent_Emmission && agentNameById?.[r.IDAgent_Emmission] ? (
                    <Link
                      to={`/admin/agents?focus=${r.IDAgent_Emmission}`}
                      className="d-flex align-items-center text-primary"
                      title={agentNameById[r.IDAgent_Emmission]}
                    >
                      <span
                        className="rounded-circle border bg-light d-inline-flex align-items-center justify-content-center mr-2"
                        style={{ width: 22, height: 22, fontSize: 12 }}
                      >
                        {getInitials(agentNameById[r.IDAgent_Emmission])}
                      </span>
                      <span className="font-weight-bold">{agentNameById[r.IDAgent_Emmission]}</span>
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>

                <td>
                  <Badge color={getBadgeColor(r.Sous_Statut)}>{r.Sous_Statut || "—"}</Badge>
                </td>

                <td className="px-4 py-2">
                  <Button
                    color="success"
                    size="sm"
                    onClick={() => handleAffecterClick(r)}
                    disabled={!canAffect}
                    title={canAffect ? "Affecter ce client" : "Client inconnu"}
                  >
                    Affecter
                  </Button>
                </td>

                <td className="px-4 py-2">
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => clientMin && openHistoryClient(clientMin, appelMin)}
                    disabled={!clientMin}
                    title={clientMin ? "Voir historique (client)" : "Client inconnu"}
                  >
                    Voir historique (client)
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <div className="d-flex justify-content-end mb-2">
        <Button
          color="primary"
          size="sm"
          disabled={selectedRows.length === 0}
          onClick={() => {
            const selectedClients = data
              .filter((r) => selectedRows.includes(r.IDAppel) && r.IDClient && clientNameById?.[r.IDClient])
              .map((r) => {
                const fullName = clientNameById[r.IDClient];
                const { Nom, Prenom } = splitNomComplet(fullName);
                return { IDClient: r.IDClient, Nom, Prenom };
              });

            if (onAffecter) {
              onAffecter(selectedClients);
            }
          }}
        >
          Affecter la sélection ({selectedRows.length})
        </Button>
      </div>

      {/* Modal commentaire */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
        <ModalHeader toggle={() => setModalOpen(false)}>Commentaire</ModalHeader>
        <ModalBody>{commentContent}</ModalBody>
      </Modal>

      {/* Modal historique client */}
      {isHistoryOpen && selectedClient && (
        <CallHistoryByClientModal
          isOpen={isHistoryOpen}
          onClose={() => {
            setIsHistoryOpen(false);
            setSelectedClient(null);
          }}
          clientId={selectedClient.IDClient}
          titleSuffix={`${selectedClient.Prenom || ""} ${selectedClient.Nom || ""}`.trim()}
          fallbackPhone={selectedClient.__fallbackPhone || fallbackPhone}
        />
      )}
    </>
  );
};

export default AppelsTable;
