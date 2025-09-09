import React, { useEffect, useState } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, Table, Badge, Spinner
} from "reactstrap";
import api from "api";

const formatPhoneNumber = (num) => {
  const digits = (num || "").replace(/\D/g, "");
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
};

const fmtDuree = (s) => {
  const n = Number(s) || 0;
  const m = Math.floor(n / 60);
  const sec = n % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const typeBadge = (t) => {
  if (t === 1 || t === "1") return <Badge color="info">Émis</Badge>;
  if (t === 2 || t === "2") return <Badge color="success">Reçu</Badge>;
  if (t === 0 || t === "0") return <Badge color="secondary">Indéf.</Badge>;
  return <Badge color="light">{t}</Badge>;
};

const ENDPOINT = "/api/appels/historyByPhone";

export default function CallHistoryByPhoneModal({
  isOpen,
  onClose,
  numero,
  titleSuffix = ""
}) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const normalizedNumero = (numero || "").replace(/\D/g, "").trim();
const [commentOpen, setCommentOpen] = useState(false);
const [selectedComment, setSelectedComment] = useState("");

  const load = async (p = page, l = limit) => {
    if (!normalizedNumero) return;
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.post(ENDPOINT, {
        numero: normalizedNumero,
        page: p,
        limit: l,
        sort: "desc"
      });
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setTotal(Number(data?.total) || 0);
      setPage(Number(data?.page) || p);
      setLimit(Number(data?.limit) || l);
    } catch (e) {
      console.error("CallHistoryByPhoneModal load error:", e);
      setErr("Erreur lors du chargement de l'historique.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      load(1, limit);
    }
  }, [isOpen, normalizedNumero, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
const truncate = (text, max = 100) =>
  text && text.length > max ? text.slice(0, max) + "…" : text;

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl">
      <ModalHeader toggle={onClose}>
        Historique des appels — N° {titleSuffix || formatPhoneNumber(numero)}
      </ModalHeader>
      <ModalBody>
        {loading && (
          <div className="d-flex align-items-center">
            <Spinner size="sm" color="primary" className="mr-2" /> Chargement…
          </div>
        )}
        {!loading && err && <div className="text-danger">{err}</div>}

        {!loading && !err && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <small className="text-muted">
                  Total: {total} • Page {page}/{totalPages}
                </small>
              </div>
              <div className="d-flex align-items-center">
                <small className="mr-2">Par page</small>
                <select
                  className="form-control form-control-sm"
                  style={{ width: 80 }}
                  value={limit}
                  onChange={(e) => {
                    const l = Number(e.target.value) || 10;
                    setLimit(l);
                    setPage(1);
                    load(1, l);
                  }}
                >
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead style={{ backgroundColor: "#e0f0ff" }}>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Type</th>
                    <th>Durée</th>
                    <th>Numéro</th>
                    <th>Sous Statut</th>
                    <th>Agent Émission</th>
                    <th>Agent Réception</th>
                    <th>Client</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center text-muted">
                        Aucun appel.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.IDAppel}>
                        <td>{r.Date ? new Date(r.Date).toLocaleDateString() : "—"}</td>
                        <td>{r.Heure || "—"}</td>
                        <td>{typeBadge(r.Type_Appel)}</td>
                        <td>{fmtDuree(r.Duree_Appel)}</td>
                        <td>{formatPhoneNumber(r.Numero) || "—"}</td>
                        <td><Badge color="danger">{r.Sous_Statut || "—"}</Badge></td>
                        
                        {/* AFFICHAGE DES NOMS DES AGENTS */}
                        <td>
                          {r.Agent_Emmission ? (
                            <span className="text-info">
                              {r.Agent_Emmission.Prenom} {r.Agent_Emmission.Nom}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        
                        <td>
                          {r.Agent_Reception ? (
                            <span className="text-success">
                              {r.Agent_Reception.Prenom} {r.Agent_Reception.Nom}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        
                        {/* AFFICHAGE DU NOM DU CLIENT */}
                        <td>
                          {r.Client ? (
                            <span className="text-primary">
                              {r.Client.Prenom} {r.Client.Nom}
                             
                            </span>
                          ) : r.IDClient ? (
                            <span className="text-muted">Client #{r.IDClient}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        
                   <td>
  <div
    style={{
      maxWidth: 220,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }}
    title={r.Commentaire || ""} // hover = voir tout
  >
    {r.Commentaire || "—"}
  </div>

  {r.Commentaire && r.Commentaire.length > 0 && (
    <Button
      size="sm"
      color="link"
      className="p-0 ml-1"
      onClick={() => {
        setSelectedComment(r.Commentaire);
        setCommentOpen(true);
      }}
    >
      Voir plus
    </Button>
  )}
</td>



                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <Button
                size="sm"
                color="secondary"
                disabled={page <= 1 || loading}
                onClick={() => load(page - 1, limit)}
              >
                ← Précédent
              </Button>
              <span className="text-muted small">
                Page {page} / {totalPages}
              </span>
              <Button
                size="sm"
                color="secondary"
                disabled={page >= totalPages || loading}
                onClick={() => load(page + 1, limit)}
              >
                Suivant →
              </Button>
            </div>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>Fermer</Button>
      </ModalFooter>

      <Modal isOpen={commentOpen} toggle={() => setCommentOpen(false)}>
  <ModalHeader toggle={() => setCommentOpen(false)}>
    Commentaire complet
  </ModalHeader>
  <ModalBody style={{ whiteSpace: "pre-wrap" }}>
    {selectedComment}
  </ModalBody>
  <ModalFooter>
    <Button color="secondary" onClick={() => setCommentOpen(false)}>
      Fermer
    </Button>
  </ModalFooter>
</Modal>

    </Modal>
    
  );
}