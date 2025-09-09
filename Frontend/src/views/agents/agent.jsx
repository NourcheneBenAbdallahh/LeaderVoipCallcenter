import React, { useState, useEffect, useMemo, useRef } from "react";
import api from "api";
import {
  Container, Row, Col, Card, CardHeader, CardBody, Spinner
} from "reactstrap";
import Header from "components/Headers/Header.js";
import AgentTable from "./AgentTableComponent";
import ClientSearchBar from "../clients/ClientSearchBarComponent";
import ClientPagination from "../clients/ClientPaginationComponent";
import { useLocation } from "react-router-dom";

/* ===========================
   Config cache & revalidation
   =========================== */
const CACHE_KEY_DATA = "agents:list:v1";  // données API
const CACHE_KEY_UI   = "agents:ui:v1";    // état UI (recherche + page)
const SCROLL_KEY     = "agents:scrollY";  // position scroll
const CACHE_TTL_MS   = 5 * 60 * 1000;     // 5 minutes
const REVALIDATE_MS  = 30 * 1000;         // revalidation périodique (30s)

/** Hash rapide d'un échantillon pour éviter de remettre l'état si rien n'a changé */
function quickSignature(arr) {
  if (!Array.isArray(arr)) return "0:0";
  const n = arr.length;
  const take = Math.min(100, n);
  let hash = 0;
  for (let i = 0; i < take; i++) {
    const a = arr[i] || {};
    const s = `${a.IDAgent_Emmission}|${a.Nom}|${a.Prenom}|${a.Login}|${a.Etat_Compte}|${a.Administrateur}|${a.Ajout}|${a.Modification}|${a.Supression}`;
    for (let j = 0; j < s.length; j++) hash = (hash * 31 + s.charCodeAt(j)) | 0;
  }
  return `${n}:${hash}`;
}

/* ================
   Helpers storage
   ================ */
function readDataCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_DATA);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!ts || !data) return null;
    if (Date.now() - ts > CACHE_TTL_MS) return null; // expiré
    return data;
  } catch { return null; }
}

function writeDataCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY_DATA, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function readUICache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_UI);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeUICache(ui) {
  try { sessionStorage.setItem(CACHE_KEY_UI, JSON.stringify(ui)); } catch {}
}

/** À appeler après create/update/delete d'un agent (depuis n'importe quel composant) */
export function invalidateAgentsCache() {
  try { sessionStorage.removeItem(CACHE_KEY_DATA); } catch {}
}

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const agentsPerPage = 10;

  // Stats (venant de l'API)
  const [total, setTotal] = useState(0);
  const [actifs, setActifs] = useState(0);
  const [inactifs, setInactifs] = useState(0);
  const [totalAgent, setTotalAgent] = useState(0);

  // focus depuis l'URL
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const focusId = searchParams.get("focus"); // string | null
  const [highlightId, setHighlightId] = useState(null);
  const rowRef = useRef(null);

  // pour annuler les fetchs & éviter setState inutiles
  const abortRef = useRef(null);
  const lastSigRef = useRef("");

  /* ==================
     Application donnée
     ================== */
  const applyApiData = (payload) => {
    const { agents: arr, total, actifs: a, inactifs: i, totalAgent: ta } = payload;

    // ne rien faire si identique à ce qui est déjà affiché
    const sig = quickSignature(arr);
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;

    const list = Array.isArray(arr) ? arr : [];
    setAgents(list);
    setTotal(Number(total || list.length));

    if (a == null || i == null) {
      const calcA = list.filter(x => Number(x.Etat_Compte) === 1).length;
      const calcI = list.length - calcA;
      setActifs(calcA);
      setInactifs(calcI);
    } else {
      setActifs(Number(a) || 0);
      setInactifs(Number(i) || 0);
    }
    setTotalAgent(Number(ta) || 0);
  };

  /* ==================
     Fetch API (réseau)
     ================== */
  const fetchAgents = async (signal) => {
    const res = await api.get("/api/agents", { signal });
    const data = res.data;

    if (data && Array.isArray(data.agents)) {
      const a = Number(data?.comptes?.actifs ?? 0) || 0;
      const i = Number(data?.comptes?.inactifs ?? 0) || 0;
      return {
        agents: data.agents,
        total: Number(data.total ?? data.agents.length) || 0,
        actifs: a + i === 0 ? undefined : a,
        inactifs: a + i === 0 ? undefined : i,
        totalAgent: Number(data?.totalAgent ?? 0) || 0,
      };
    } else if (Array.isArray(data)) {
      return {
        agents: data,
        total: data.length,
        actifs: undefined,
        inactifs: undefined,
        totalAgent: Number(data?.totalAgent ?? 0) || 0,
      };
    }
    // fallback format inattendu
    return { agents: [], total: 0, actifs: 0, inactifs: 0, totalAgent: 0 };
  };

  /* ===================================================
     SWR: affiche cache puis revalide en arrière-plan
     =================================================== */
  const loadAgents = async () => {
    // 1) cache → affichage immédiat (sans spinner)
    const cached = readDataCache();
    if (cached?.agents) {
      applyApiData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // 2) revalidation (réseau)
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fresh = await fetchAgents(controller.signal);
      writeDataCache(fresh);
      applyApiData(fresh);
    } catch (e) {
      if (e.name !== "AbortError" && e.name !== "CanceledError") {
        console.error("GET /api/agents error:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     Montage / Démontage
     ===================== */
  useEffect(() => {
    // restaurer l'UI (recherche + page + scroll)
    const ui = readUICache();
    if (ui) {
      setSearchTerm(ui.searchTerm ?? "");
      setCurrentPage(Number(ui.currentPage ?? 1) || 1);
      requestAnimationFrame(() => {
        const y = Number(sessionStorage.getItem(SCROLL_KEY) || 0);
        if (y > 0) window.scrollTo(0, y);
      });
    }

    loadAgents();

    // revalider quand l'onglet revient visible
    const onVis = () => { if (document.visibilityState === "visible") loadAgents(); };
    document.addEventListener("visibilitychange", onVis);

    // revalidation périodique
    const id = setInterval(loadAgents, REVALIDATE_MS);

    return () => {
      if (abortRef.current) abortRef.current.abort();
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(id);
      try { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY || 0)); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persister l'UI
  useEffect(() => {
    writeUICache({ searchTerm, currentPage });
  }, [searchTerm, currentPage]);

  /* ===================
     Focus via ?focus=ID
     =================== */
  const filteredAgents = useMemo(() => {
    if (!Array.isArray(agents)) return [];
    const s = searchTerm.trim().toLowerCase();
    if (!s) return agents;
    return agents.filter((agent) =>
      Object.values(agent || {}).join(" ").toLowerCase().includes(s)
    );
  }, [agents, searchTerm]);

  useEffect(() => {
    if (!focusId || !filteredAgents.length) return;
    const idx = filteredAgents.findIndex(a => String(a.IDAgent_Emmission) === String(focusId));
    if (idx >= 0) {
      const page = Math.floor(idx / agentsPerPage) + 1;
      setCurrentPage(page);
      setHighlightId(String(focusId));
      setTimeout(() => {
        if (rowRef.current) rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [focusId, filteredAgents]);

  /* ============
     Pagination
     ============ */
  const indexOfLast = currentPage * agentsPerPage;
  const indexOfFirst = indexOfLast - agentsPerPage;
  const paginatedAgents = filteredAgents.slice(indexOfFirst, indexOfLast);
  const totalAgents = filteredAgents.length;

  return (
    <>
      <Header
        name1="Total Agents Emmis"
        name2="Compte Actif"
        name3="Compte Inactif"
        name4="Total Agents"
        totalClients={total}
        totalAppelsEmis={actifs}
        totalAppelsRecus={inactifs}
        attrb4={totalAgent}
        title="Liste des agents Emmission"
      />

      <Container className="mt-[-3rem]" fluid>
        <Row>
          <Col>
            <Card className="shadow">
              <CardHeader>
                <Row className="items-center justify-between">
                  <Col xs="12" md="6">
                    <h3 className="mb-0">Liste des agents Emmission</h3>
                  </Col>
                  <Col xs="12" md="6" className="text-md-right mt-2 md:mt-0">
                    <ClientSearchBar
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center">
                    <Spinner color="primary" /> Chargement...
                  </div>
                ) : (
                  <>
                    <AgentTable
                      agents={paginatedAgents}
                      highlightId={highlightId}
                      rowRef={rowRef}
                    />
                    <ClientPagination
                      currentPage={currentPage}
                      totalClients={totalAgents}
                      clientsPerPage={agentsPerPage}
                      setCurrentPage={setCurrentPage}
                    />
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Agents;
