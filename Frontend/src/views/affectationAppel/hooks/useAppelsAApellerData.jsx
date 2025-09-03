import { useEffect, useMemo, useState } from "react";
import api from "api";

export default function useAppelsAApellerData() {
  const [data, setData] = useState([]);        // data brute
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filtres
  const [filters, setFilters] = useState({
    q: "",
    dateMin: "",
    dateMax: "",
    IDClient: "",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch unique (statut déjà filtré côté API)
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        //        const res = await api.get("http://localhost:5000/api/journalappels/aapeller");

        const res = await api.get("/api/journalappels/aapeller");
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setError("Erreur lors du chargement des appels.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Helpers filtres
  const applyFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1); // reset page à chaque changement de filtre
  };
  const resetFilters = () => {
    setFilters({ q: "", dateMin: "", dateMax: "", IDClient: "" });
    setPage(1);
  };

  // Filtrage en mémoire
  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const dMin = filters.dateMin ? new Date(filters.dateMin) : null;
    const dMax = filters.dateMax ? new Date(filters.dateMax) : null;
    const idClient = filters.IDClient ? String(filters.IDClient) : "";

    return data.filter((row) => {
      // robustesse: différents noms possibles selon ton backend
      const dateVal = row.Date ?? row.date ?? row.DateAppel ?? row.createdAt;
      const idClientRow = row.IDClient ?? row.idClient ?? row.ClientId;

      const matchQ =
        !q ||
        Object.values(row).some((v) =>
          String(v ?? "").toLowerCase().includes(q)
        );

      const t = dateVal ? new Date(dateVal) : null;
      const matchMin = !dMin || (t && t >= dMin);
      const matchMax = !dMax || (t && t <= dMax);

      const matchClient = !idClient || String(idClientRow ?? "") === idClient;

      return matchQ && matchMin && matchMax && matchClient;
    });
  }, [data, filters]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const rows = filtered.slice(start, start + limit);

  return {
    // data
    rows, total, totalPages,
    loading, error,

    // paging
    page, limit, setPage,

    // filters
    filters,
    applyFilters,
    resetFilters,
  };
}
