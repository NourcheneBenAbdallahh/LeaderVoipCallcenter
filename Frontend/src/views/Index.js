import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Input, Spinner, Badge, Button } from "reactstrap";
import api from "api";
import { Link } from "react-router-dom";
import Header from "components/Headers/Header";
import CallHistoryByPhoneModal from "./dernierAppels/CallHistoryModal";
import { FiPhone } from "react-icons/fi"; // Icône téléphone moderne

const formatPhoneNumber = (num) => {
  const digits = (num || "").replace(/\D/g, "");
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
};

const fmtDuree = (s) => {
  const n = Number(s) || 0;
  const m = Math.floor(n / 60);
  const sec = n % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};


const SousStatutPill = ({ value }) => (
  <Badge color="danger" className="ml-2">
    {value || "—"}
  </Badge>
);

const DEBOUNCE_MS = 400;
const ENDPOINT = "/api/appels/latestByPhone";

const Index = () => {
  const [numeroInput, setNumeroInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); 
  const [error, setError] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Normalisation: on retire tout sauf les chiffres
  const normalized = (numeroInput || "").replace(/\D/g, "").trim();
  const canSearch = normalized.length >= 5;

  const doSearch = async (raw) => {
    const digits = (raw || "").replace(/\D/g, "").trim();
    if (digits.length < 5) {
      setResult(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await api.post(ENDPOINT, { numero: digits });
      if (data?.appel) {
        setResult({
          appel: data.appel,
          client: data.client ?? null,
        });
      } else {
        setResult(null);
        setError("Aucun appel trouvé pour ce numéro.");
      }
    } catch (e) {
      console.error("DernierAppelClientParNumero error:", e);
      const status = e?.response?.status;
      if (status === 404) setError("Endpoint introuvable (404) — vérifie le chemin côté backend.");
      else if (status === 400) setError(e?.response?.data?.message || "Requête invalide (400).");
      else setError("Erreur serveur lors de la recherche.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Debounce input
  useEffect(() => {
    const t = setTimeout(() => doSearch(numeroInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [numeroInput]);

  const headerTitle = useMemo(() => {
    if (!result?.client) return "Dernier appel (par numéro)";
    const c = result.client;
    const nom = [c?.Prenom, c?.Nom].filter(Boolean).join(" ").trim() || `Client ${c?.IDClient}`;
    return `Dernier appel — ${nom}`;
  }, [result]);

  return (
    <>
      <Header title="Dernier Appels (par numéro)" />

      <Card className="shadow">
       <CardHeader>
  <div className="d-flex align-items-center justify-content-between">
    <h3 className="mb-0">{headerTitle}</h3>
    <div style={{ width: 320, position: "relative" }}>
      <FiPhone
        style={{
          position: "absolute",
          top: "50%",
          left: "10px",
          transform: "translateY(-50%)",
          color: "#1E90FF", // bleu moderne
          fontSize: "18px",
        }}
      />
      <Input
        type="text"
        inputMode="tel"
        placeholder="Numéro support"
        value={numeroInput}
        onChange={(e) => setNumeroInput(e.target.value)}
        style={{ paddingLeft: "35px" }} // espace réservé pour l’icône
      />
    </div>
  </div>
</CardHeader>

        <CardBody>
          {!canSearch && <div className="text-muted">Tape un numéro pour chercher…</div>}

          {canSearch && loading && (
            <div className="d-flex align-items-center">
              <Spinner size="sm" color="primary" className="mr-2" /> Recherche…
            </div>
          )}

          {canSearch && !loading && error && (
            <div className="text-danger">{error}</div>
          )}

          {canSearch && !loading && !error && result && (
            <div className="p-3 border rounded">
              {/* Bouton Historique */}
              <div className="mb-3">
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => setIsHistoryOpen(true)}
                  disabled={!normalized}
                >
                  Voir l'historique
                </Button>
              </div>

            
              <div className="mb-2">
                <strong>Client :</strong>{" "}
                {result.client ? (
                  <>
                    <Link
                      to={`/admin/clients?focus=${result.client.IDClient}`}
                      className="text-primary font-weight-bold"
                    >
                      {[result.client.Prenom, result.client.Nom]
                        .filter(Boolean)
                        .join(" ") }
                    </Link>{" "}
                   
                  </>
                ) : (
                  <em className="text-muted">inconnu (IDClient null)</em>
                )}
              </div>

              {/* Détails appel */}
              <div className="d-flex flex-wrap">
                <div className="mr-4 mb-2">
                  <strong>Date :</strong>{" "}
                  {result.appel.Date
                    ? new Date(result.appel.Date).toLocaleDateString()
                    : "—"}
                </div>
                <div className="mr-4 mb-2">
                  <strong>Heure :</strong> {result.appel.Heure || "—"}
                </div>
           
                <div className="mr-4 mb-2">
                  <strong>Durée :</strong> {fmtDuree(result.appel.Duree_Appel)}
                </div>
                <div className="mr-4 mb-2">
                  <strong>Numéro :</strong> {formatPhoneNumber(result.appel.Numero) || "—"}
                </div>
                <div className="mb-2">
                  <strong>Sous Statut :</strong>{" "}
                  <SousStatutPill value={result.appel.Sous_Statut} />
                </div>
              </div>

              <div className="d-flex flex-wrap">
                <div className="mr-4 mb-2">
                  <strong>Agent Émission :</strong>{" "}
                  {result.appel.Agent_Emmission ? (
                    <span className="text-info">
                      {result.appel.Agent_Emmission.Prenom} {result.appel.Agent_Emmission.Nom}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
                <div className="mr-4 mb-2">
                  <strong>Agent Réception :</strong>{" "}
                  {result.appel.Agent_Reception ? (
                    <span className="text-success">
                      {result.appel.Agent_Reception.Prenom} {result.appel.Agent_Reception.Nom}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              <div className="mt-2">
                <strong>Commentaire :</strong>
                <div className="border rounded p-2 mt-1" style={{ background: "#fafafa" }}>
                  {result.appel.Commentaire || "—"}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <CallHistoryByPhoneModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        numero={normalized}
        titleSuffix={formatPhoneNumber(normalized)}
      />
    </>
  );
};

export default Index;