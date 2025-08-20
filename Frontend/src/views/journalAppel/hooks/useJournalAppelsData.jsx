import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const DEFAULT_LIMIT = 20;

const DEFAULT_FILTERS = {
  IDAgent_Reception: "",
  IDAgent_Emmission: "",
  Sous_Statut: [],
  dureeMin: "",
  dureeMax: "",
  dateFrom: "",
  dateTo: "",
  IDClient: "",
  q: "", // recherche globale optionnelle
};

const FILTERS_KEY = "journalAppels.filters.v1";
const PARAMS_KEY  = "journalAppels.params.v1";

export function useJournalAppelsData() {
  // on garde TOUT en mémoire et on pagine localement (slice)
  const [allRows, setAllRows] = useState([]);
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

  // persistance
  useEffect(() => { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters)); }, [filters]);
  useEffect(() => { localStorage.setItem(PARAMS_KEY, JSON.stringify({ page, sortBy, sortDir })); }, [page, sortBy, sortDir]);

  // ======= FETCH: une seule requête, sans pagination serveur =======
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Option A (simple) : tout l’historique
      const res = await axios.get("http://localhost:5000/api/appelsselect");
      const arr = Array.isArray(res.data) ? res.data : (res.data.rows || []);
      setAllRows(arr || []);
    } catch (e) {
      console.error("Erreur chargement appels:", e);
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ======= FILTRAGE côté client =======
  const filtered = useMemo(() => {
    const {
      IDAgent_Reception, IDAgent_Emmission, Sous_Statut,
      dureeMin, dureeMax, dateFrom, dateTo, IDClient, q
    } = filters;

    const ql = (q || "").toLowerCase().trim();

    return allRows.filter((r) => {
      // IDAgent Réception
      if (IDAgent_Reception && String(r.IDAgent_Reception) !== String(IDAgent_Reception)) return false;
      // IDAgent Emmission
      if (IDAgent_Emmission && String(r.IDAgent_Emmission) !== String(IDAgent_Emmission)) return false;
      // Sous Statut (liste)
      if (Array.isArray(Sous_Statut) && Sous_Statut.length && !Sous_Statut.includes(r.Sous_Statut)) return false;
      // Durée
      if (dureeMin && Number(r.Duree_Appel) < Number(dureeMin)) return false;
      if (dureeMax && Number(r.Duree_Appel) > Number(dureeMax)) return false;
      // Date (on compare sur la partie date uniquement)
      if (dateFrom && r.Date && new Date(r.Date).toISOString().slice(0,10) < dateFrom) return false;
      if (dateTo   && r.Date && new Date(r.Date).toISOString().slice(0,10) > dateTo)   return false;
      // Client
      if (IDClient && String(r.IDClient) !== String(IDClient)) return false;
      // Recherche globale
      if (ql) {
        const hay = [
          r.IDAppel, r.Date, r.Heure, r.Type_Appel, r.Duree_Appel, r.Commentaire,
          r.Numero, r.IDClient, r.IDAgent_Reception, r.IDAgent_Emmission, r.Sous_Statut
        ].map(v => (v == null ? "" : String(v).toLowerCase())).join(" ");
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [allRows, filters]);

  // ======= TRI côté client =======
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "ASC" ? 1 : -1;

    const getVal = (row) => {
      switch (sortBy) {
        case "IDAppel":
        case "IDClient":
        case "IDAgent_Reception":
        case "IDAgent_Emmission":
        case "Duree_Appel":
        case "Type_Appel":
          return Number(row[sortBy]) || 0;
        case "Date":
          return row.Date ? new Date(row.Date).getTime() : 0;
        default:
          return (row[sortBy] ?? "").toString().toLowerCase();
      }
    };

    arr.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return  1 * dir;
      return 0;
    });

    return arr;
  }, [filtered, sortBy, sortDir]);
  //lastdateappel
const dernierAppel = useMemo(() => {
  if (!sorted.length) return null;
  return sorted.reduce((latest, r) => {
    const time = new Date(r.Date + " " + (r.Heure || "00:00")).getTime();
    const latestTime = new Date(latest.Date + " " + (latest.Heure || "00:00")).getTime();
    return time > latestTime ? r : latest;
  }, sorted[0]);
}, [sorted]);


  // ======= PAGINATION locale (slice), comme ta page Agents =======
  const total = sorted.length;
  const indexOfLast = page * limit;
  const indexOfFirst = indexOfLast - limit;
  const paginatedRows = sorted.slice(indexOfFirst, indexOfLast);

  // actions
// Dans useJournalAppelsData, modifie applyFilters pour ne pas reset si on est déjà sur la même page
const applyFilters = (next) => {
  setFilters(next);
  // seulement remettre à 1 si les filtres changent vraiment
  if (JSON.stringify(next) !== JSON.stringify(filters)) {
    setPage(1);
    localStorage.setItem(PARAMS_KEY, JSON.stringify({ page: 1, sortBy, sortDir }));
  }
  localStorage.setItem(FILTERS_KEY, JSON.stringify(next));
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

  return {
    rows: paginatedRows,   // <— pour ton tableau
    total,                 // <— pour ClientPagination
    loading,

    page, limit, sortBy, sortDir, filters,
dernierAppel,
    setPage, applyFilters, clearOneFilter, resetAll, handleSort,
  };
}
