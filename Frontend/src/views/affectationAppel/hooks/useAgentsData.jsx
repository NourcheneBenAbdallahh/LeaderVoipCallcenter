import { useEffect, useState } from "react";
import axios from "axios";

export const useAgentsData = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get("http://localhost:5000/api/agents");

      const formatted = res.data.map((a) => ({
        id: a.IDAgent_Emmission,
        nom: `${a.Prenom} ${a.Nom}`.trim(),
      }));

      setAgents(formatted);
    } catch (err) {
      console.error("Erreur chargement agents :", err);
      setError("Impossible de charger les agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return { agents, loading, error, refresh: fetchAgents };
};
