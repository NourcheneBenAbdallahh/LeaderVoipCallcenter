// src/views/clients/AffecterModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, Row, Col, FormGroup, Label, Input, Spinner
} from "reactstrap";
import api from "api";
//const API = "http://localhost:5000/api";

const API = "/api";

export default function AffecterModal({
  isOpen,
  onClose,
  client,            // objet client ou au moins { IDClient }
  onSuccess,         // callback après succès (ex: refetch, toast...)
}) {
  // état des agents
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [errAgents, setErrAgents] = useState("");

  // form local
  const [idAgent, setIdAgent] = useState("");
  const [typeAgent, setTypeAgent] = useState("emission"); // "emission" | "reception"
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // yyyy-mm-dd
  const [commentaire, setCommentaire] = useState("");

  const idClient = useMemo(() => client?.IDClient ?? "", [client]);

  // (re)initialise le form quand on ouvre
  useEffect(() => {
    if (isOpen) {
      setIdAgent("");
      setTypeAgent("emission");
      setDate(new Date().toISOString().slice(0, 10));
      setCommentaire("");
      setErrAgents("");
    }
  }, [isOpen]);

  // charge la liste des agents à l'ouverture et quand le type change
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;

    (async () => {
      try {
        setLoadingAgents(true);
        setErrAgents("");

        const endpoint =
          typeAgent === "reception" ? `${API}/agentsReception` : `${API}/agents`;

        const { data } = await api.get(endpoint);

        const raw = Array.isArray(data?.agents)
          ? data.agents
          : (Array.isArray(data) ? data : null);

        if (!raw) {
          throw new Error(
            `Format API inattendu pour ${endpoint} : attendu {agents:[...]} ou un tableau`
          );
        }

        // Garde uniquement les actifs
        const activeOnly = raw.filter(x => Number(x?.Etat_Compte) === 1);

        const list = activeOnly
          .map(a => {
            const id =
              a.IDAgent_Emmission ??
              a.IDAgent_Reception ??
              a.IDAgent ??
              a.id;

            const nom =
              `${a.Prenom ?? ""} ${a.Nom ?? ""}`.trim() ||
              a.Login ||
              `Agent ${id ?? ""}`;

            return { id, nom };
          })
          .filter(a => a.id != null);

        if (alive) setAgents(list);
      } catch (e) {
        console.error("Erreur chargement agents:", e);
        if (alive) {
          setErrAgents("Impossible de charger la liste des agents.");
          setAgents([]);
        }
      } finally {
        if (alive) setLoadingAgents(false);
      }
    })();

    return () => { alive = false; };
  }, [isOpen, typeAgent]);

  const [submitting, setSubmitting] = useState(false);
  const canSubmit = idClient && idAgent && typeAgent && date && !submitting;

  // date min = aujourd'hui
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Validation de la date (>= aujourd'hui)
    const selectedDate = new Date(date);
    if (selectedDate < today) {
      alert("La date sélectionnée doit être aujourd'hui ou une date future.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`${API}/journalappels/affecter`, {
        idClient: Number(idClient),
        idAgent: Number(idAgent),
        typeAgent, // "emission" ou "reception"
        date,      // "YYYY-MM-DD"
        commentaire: commentaire?.trim() || null,
      });
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (e) {
      console.error("Erreur affectation:", e);
      alert("Échec de l’affectation. Vérifie les champs et réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} centered size="lg">
      <ModalHeader toggle={onClose}>Affecter un appel</ModalHeader>
      <ModalBody>
        <Row>
          <Col md="6">
            <FormGroup>
              <Label>ID Client</Label>
              <Input value={idClient} readOnly />
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label>Type Agent</Label>
              <Input
                type="select"
                value={typeAgent}
                onChange={(e) => {
                  setTypeAgent(e.target.value);
                  setIdAgent(""); // reset l’agent si on change de type
                }}
              >
                <option value="emission">Émission</option>
                <option value="reception">Réception</option>
              </Input>
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md="6">
            <FormGroup>
              <Label>
                Agent ({typeAgent === "reception" ? "Réception" : "Émission"})
              </Label>
              {loadingAgents ? (
                <div className="d-flex align-items-center gap-2">
                  <Spinner size="sm" /> Chargement des agents…
                </div>
              ) : errAgents ? (
                <div className="text-danger">{errAgents}</div>
              ) : (
                <Input
                  type="select"
                  value={idAgent}
                  onChange={(e) => setIdAgent(e.target.value)}
                >
                  <option value="">— Choisir un agent —</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nom} (#{a.id})
                    </option>
                  ))}
                </Input>
              )}
              {!loadingAgents && !errAgents && agents.length === 0 && (
                <div className="text-muted mt-1">Aucun agent actif disponible.</div>
              )}
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={todayStr} 
              />
            </FormGroup>
          </Col>
        </Row>

        <FormGroup>
          <Label>Commentaire</Label>
          <Input
            type="textarea"
            rows="3"
            maxLength={1000}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Notes internes…"
            required
          />
        </FormGroup>
      </ModalBody>

      <ModalFooter>
        <Button color="secondary" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button color="success" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? "Affectation…" : "Affecter"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
