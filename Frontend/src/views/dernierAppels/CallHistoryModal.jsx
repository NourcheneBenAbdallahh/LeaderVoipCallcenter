import React, { useEffect, useState } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, Table, Badge, Spinner
} from "reactstrap";
import api from "api";
import { Link } from "react-router-dom";
const getInitials = (full) =>
  (full ?? "")
    .trim()
    .split(/\s+/)
    .map(s => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "•";


// Formatte le numéro pour affichage (ex: 0893022000 -> 08-93-02-20-00)
const formatPhoneNumber = (num) => {
  const digits = (num || "").replace(/\D/g, "");
  if (digits.length !== 10) return digits; // Retourne brut si longueur incorrecte
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
  numero, // numéro "digits-only" à requêter
  titleSuffix = "" // optionnel, ex: "08-93-02-20-00"
}) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const normalizedNumero = (numero || "").replace(/\D/g, "").trim();

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



  
  const [agents, setAgents] = useState([]);
useEffect(() => {
  let alive = true;
  (async () => {
    try {
      //      const { data } = await api.get("http://localhost:5000/api/agents");
      const { data } = await api.get("/api/agents");


      const raw = Array.isArray(data?.agents)
        ? data.agents
        : (Array.isArray(data) ? data : []);

      const filtered = raw;

      const list = filtered
        .map(a => {
          const id =
            a.IDAgent_Emmission ??
            a.IDAgent_Reception ??
            a.IDAgent ??
            a.id;

          const nom =
            `${a.Prenom ?? ""} ${a.Nom ?? ""}`.trim() ||
            a.Login ||
            `Agent ${id ?? ""}`;

          return { id, nom };
        })
        .filter(a => a.id != null);

      if (alive) setAgents(list);
    } catch (e) {
      console.error("Erreur chargement agents:", e);
      if (alive) setAgents([]);
    }
  })();

  return () => { alive = false; };
}, []);

  const agentNameById = Object.fromEntries((agents || []).map(a => [a.id, a.nom]));

const toKey = (v) => (v == null ? "" : String(v).trim());

  // --- agents Réception ---
const [agentsRecep, setAgentsReception] = useState([]);

useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const { data } = await api.get("/api/agentsReception");

      // Rendre robuste selon le shape renvoyé par l'API
      const raw =
        Array.isArray(data?.agentsReception) ? data.agentsReception :
        Array.isArray(data?.agentsRecep)     ? data.agentsRecep     :
        Array.isArray(data?.agents)          ? data.agents          :
        Array.isArray(data)                  ? data                 : [];

      const list = raw
        .map(a => {
          const id  = a.IDAgent_Reception ?? a.IDAgent ?? a.id ?? a.ID;
          const nom =
            `${a.Prenom ?? ""} ${a.Nom ?? ""}`.trim() ||
            a.Login ||
            (id != null ? `Agent ${id}` : "");
          return { id: toKey(id), nom };
        })
        .filter(a => a.id !== "" && a.nom !== "");

      if (alive) setAgentsReception(list);
    } catch (e) {
      console.error("Erreur chargement agents Réception:", e);
      if (alive) setAgentsReception([]);
    }
  })();
  return () => { alive = false; };
}, []);

  const agentReceptionNameById = Object.fromEntries((agentsRecep || []).map(a => [a.id, a.nom]));

  // clients
  const [clients, setClients] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        //        const res = await api.get("http://localhost:5000/api/clients");

        const res = await api.get("/api/clients");
        const list = (Array.isArray(res.data) ? res.data : [])
          .map(c => ({
            id: c.IDClient ?? c.id,
            nom: `${c.Prenom ?? ""} ${c.Nom ?? ""}`.trim() || c.RaisonSociale || `Client ${c.IDClient ?? c.id ?? ""}`,
          }))
          .filter(c => c.id != null);
        if (alive) setClients(list);
      } catch (e) {
        console.error("Erreur chargement clients:", e);
        if (alive) setClients([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const clientNameById = Object.fromEntries((clients || []).map(c => [c.id, c.nom]));

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg">
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

            <Table responsive hover className="align-middle">
              <thead style={{ backgroundColor: "#e0f0ff" }}>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Type</th>
                  <th>Durée</th>
                  <th>Numéro</th>
                  <th>Sous Statut</th>
                  <th>Agent Récep.</th>
                  <th>Agent Émiss.</th>
                  <th>Client</th>                 
                   <th>Commentaire</th>

                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted">
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
      <span className="font-weight-bold">{agentReceptionNameById[r.IDAgent_Reception]}</span>
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
      <small className="text-muted d-inline-block text-truncate" style={{ maxWidth: 180 }}>
        {agentNameById[r.IDAgent_Emmission]}
      </small>
    </Link>
  ) : (
    "—"
  )}
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
                      <td>{r.Commentaire || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between align-items-center">
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
    </Modal>
  );
}