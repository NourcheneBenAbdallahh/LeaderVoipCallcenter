import { useCallback, useEffect, useMemo, useState } from "react";
import api from "api";
import { formatDuration } from "../utils/time";

const DEFAULT_LIMIT = 20;
//const API = "http://localhost:5000/api";

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
  // jeu de la page courante uniquement
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

  // persistance
  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem(PARAMS_KEY, JSON.stringify({ page, sortBy, sortDir }));
  }, [page, sortBy, sortDir]);

  // FETCH (pagination serveur)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        sortBy,
        sortDir,
        IDAgent_Reception: filters.IDAgent_Reception || undefined,
        IDAgent_Emmission: filters.IDAgent_Emmission || undefined,
        IDClient: filters.IDClient || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        dureeMin: filters.dureeMin || undefined,
        dureeMax: filters.dureeMax || undefined,
        q: filters.q || undefined,
        // Sous_Statut: envoyé en CSV
        Sous_Statut: (filters.Sous_Statut && filters.Sous_Statut.length)
          ? filters.Sous_Statut.join(",")
          : undefined,
      };

      const res = await api.get(`${API}/journalappels/opti`, { params });
      const { rows: data, total: t } = res.data || {};
      setRows(Array.isArray(data) ? data : []);
      setTotal(Number(t) || 0);
    } catch (e) {
      console.error("Erreur chargement appels (opti):", e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // actions
  const applyFilters = (next) => {
    setFilters(next);
    setPage(1); // on revient en page 1 sur changement de filtres
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

  // compteur "aujourd'hui" (si tu veux du global, fais un endpoint count)
  const today = new Date().toISOString().slice(0, 10);
  const appelsAujourdHui = useMemo(() => {
    return rows.filter(a => a.Date && String(a.Date).startsWith(today)).length;
  }, [rows, today]);

  return {
    rows, loading,
    total,       // total filtré (serveur)
    page, limit, sortBy, sortDir, filters,
    avgDurationLabel, avgDurationSec,
    totalTraites, appelsAujourdHui,

    setPage, applyFilters, clearOneFilter, resetAll, handleSort,
  };
}
