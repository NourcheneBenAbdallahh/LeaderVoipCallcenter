import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "api";
import { formatDuration } from "../utils/time";

const DEFAULT_LIMIT = 20;
const API = "/api";

const DEFAULT_FILTERS = {
  IDAgent_Reception: "",
  IDAgent_Emmission: "",
  Sous_Statut: [],
  dureeMin: "",
  dureeMax: "",
  dateFrom: "",
  dateTo: "",
  IDClient: "",
  q: "",
};

const FILTERS_KEY = "journalAppels.filters.v2";
const PARAMS_KEY  = "journalAppels.params.v2";

/* ========= Cache données paginées (SWR) ========= */
const CACHE_PREFIX   = "journalAppels:data:v1"; // + key dérivée des params
const CACHE_TTL_MS   = 5 * 60 * 1000;           // 5 min
const REVALIDATE_MS  = 30 * 1000;               // 30 s

function buildDataKey({ page, limit, sortBy, sortDir, filters }) {
  // on ne met que les champs utiles (stables)
  const f = {
    IDAgent_Reception: filters.IDAgent_Reception || "",
    IDAgent_Emmission: filters.IDAgent_Emmission || "",
    IDClient: filters.IDClient || "",
    Sous_Statut: Array.isArray(filters.Sous_Statut) ? filters.Sous_Statut.join("|") : "",
    dureeMin: filters.dureeMin || "",
    dureeMax: filters.dureeMax || "",
    dateFrom: filters.dateFrom || "",
    dateTo: filters.dateTo || "",
    q: filters.q || "",
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
    return data; // { rows, total }
  } catch { return null; }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

// signature rapide pour éviter setState inutiles
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

// util pour convertir mm:ss/hh:mm:ss vers secondes si tu veux afficher un avg local propre
const parseDurationToSeconds = (v) => {
  if (v == null) return 0;
  if (!isNaN(v)) return Number(v) || 0;
  const parts = String(v).split(":").map(n => Number(n) || 0);
  if (parts.length === 3) { const [h,m,s]=parts; return h*3600 + m*60 + s; }
  if (parts.length === 2) { const [m,s]=parts;  return m*60 + s; }
  return 0;
};

export function useJournalAppelsData() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // pagination & tri (persistés)
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

  // persistance UI
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

  // FETCH (SWR: cache immédiat + revalidation)
  const fetchData = useCallback(async (key, showSpinnerIfNoCache = true) => {
    const cached = readCache(key);
    if (cached?.rows) {
      // Affichage instantané
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

    // Annule l'appel précédent
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const p = {
        page, limit, sortBy, sortDir,
        IDAgent_Reception: filters.IDAgent_Reception || undefined,
        IDAgent_Emmission: filters.IDAgent_Emmission || undefined,
        IDClient: filters.IDClient || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        dureeMin: filters.dureeMin || undefined,
        dureeMax: filters.dureeMax || undefined,
        q: filters.q || undefined,
        Sous_Statut: (filters.Sous_Statut && filters.Sous_Statut.length)
          ? filters.Sous_Statut.join(",")
          : undefined,
      };

      const res = await api.get(`${API}/journalappels/opti`, { params: p, signal: controller.signal });
      const { rows: data, total: t } = res.data || {};
      const fresh = { rows: Array.isArray(data) ? data : [], total: Number(t) || 0 };

      writeCache(key, fresh);

      const sig = quickSignature(fresh.rows);
      if (sig !== lastSigRef.current) {
        lastSigRef.current = sig;
        setRows(fresh.rows);
        setTotal(fresh.total);
      }
    } catch (e) {
      if (e.name !== "AbortError" && e.name !== "CanceledError") {
        console.error("Erreur chargement appels (opti):", e);
        // si pas de cache, on vide pour éviter de rester bloqué
        if (!cached) { setRows([]); setTotal(0); }
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, filters]);

  // première charge & à chaque changement de paramètres
  useEffect(() => { fetchData(dataKey); }, [fetchData, dataKey]);

  // revalidation périodique + quand l’onglet revient visible
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") fetchData(dataKey, false); };
    document.addEventListener("visibilitychange", onVis);
    const id = setInterval(() => fetchData(dataKey, false), REVALIDATE_MS);
    return () => { document.removeEventListener("visibilitychange", onVis); clearInterval(id); };
  }, [fetchData, dataKey]);

  // actions
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

  // Infos calculées (sur la page courante uniquement)
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
    rows, loading,
    total,
    page, limit, sortBy, sortDir, filters,
    avgDurationLabel, avgDurationSec,
    totalTraites, appelsAujourdHui,

    setPage, applyFilters, clearOneFilter, resetAll, handleSort,
  };
}
