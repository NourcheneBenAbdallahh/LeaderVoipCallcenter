// hooks/useJournalAppelsData.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "api";
import { formatDuration } from "../utils/time";

const DEFAULT_LIMIT = 10;
const API = "/api";
const ENDPOINT_DEFAULT = `${API}/last-calls`;
const ENDPOINT_FILTERS = `${API}/last-calls-filters`;

/* ================== Filtres ================== */
const DEFAULT_FILTERS = {
  agentReceptionName: "",
  agentEmmissionName: "",
  Sous_Statut: [],
  dureeMin: "",
  dureeMax: "",
  dateFrom: "",
  dateTo: "",
  clientName: "",
  q: "",
};

// vrai si au moins 1 filtre est rempli
const hasActiveFilters = (f) => {
  if ((f.agentReceptionName || "").trim()) return true;
  if ((f.agentEmmissionName || "").trim()) return true;
  if ((f.clientName || "").trim()) return true;
  if ((f.dateFrom || "").trim()) return true;
  if ((f.dateTo || "").trim()) return true;
  if ((f.dureeMin || "").toString().trim()) return true;
  if ((f.dureeMax || "").toString().trim()) return true;
  if (Array.isArray(f.Sous_Statut) && f.Sous_Statut.length) return true;
  if ((f.q || "").trim()) return true;
  return false;
};

const FILTERS_KEY = "journalAppels.filters.v2";
const PARAMS_KEY  = "journalAppels.params.v2";

/* ========= Cache (SWR-like) ========= */
const CACHE_PREFIX   = "journalAppels:data:v1";
const CACHE_TTL_MS   = 5 * 60 * 1000;
const REVALIDATE_MS  = 30 * 1000;

function buildDataKey({ page, limit, sortBy, sortDir, filters }) {
  // inclure les filtres (version noms) dans la clé
  const f = {
    clientName:         filters.clientName || "",
    agentEmmissionName: filters.agentEmmissionName || "",
    agentReceptionName: filters.agentReceptionName || "",
    Sous_Statut: Array.isArray(filters.Sous_Statut) ? filters.Sous_Statut.join("|") : "",
    dureeMin: filters.dureeMin || "",
    dureeMax: filters.dureeMax || "",
    dateFrom: filters.dateFrom || "",
    dateTo:   filters.dateTo || "",
    q:        filters.q || "",
  };
  return `${CACHE_PREFIX}:${page}:${limit}:${sortBy}:${sortDir}:${JSON.stringify(f)}`;
}

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!ts || !data) return null;
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch { return null; }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function quickSignature(rows) {
  if (!Array.isArray(rows)) return "0:0";
  const n = rows.length;
  const take = Math.min(100, n);
  let hash = 0;
  for (let i = 0; i < take; i++) {
    const r = rows[i] || {};
    const s = `${r.IDAppel}|${r.Date}|${r.Heure}|${r.Type_Appel}|${r.Duree_Appel}|${r.Sous_Statut}|${r.IDClient}|${r.IDAgent_Reception}|${r.IDAgent_Emmission}`;
    for (let j = 0; j < s.length; j++) hash = (hash * 31 + s.charCodeAt(j)) | 0;
  }
  return `${n}:${hash}`;
}

const parseDurationToSeconds = (v) => {
  if (v == null) return 0;
  if (!isNaN(v)) return Number(v) || 0; // "90" -> 90
  const parts = String(v).split(":").map(n => Number(n) || 0);
  if (parts.length === 3) { const [h,m,s]=parts; return h*3600 + m*60 + s; }
  if (parts.length === 2) { const [m,s]=parts;  return m*60 + s; }
  return 0;
};

// enlève les champs vides des params
const cleanParams = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
};

export function useJournalAppelsData() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PARAMS_KEY))?.page ?? 1; } catch { return 1; }
  });
  const [limit] = useState(DEFAULT_LIMIT);
  const [sortBy, setSortBy] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PARAMS_KEY))?.sortBy ?? "Date"; } catch { return "Date"; }
  });
  const [sortDir, setSortDir] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PARAMS_KEY))?.sortDir ?? "DESC"; } catch { return "DESC"; }
  });

  const [filters, setFilters] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || "null");
      return saved && typeof saved === "object" ? { ...DEFAULT_FILTERS, ...saved } : DEFAULT_FILTERS;
    } catch { return DEFAULT_FILTERS; }
  });

  const [total, setTotal] = useState(0);

  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  }, [filters]);
  
  useEffect(() => {
    localStorage.setItem(PARAMS_KEY, JSON.stringify({ page, sortBy, sortDir }));
  }, [page, sortBy, sortDir]);

  const abortRef = useRef(null);
  const lastSigRef = useRef("");

  const paramsForKey = useMemo(() => ({ page, limit, sortBy, sortDir, filters }), [page, limit, sortBy, sortDir, filters]);
  const dataKey = useMemo(() => buildDataKey(paramsForKey), [paramsForKey]);

  const fetchData = useCallback(async (key, showSpinnerIfNoCache = true) => {
    const cached = readCache(key);
    if (cached?.rows) {
      const sig = quickSignature(cached.rows);
      if (sig !== lastSigRef.current) {
        lastSigRef.current = sig;
        setRows(cached.rows);
        setTotal(Number(cached.total) || 0);
      }
      setLoading(false);
    } else if (showSpinnerIfNoCache) {
      setLoading(true);
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const useFilters = hasActiveFilters(filters);
      const endpoint = useFilters ? ENDPOINT_FILTERS : ENDPOINT_DEFAULT;

      // params pour l’endpoint choisi
      const p = cleanParams({
        page, limit, sortBy, sortDir,

        // /last-calls-filters (par NOMS)
        clientName:         filters.clientName,
        agentEmmissionName: filters.agentEmmissionName,
        agentReceptionName: filters.agentReceptionName,

        // communs
        dateFrom: filters.dateFrom,
        dateTo:   filters.dateTo,
        dureeMin: filters.dureeMin, // secondes, sinon vide
        dureeMax: filters.dureeMax,
        sousStatuts: (filters.Sous_Statut && filters.Sous_Statut.length)
          ? filters.Sous_Statut.join(",")
          : undefined,
        q: filters.q,
      });

      const res = await api.get(endpoint, { params: p, signal: controller.signal });

      const responseData = res.data;
      if (responseData && responseData.success) {
        const fresh = { 
          rows: Array.isArray(responseData.data) ? responseData.data : [], 
          total: responseData.pagination?.totalItems || 0 
        };

        writeCache(key, fresh);

        const sig = quickSignature(fresh.rows);
        if (sig !== lastSigRef.current) {
          lastSigRef.current = sig;
          setRows(fresh.rows);
          setTotal(fresh.total);
        }
      } else {
        // Fallback si la structure est différente
        const fresh = { 
          rows: Array.isArray(responseData) ? responseData : [], 
          total: responseData.length || 0 
        };
        writeCache(key, fresh);
        setRows(fresh.rows);
        setTotal(fresh.total);
      }
    } catch (e) {
      // ne pas "vider" la table ; ignorer les annulations
      if (e.name === "CanceledError" || e.name === "AbortError") {
        // normal : une nouvelle requête a annulé l’ancienne
      } else {
        console.error("Erreur chargement derniers appels:", e);
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, filters]);

  useEffect(() => { 
    fetchData(dataKey); 
  }, [fetchData, dataKey]);

  useEffect(() => {
    const onVis = () => { 
      if (document.visibilityState === "visible") fetchData(dataKey, false); 
    };
    document.addEventListener("visibilitychange", onVis);
    const id = setInterval(() => fetchData(dataKey, false), REVALIDATE_MS);
    return () => { 
      document.removeEventListener("visibilitychange", onVis); 
      clearInterval(id); 
    };
  }, [fetchData, dataKey]);

  const applyFilters = (next) => {
    setFilters(next);
    setPage(1);
  };
  
  const clearOneFilter = (key) => {
    const next = { ...filters };
    if (key === "Sous_Statut") next.Sous_Statut = [];
    else next[key] = "";
    applyFilters(next);
  };
  
  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    localStorage.removeItem(FILTERS_KEY);
    localStorage.setItem(PARAMS_KEY, JSON.stringify({ page: 1, sortBy: "Date", sortDir: "DESC" }));
  };
  
  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else { setSortBy(col); setSortDir("ASC"); }
    setPage(1);
  };

  const avgDurationSec = useMemo(() => {
    if (!rows.length) return 0;
    const sum = rows.reduce((acc, r) => acc + parseDurationToSeconds(r.Duree_Appel), 0);
    return Math.round(sum / rows.length);
  }, [rows]);
  
  const avgDurationLabel = formatDuration(avgDurationSec);

  const totalTraites = useMemo(() => {
    return rows.filter(r => (r.Sous_Statut ?? "").toString().trim().toUpperCase() === "TRAITE").length;
  }, [rows]);

  const today = new Date().toISOString().slice(0, 10);
  const appelsAujourdHui = useMemo(() => {
    return rows.filter(a => a.Date && String(a.Date).startsWith(today)).length;
  }, [rows, today]);

  return {
    rows, 
    loading,
    total,
    page, 
    limit, 
    sortBy, 
    sortDir, 
    filters,
    avgDurationLabel, 
    avgDurationSec,
    totalTraites, 
    appelsAujourdHui,
    setPage, 
    applyFilters, 
    clearOneFilter, 
    resetAll, 
    handleSort,
  };
}
