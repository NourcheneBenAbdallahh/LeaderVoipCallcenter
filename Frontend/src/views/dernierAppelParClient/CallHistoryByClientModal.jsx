import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, Table, Badge, Spinner, Collapse,
  Row, Col, Input, Label, FormGroup
} from "reactstrap";
import api from "api";
import useBadgeColor from "utils/useBadgeColor";

/* ---------- utils ---------- */
const onlyDigits = (v) => (v || "").replace(/\D/g, "").trim();

const formatPhoneNumber = (num) => {
  const digits = onlyDigits(num);
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
};

const fmtDuree = (secs) => {
  const n = Number(secs) || 0;
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  return `${h}h ${m}min ${s}s`;
};

/* ---------- constantes ---------- */
const EP_BY_CLIENT = "/api/appels/historyByClient";
const EP_BY_PHONE  = "/api/appels/historyByPhone";
const SOUS_STATUTS_EP = "/api/sous_statuts/name";
const DEBOUNCE_MS = 400;

/* ---------- mini SWR cache (sessionStorage) ---------- */
const TTL = 60 * 1000; // 1 min
const keyFor = (key, page, limit, sortBy, sort, filters) =>
  `hist:${key}:${page}:${limit}:${sortBy}:${sort}:${JSON.stringify(filters)}`;

const readCache = (k) => {
  try {
    const raw = sessionStorage.getItem(k);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!ts || !data) return null;
    if (Date.now() - ts > TTL) return null;
    return data;
  } catch { return null; }
};

const writeCache = (k, data) => {
  try { sessionStorage.setItem(k, JSON.stringify({ ts: Date.now(), data })); } catch {}
};

/* ---------- cache cumul total (indépendant page/limit) ---------- */
const sumKeyFor = (key, filters) => `histsum:${key}:${JSON.stringify(filters)}`;
const sumDurations = (rows) => rows.reduce((acc, r) => acc + (Number(r.Duree_Appel) || 0), 0);

export default function CallHistoryByClientModal({
  isOpen,
  onClose,
  clientId,
  titleSuffix = "",
  fallbackPhone = ""
}) {
  /* ---------- table data ---------- */
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("Date");
  const [sort, setSort]   = useState("desc");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // cumul total (toutes pages / selon filtres)
  const [cumulTotalSeconds, setCumulTotalSeconds] = useState(0);

  // Total cumulé (en secondes) des lignes de la page affichée (info, pas utilisé pour le cumul total)
  const totalSeconds = useMemo(
    () => rows.reduce((acc, r) => acc + (Number(r.Duree_Appel) || 0), 0),
    [rows]
  );

  /* ---------- filtres ---------- */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [agentReceptionName, setAgentReceptionName] = useState("");
  const [agentEmmissionName, setAgentEmmissionName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sousStatutOptions, setSousStatutOptions] = useState([]);
  const [sousStatuts, setSousStatuts] = useState([]);
  const [clientName, setClientName] = useState("");
  const [typeAppel, setTypeAppel] = useState("");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");

  // debounce recherche globale
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  // charger la liste des sous-statuts
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(SOUS_STATUTS_EP);
        const rawList = Array.isArray(data)
          ? data.map(item =>
              typeof item === "string"
                ? item
                : (item.Sous_Statut ?? item.sous_statut ?? item.name ?? item.label ?? "")
            )
          : (Array.isArray(data?.names) ? data.names : []);
        const list = Array.from(new Set(rawList.map(s => String(s).trim()).filter(Boolean)));
        if (alive) setSousStatutOptions(list);
      } catch (e) {
        console.error("Erreur chargement sous-statuts:", e);
        if (alive) setSousStatutOptions([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filterBundle = useMemo(() => ({
    dateFrom, dateTo, typeAppel, agentReceptionName, agentEmmissionName, sousStatuts, clientName, qDebounced
  }), [dateFrom, dateTo, typeAppel, agentReceptionName, agentEmmissionName, sousStatuts, clientName, qDebounced]);

  const payloadClient = useMemo(() => ({
    clientId: parseInt(clientId),
    page,
    limit,
    sort,
    sortBy,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    typeAppel: typeAppel || undefined,
    agentReceptionName: agentReceptionName || undefined,
    agentEmmissionName: agentEmmissionName || undefined,
    sousStatuts: (sousStatuts && sousStatuts.length ? sousStatuts.map(s => String(s).trim()) : undefined),
    clientName: clientName || undefined,
    q: qDebounced || undefined,
  }), [clientId, page, limit, sort, sortBy, dateFrom, dateTo, typeAppel, agentReceptionName, agentEmmissionName, sousStatuts, clientName, qDebounced]);

  const cacheKeyClient = useMemo(
    () => keyFor(`client:${clientId}`, page, limit, sortBy, sort, filterBundle),
    [clientId, page, limit, sortBy, sort, filterBundle]
  );

  const abortRef = useRef(null);

  const loadByClient = async (showSpinnerIfNoCache = true) => {
    setErr("");

    const cached = readCache(cacheKeyClient);
    if (cached?.rows) {
      setRows(cached.rows);
      setTotal(cached.total);
      if (!loading) setLoading(false);
      return;
    } else if (showSpinnerIfNoCache) {
      setLoading(true);
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data } = await api.post(EP_BY_CLIENT, payloadClient, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });

      const rows = Array.isArray(data?.rows) ? data.rows : [];
      const total = Number(data?.total) || 0;

      writeCache(cacheKeyClient, { rows, total });
      setRows(rows);
      setTotal(total);
    } catch (e) {
      console.error("Erreur historyByClient:", e);

      // Fallback vers l'endpoint par numéro si l'endpoint par client n'existe pas
      if (e?.response?.status === 404) {
        const fallback = onlyDigits(fallbackPhone);
        if (fallback?.length >= 5) {
          await loadByPhone(fallback, showSpinnerIfNoCache);
          return;
        }
        setErr("Endpoint introuvable (404) et aucun numéro fallback fourni.");
      } else if (e?.response?.status === 400) {
        setErr(e?.response?.data?.message || "Requête invalide (400).");
      } else if (e.name !== "AbortError" && e.name !== "CanceledError") {
        setErr("Erreur lors du chargement de l'historique (client).");
      }
      if (!cached) { setRows([]); setTotal(0); }
    } finally {
      setLoading(false);
    }
  };

  const loadByPhone = async (digits, showSpinnerIfNoCache = true) => {
    const cacheKeyPhone = keyFor(`num:${digits}`, page, limit, sortBy, sort, filterBundle);
    const payloadPhone = {
      numero: digits,
      page, limit, sort, sortBy,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      typeAppel: typeAppel || undefined,
      agentReceptionName: agentReceptionName || undefined,
      agentEmmissionName: agentEmmissionName || undefined,
      sousStatuts: (sousStatuts && sousStatuts.length ? sousStatuts.map(s => String(s).trim()) : undefined),
      clientName: clientName || undefined,
      q: qDebounced || undefined,
    };

    const cached = readCache(cacheKeyPhone);
    if (cached?.rows) {
      const filteredRows = cached.rows.filter(row =>
        row.Client && row.Client.IDClient === parseInt(clientId)
      );
      setRows(filteredRows);
      setTotal(filteredRows.length);
      if (!loading) setLoading(false);
      return;
    } else if (showSpinnerIfNoCache) {
      setLoading(true);
    }

    try {
      const { data } = await api.post(EP_BY_PHONE, payloadPhone, {
        headers: { 'Content-Type': 'application/json' }
      });

      const rows = Array.isArray(data?.rows) ? data.rows : [];

      const filteredRows = rows.filter(row =>
        row.Client && row.Client.IDClient === parseInt(clientId)
      );

      writeCache(cacheKeyPhone, { rows: filteredRows, total: filteredRows.length });
      setRows(filteredRows);
      setTotal(filteredRows.length);
      setErr("");
    } catch (e) {
      console.error("Erreur historyByPhone:", e);
      if (e?.response?.status === 404) {
        setErr("Aucun historique trouvé pour ce numéro (404).");
      } else if (e?.response?.status === 400) {
        setErr(e?.response?.data?.message || "Requête invalide (400) côté numéro.");
      } else if (e.name !== "AbortError" && e.name !== "CanceledError") {
        setErr("Erreur lors du chargement de l'historique (numéro).");
      }
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // ---- cumul total (toutes pages) côté front ----
  const computeCumulTotalClient = async () => {
    try {
      const key = sumKeyFor(`client:${clientId}`, {
        dateFrom, dateTo, typeAppel, agentReceptionName, agentEmmissionName, sousStatuts, clientName, q: qDebounced
      });

      // 1) lire cache cumul total
      const cached = readCache(key);
      if (cached?.cumul != null) {
        setCumulTotalSeconds(Number(cached.cumul) || 0);
        return;
      }

      // 2) boucle toutes pages (limite large) + somme locale
      let pageIdx = 1;
      const bulkLimit = 1000; // ajuste si nécessaire
      let totalRows = 0;
      let sum = 0;

      const basePayload = {
        clientId: parseInt(clientId),
        page: pageIdx,
        limit: bulkLimit,
        sort: "desc",
        sortBy: "Date",
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        typeAppel: typeAppel || undefined,
        agentReceptionName: agentReceptionName || undefined,
        agentEmmissionName: agentEmmissionName || undefined,
        sousStatuts: (sousStatuts && sousStatuts.length ? sousStatuts.map(s => String(s).trim()) : undefined),
        clientName: clientName || undefined,
        q: qDebounced || undefined,
      };

      const first = await api.post(EP_BY_CLIENT, basePayload, { headers: { 'Content-Type': 'application/json' }});
      const firstRows = Array.isArray(first?.data?.rows) ? first.data.rows : [];
      const totalAll = Number(first?.data?.total) || firstRows.length;
      sum += sumDurations(firstRows);
      totalRows += firstRows.length;

      const totalPages = Math.max(1, Math.ceil(totalAll / bulkLimit));
      for (let p = 2; p <= totalPages; p++) {
        const { data } = await api.post(EP_BY_CLIENT, { ...basePayload, page: p });
        const pageRows = Array.isArray(data?.rows) ? data.rows : [];
        sum += sumDurations(pageRows);
        totalRows += pageRows.length;
        if (totalRows >= totalAll) break;
      }

      setCumulTotalSeconds(sum);
      writeCache(key, { cumul: sum });
    } catch (e) {
      console.error("computeCumulTotalClient error:", e);
      // on laisse la valeur actuelle (0 si échec)
    }
  };

  // ouverture + changement de client : charge page & colonnes
  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    loadByClient(true);
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [isOpen, clientId]);

  // recharger quand qDebounced change
  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    loadByClient(true);
  }, [qDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // revalidation quand on change page/limit/sort/filters (pour la table)
  useEffect(() => {
    if (!isOpen) return;
    loadByClient(true);
  }, [page, limit, sort, sortBy, dateFrom, dateTo, typeAppel, agentReceptionName, agentEmmissionName, sousStatuts, clientName]); // eslint-disable-line react-hooks/exhaustive-deps

  // calculer le cumul total (toutes pages) à l'ouverture et à chaque changement de filtres
  useEffect(() => {
    if (!isOpen) return;
    computeCumulTotalClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clientId, dateFrom, dateTo, typeAppel, agentReceptionName, agentEmmissionName, sousStatuts, clientName, qDebounced]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [commentOpen, setCommentOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState("");

  const handleApply = () => { setPage(1); loadByClient(true); };
  const handleReset = () => {
    setAgentReceptionName("");
    setAgentEmmissionName("");
    setDateFrom("");
    setDateTo("");
    setSousStatuts([]);
    setClientName("");
    setTypeAppel("");
    setQ("");
    setQDebounced("");
    setPage(1);
    loadByClient(true);
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSort(s => (s === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSort("asc"); }
  };

  const ThSort = ({ col, children }) => (
    <th
      role="button"
      onClick={() => toggleSort(col)}
      title="Trier"
      style={{ whiteSpace: "nowrap" }}
    >
      {children} {sortBy === col ? (sort === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  const { getBadgeColor } = useBadgeColor();

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl">
      <ModalHeader toggle={onClose}>
        Historique des appels — {titleSuffix ? `${titleSuffix} ` : ""}
        {err && err.includes("fallback") && (
          <small className="text-muted d-block">[Mode fallback par numéro]</small>
        )}
      </ModalHeader>

      <ModalBody>
        {/* Barre du haut : recherche / filtres / taille page */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <small className="text-muted">
              Total appels: {total}
              {" • "}
              Cumul <strong>total</strong>: <strong>{fmtDuree(cumulTotalSeconds)}</strong>
              {" • "}
              Page {page}/{totalPages}
            </small>
            {err && err.includes("fallback") && (
              <small className="text-muted d-block">[Mode fallback par numéro]</small>
            )}
          </div>

          <div className="d-flex align-items-center">
            <Input
              bsSize="sm"
              placeholder="🔎 Recherche globale…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: 240, marginRight: 8 }}
            />
            <Button
              size="sm"
              color="secondary"
              onClick={() => setFiltersOpen((s) => !s)}
              className="mr-2"
            >
              Filtres
            </Button>

            <small className="mr-2">Par page</small>
            <select
              className="form-control form-control-sm"
              style={{ width: 80 }}
              value={limit}
              onChange={(e) => {
                const l = Number(e.target.value) || 10;
                setLimit(l);
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Panneau filtres */}
        <Collapse isOpen={filtersOpen}>
          <div className="border rounded p-3 mb-3">
            <Row form>
              <Col md={6} lg={4}>
                <FormGroup>
                  <Label>Nom agent réception</Label>
                  <Input
                    value={agentReceptionName}
                    onChange={(e) => setAgentReceptionName(e.target.value)}
                    placeholder="ex: Ahmed Ali"
                  />
                </FormGroup>
              </Col>
              <Col md={6} lg={4}>
                <FormGroup>
                  <Label>Nom agent émission</Label>
                  <Input
                    value={agentEmmissionName}
                    onChange={(e) => setAgentEmmissionName(e.target.value)}
                    placeholder="ex: Sana Ben A."
                  />
                </FormGroup>
              </Col>
              <Col md={6} lg={4}>
                <FormGroup>
                  <Label>Client (nom)</Label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ex: Mohamed Trabelsi"
                  />
                </FormGroup>
              </Col>

              <Col md={6} lg={3}>
                <FormGroup>
                  <Label>Date de</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </FormGroup>
              </Col>
              <Col md={6} lg={3}>
                <FormGroup>
                  <Label>Date à</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </FormGroup>
              </Col>

              <Col md={6} lg={3}>
                <FormGroup>
                  <Label>Type</Label>
                  <Input
                    type="select"
                    value={typeAppel}
                    onChange={(e) => setTypeAppel(e.target.value)}
                  >
                    <option value="">— Tous —</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </Input>
                </FormGroup>
              </Col>

              <Col md={6} lg={3}>
                <FormGroup>
                  <Label>Sous-statut</Label>
                  <Input
                    type="select"
                    multiple
                    value={sousStatuts}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                      setSousStatuts(selected);
                    }}
                    style={{ minHeight: 96 }}
                  >
                    {sousStatutOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button color="secondary" className="mr-2" onClick={handleReset}>
                Réinitialiser
              </Button>
              <Button color="primary" onClick={handleApply}>
                Appliquer
              </Button>
            </div>
          </div>
        </Collapse>

        {/* Contenu */}
        {loading && (
          <div className="d-flex align-items-center">
            <Spinner size="sm" color="primary" className="mr-2" /> Chargement…
          </div>
        )}
        {!loading && err && <div className="text-danger">{err}</div>}

        {!loading && !err && (
          <>
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead style={{ backgroundColor: "#e0f0ff" }}>
                  <tr>
                    <ThSort col="Date">Date</ThSort>
                    <ThSort col="Heure">Heure</ThSort>
                    <ThSort col="Type_Appel">Type</ThSort>
                    <ThSort col="Duree_Appel">Durée</ThSort>
                    <th>Numéro</th>
                    <ThSort col="Sous_Statut">Sous Statut</ThSort>
                    <th>Agent Émission</th>
                    <th>Agent Réception</th>
                    <th>Client</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="text-center text-muted">
                        Aucun appel trouvé pour ce client.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.IDAppel}>
                        <td>{r.Date ? new Date(r.Date).toLocaleDateString() : "—"}</td>
                        <td>{r.Heure || "—"}</td>
                        <td>{r.Type_Appel || "—"}</td>
                        <td>{fmtDuree(r.Duree_Appel)}</td>
                        <td>{formatPhoneNumber(r.Numero) || "—"}</td>
                        <td><Badge color={getBadgeColor(r.Sous_Statut)}>{r.Sous_Statut || "—"}</Badge></td>

                        <td>
                          {r.Agent_Emmission ? (
                            <span className="text-info">
                              {r.Agent_Emmission.Prenom} {r.Agent_Emmission.Nom}
                            </span>
                          ) : "—"}
                        </td>
                        <td>
                          {r.Agent_Reception ? (
                            <span className="text-success">
                              {r.Agent_Reception.Prenom} {r.Agent_Reception.Nom}
                            </span>
                          ) : "—"}
                        </td>
                        <td>
                          {r.Client ? (
                            <span className="text-primary">
                              {r.Client.Prenom} {r.Client.Nom}
                            </span>
                          ) : "—"}
                        </td>

                        <td>
                          <div
                            style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            title={r.Commentaire || ""}
                          >
                            {r.Commentaire || "—"}
                          </div>
                          {r.Commentaire && r.Commentaire.length > 0 && (
                            <Button
                              size="sm"
                              color="link"
                              className="p-0 ml-1"
                              onClick={() => { setSelectedComment(r.Commentaire); setCommentOpen(true); }}
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
                onClick={() => setPage(page - 1)}
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
                onClick={() => setPage(page + 1)}
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

      {/* Modal "voir plus" commentaire */}
      <Modal isOpen={commentOpen} toggle={() => setCommentOpen(false)}>
        <ModalHeader toggle={() => setCommentOpen(false)}>Commentaire complet</ModalHeader>
        <ModalBody style={{ whiteSpace: "pre-wrap" }}>{selectedComment}</ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setCommentOpen(false)}>Fermer</Button>
        </ModalFooter>
      </Modal>
    </Modal>
  );
}
