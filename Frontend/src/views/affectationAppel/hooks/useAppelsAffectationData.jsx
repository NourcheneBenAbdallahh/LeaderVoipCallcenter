import { useState, useEffect } from "react";
import axios from "axios";

export function useAppelsAffectationData() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("Date");
  const [sortDir, setSortDir] = useState("DESC");

  const [filters, setFilters] = useState({
    Sous_Statut: ["À appeler"], // filtrage par défaut
    q: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page, limit, sortBy, sortDir,
        ...filters
      };
      const res = await axios.get("http://localhost:5000/api/journalappels/aapeller", { params });
      setRows(res.data.rows || res.data);
      setTotal(res.data.total || res.data.length);
    } catch (err) {
      console.error("Erreur récupération appels à affecter:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, sortBy, sortDir, filters]);

  const applyFilters = (newFilters) => setFilters(newFilters);
  const clearOneFilter = (key) => setFilters(f => ({ ...f, [key]: key === "Sous_Statut" ? [] : "" }));
  const resetAll = () => setFilters({ Sous_Statut: ["À appeler"], q: "" });

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => (d === "ASC" ? "DESC" : "ASC"));
    else { setSortBy(col); setSortDir("ASC"); }
  };

  const dernierAppel = rows[0]; // ou selon ta logique

  return {
    rows, total, loading,
    page, limit, sortBy, sortDir, filters,
    setPage, applyFilters, clearOneFilter, resetAll, handleSort, dernierAppel
  };
}
