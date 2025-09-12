// src/modules/dernierAppel/components/ClientPhoneSearch.jsx
import React, { useEffect, useState } from "react";
import {
  Card, CardBody, CardHeader, Input, Spinner, Badge, Button
} from "reactstrap";
import api from "api";
import { Link } from "react-router-dom";
import Header from "components/Headers/Header";
import CallHistoryByClientModal from "./CallHistoryByClientModal";
import { FiPhone } from "react-icons/fi"; // Icône téléphone moderne

const onlyDigits = (v) => (v || "").replace(/\D/g, "").trim();

const formatPhoneNumber = (num) => {
  const digits = onlyDigits(num);
  if (!digits) return "—";
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
};

const fmtDuree = (s) => {
  const n = Number(s) || 0;
  const m = Math.floor(n / 60);
  const sec = n % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const ENDPOINT = "/api/client/latestByPhone";
const DEBOUNCE_MS = 400;

const ClientPhoneSearch = () => {
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [fallbackPhone, setFallbackPhone] = useState("");

  const normalizedPhone = onlyDigits(phoneInput);
  const canSearch = normalizedPhone.length >= 5;

  const doSearch = async (phone) => {
    const digits = onlyDigits(phone);
    if (digits.length < 5) {
      setResults([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await api.post(ENDPOINT, { phone: digits });
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        setResults(data.data);
      } else {
        setResults([]);
        setError("Aucun client trouvé avec ce numéro.");
      }
    } catch (e) {
      console.error("ClientPhoneSearch error:", e);
      setError("Erreur lors de la recherche.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => doSearch(phoneInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [phoneInput]);

  const openHistoryClient = (client, appel) => {
    if (!client?.IDClient) {
      console.error("IDClient manquant:", client);
      return;
    }
    const raw =
      (appel && appel.Numero) ||
      client?.Mobile ||
      client?.Telephone ||
      phoneInput;
    const fb = onlyDigits(raw);
    setSelectedClient({ ...client, __fallbackPhone: fb });
    setFallbackPhone(fb);
    setIsHistoryOpen(true);
  };
const formatSeconds = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}h ${m}min ${s}s`;
};

  return (
    <>
      <Header title="Recherche par téléphone client" />

      <Card className="shadow">
       <CardHeader>
    <div className="d-flex align-items-center justify-content-between">
      <h3 className="mb-0">Recherche par téléphone client</h3>
      <div style={{ width: 320, position: "relative" }}>
        <FiPhone
          style={{
            position: "absolute",
            top: "50%",
            left: "10px",
            transform: "translateY(-50%)",
            color: "#1E90FF", // bleu
            fontSize: "18px",
          }}
        />
        <Input
          type="text"
          inputMode="tel"
          placeholder="Téléphone client"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          style={{ paddingLeft: "35px" }} // espace pour l’icône
        />
      </div>
    </div>
  </CardHeader>

        <CardBody>
          {!canSearch && <div className="text-muted">Entrez un numéro de téléphone client...</div>}

          {canSearch && loading && (
            <div className="d-flex align-items-center">
              <Spinner size="sm" color="primary" className="mr-2" /> Recherche…
            </div>
          )}

          {canSearch && !loading && error && (
            <div className="text-danger">{error}</div>
          )}

          {canSearch && !loading && results.length > 0 && (
            <div>
              <h5>Clients trouvés ({results.length})</h5>

              {results.map((result, index) => {
                const c = result.client || {};
                const a = result.appel || null;

                return (
                  <div key={index} className="p-3 border rounded mb-3">
                    <div className="d-flex justify-content-between align-items-start">
                      {/* Colonne gauche : infos client */}
                      <div className="flex-grow-1 pr-3">
                        <h5 className="mb-1">
                          <Link
                            to={`/admin/clients?focus=${c.IDClient}`}
                            className="text-primary font-weight-bold h4 text-uppercase"
                          >
                            {[c.Prenom, c.Nom].filter(Boolean).join(" ") }
                          </Link>
                        </h5>

                        {/* Adresse */}
                        <div className="mb-1">
                          <strong>Adresse:</strong>{" "}
                          {[
                            c.Adresse,
                            c.CodePostal,
                            c.Ville
                          ].filter(Boolean).join(" ") || "—"}
                        </div>

                        {/* Téléphones */}
                        <div className="mb-1">
                          <strong>Téléphone Client:</strong>{" "}
                          {formatPhoneNumber(c.Telephone)}
                          {c.Mobile && (
                            <span className="ml-3">
                              <strong>Mobile:</strong>{" "}
                              {formatPhoneNumber(c.Mobile)}
                            </span>
                          )}
                        </div>

                        {/* Email */}
                        <div className="mb-1">
                          <strong>Email:</strong> {c.Email || "—"}
                        </div>

                        {/* Type (si tu le renvoies plus tard, sinon laisse "—") */}
                        <div className="mb-1">
                          <strong>Type:</strong> {c.Type || "—"}
                        </div>

                        {/* Compteurs & cumul */}
                        <div className="d-flex flex-wrap mt-2">
                          <span className="mr-3">
                            <strong>Cumul_temps:</strong>{" "}
  {formatSeconds(Number(result.client.Cumul_temps || 0))}
                          </span>
                          <span className="mr-3">
                            <strong>NB_appel_Emis:</strong>{" "}
                            {Number(c.NB_appel_Emis || 0)}
                          </span>
                          <span className="mr-3">
                            <strong>NB_Appel_Recu:</strong>{" "}
                            {Number(c.NB_Appel_Recu || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Colonne droite : actions */}
                      <div className="ml-3">
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => openHistoryClient(c, a)}
                        >
                          Voir historique (client)
                        </Button>
                      </div>
                    </div>

                    {/* Dernier appel */}
                    {a ? (
                      <div className="mt-3 p-2 border rounded" style={{ background: "#f8f9fa" }}>
                        <h6>Dernier appel :</h6>

                        <div className="d-flex flex-wrap">
                          <div className="mr-3">
                            <strong>Date :</strong>{" "}
                            {a.Date ? new Date(a.Date).toLocaleDateString() : "—"}
                          </div>
                          <div className="mr-3">
                            <strong>Heure :</strong> {a.Heure || "—"}
                          </div>
                          <div className="mr-3">
                            <strong>Durée:</strong> {fmtDuree(a.Duree_Appel)}
                          </div>
                          <div className="mr-3">
                            <strong>Statut :</strong>{" "}
                            <Badge color="info">{a.Sous_Statut || "—"}</Badge>
                          </div>
                          <div className="mr-3">
                            <strong>Numéro Support :</strong>{" "}
                            {formatPhoneNumber(a.Numero) || "—"}
                          </div>
                        </div>

                        {/* Agents dernier appel */}
                        <div className="d-flex flex-wrap mt-2">
                          <div className="mr-4 mb-2">
                            <strong>Agent Émission:</strong>{" "}
                            {a.Agent_Emmission
                              ? `${a.Agent_Emmission.Prenom || ""} ${a.Agent_Emmission.Nom || ""}`.trim()
                              : "—"}
                          </div>
                          <div className="mr-4 mb-2">
                            <strong>Agent Réception:</strong>{" "}
                            {a.Agent_Reception
                              ? `${a.Agent_Reception.Prenom || ""} ${a.Agent_Reception.Nom || ""}`.trim()
                              : "—"}
                          </div>
                        </div>

                        <div className="mt-2">
                          <strong>Commentaire:</strong>{" "}
                          {a.Commentaire || "—"}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-muted">
                        Aucun appel trouvé pour ce client.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {isHistoryOpen && selectedClient && (
        <CallHistoryByClientModal
          isOpen={isHistoryOpen}
          onClose={() => {
            setIsHistoryOpen(false);
            setSelectedClient(null);
          }}
          clientId={selectedClient.IDClient}
          titleSuffix={`${selectedClient.Prenom || ""} ${selectedClient.Nom || ""}`.trim()}
          fallbackPhone={selectedClient.__fallbackPhone || fallbackPhone}
        />
      )}
    </>
  );
};

export default ClientPhoneSearch;
