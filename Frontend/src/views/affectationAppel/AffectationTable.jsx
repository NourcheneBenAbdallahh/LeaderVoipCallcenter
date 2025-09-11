import React , { useState } from "react";
import { Table, Badge, Button,Modal, ModalHeader, ModalBody } from "reactstrap";
import { Link } from "react-router-dom";

const fmtDuree = (s) => {
  const n = Number(s) || 0;
  const m = Math.floor(n / 60);
  const sec = n % 60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
};

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
    .map(s => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "•";

    
const AffectationTable = ({
  data,
  sortBy,
  sortDir,
  onSort,
  dernierAppel,
  selectedRows,
  onSelectRow,
  onSelectAll,
  clientNameById = {},
  agentNameById = {}, onEdit,  
}) => {

  const allSelected = data.length > 0 && data.every(r => selectedRows.includes(r.IDAppel));


    const [modalOpen, setModalOpen] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  const handleCommentClick = (comment) => {
    setCommentContent(comment);
    setModalOpen(true);
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
          <SortHeader label="Agent Émiss." col="IDAgent_Emmission" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          <SortHeader label="Sous Statut" col="Sous_Statut" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {data.map((r) => {
          const isDernier = r.IDAppel === dernierAppel?.IDAppel;
          const isSelected = selectedRows.includes(r.IDAppel);

          return (
            <tr
              key={r.IDAppel}
              style={{
                backgroundColor: isDernier ? "#fff3cd" : isSelected ? "#cce5ff" : "transparent"
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
          <td>
            {r.Numero || "—"}
          </td>

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
    

            <span className="font-weight-bold"> {agentNameById[r.IDAgent_Emmission]}</span>

    </Link>
  ) : (
    "—"
  )}
</td>


              <td>
<Badge color="danger">{r.Sous_Statut || "—"}</Badge>              </td>
              <td>
                <Button color="success" size="sm"
                onClick={() => onEdit && onEdit(r)}  

                >Modifier</Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
        <ModalHeader toggle={() => setModalOpen(false)}>Commentaire</ModalHeader>
        <ModalBody>{commentContent}</ModalBody>
      </Modal>
    </>
  );
};

export default AffectationTable;
