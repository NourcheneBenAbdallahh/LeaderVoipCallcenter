import React, { useEffect, useState, useRef } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, Row, Col, FormGroup, Label, Input, Spinner, FormFeedback
} from "reactstrap";
import api from "api";

const API = "/api";

// petites initiales
const initialsOf = (prenom = "", nom = "") =>
  `${String(prenom).trim()[0] || ""}${String(nom).trim()[0] || ""}`.toUpperCase() || "•";

export default function AffecterModal({
  isOpen,
  onClose,
  clients = [],   // [{IDClient, Prenom, Nom}]
  onSuccess,
}) {
  /* ========== état agents (ÉMISSION uniquement) ========== */
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [errAgents, setErrAgents] = useState("");

  /* ========== form ========== */
  const [idAgent, setIdAgent] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [commentaire, setCommentaire] = useState("");

  const firstInvalidRef = useRef(null);

  /* reset à l’ouverture */
  useEffect(() => {
    if (!isOpen) return;
    setIdAgent("");
    setDate(new Date().toISOString().slice(0, 10));
    setCommentaire("");
    setErrAgents("");
    setTouched({ agent: false, date: false, commentaire: false });
  }, [isOpen]);

  /* charger la liste des AGENTS D'ÉMISSION uniquement */
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;

    (async () => {
      try {
        setLoadingAgents(true);
        setErrAgents("");

        const { data } = await api.get(`${API}/agents`); // <- émission
        const raw = Array.isArray(data?.agents)
          ? data.agents
          : Array.isArray(data) ? data : [];

        const list = raw
          .filter(x => x?.Etat_Compte == null || Number(x.Etat_Compte) === 1)
          .map(a => {
            const id =
              a.IDAgent_Emmission ??
              a.IDAgent ?? a.id ?? a.ID;
            const nomAff =
              `${a.Prenom ?? ""} ${a.Nom ?? ""}`.trim() ||
              a.Login ||
              `Agent ${id}`;
            return { id, nom: nomAff };
          })
          .filter(a => a.id != null);

        if (alive) setAgents(list);
      } catch (e) {
        console.error("Erreur chargement agents (émission):", e);
        if (alive) {
          setErrAgents("Impossible de charger la liste des agents.");
          setAgents([]);
        }
      } finally {
        if (alive) setLoadingAgents(false);
      }
    })();

    return () => { alive = false; };
  }, [isOpen]);

  /* validation */
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({ agent: false, date: false, commentaire: false });

  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().split("T")[0];

  const isAgentInvalid = !idAgent;
  const isDateInvalid = !date || new Date(date) < today;
  const isComInvalid = !commentaire || commentaire.trim().length < 3;

  const canSubmit =
    clients.length > 0 &&
    !isAgentInvalid && !isDateInvalid && !isComInvalid &&
    !submitting;

  const markAllTouched = () =>
    setTouched({ agent: true, date: true, commentaire: true });

  const handleSubmit = async () => {
    if (!canSubmit) {
      markAllTouched();
      setTimeout(() => {
        if (firstInvalidRef.current) firstInvalidRef.current.focus();
      }, 0);
      return;
    }

    try {
      setSubmitting(true);
      await Promise.all(
        clients.map(c =>
          api.post(`${API}/journalappels/affecter`, {
            idClient: Number(c.IDClient),
            idAgent: Number(idAgent),
            typeAgent: "emission",       // <— forcer émission
            date,                         // "YYYY-MM-DD"
            commentaire: commentaire.trim(),
          })
        )
      );

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (e) {
      console.error("Erreur affectation:", e);
      const msg = e?.response?.data?.message || "Échec de l’affectation. Vérifie les champs et réessaie.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* rendu */
  return (
    <Modal isOpen={isOpen} toggle={onClose} centered size="lg">
      <ModalHeader toggle={onClose}>Affecter (Émission)</ModalHeader>

      <ModalBody>
        {/* --- Clients sélectionnés --- */}
        <div className="mb-3 pb-2" style={{ borderBottom: "1px solid #eee" }}>
          {clients.length === 0 ? (
            <div className="text-danger d-flex align-items-center">
              <span className="mr-2">⚠</span> Aucun client sélectionné
            </div>
          ) : (
            <>
              <div className="text-muted mb-2">
                <strong>{clients.length}</strong> client{clients.length > 1 ? "s" : ""} sélectionné{clients.length > 1 ? "s" : ""}.
              </div>

              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e6e8eb",
                  borderRadius: 10,
                  padding: 10,
                  maxHeight: 160,
                  overflowY: "auto"
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 8
                  }}
                >
                  {clients.map((c) => (
                    <div
                      key={c.IDClient}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#fff",
                        border: "1px solid #e8eaef",
                        borderRadius: 8,
                        padding: "8px 10px",
                        minHeight: 44,
                        boxShadow: "0 1px 1px rgba(0,0,0,0.02)"
                      }}
                      title={`ID #${c.IDClient}`}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#eef2ff",
                          color: "#3b5bdb",
                          fontWeight: 700,
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: "1px solid #dde1f3"
                        }}
                      >
                        {initialsOf(c.Prenom, c.Nom)}
                      </div>
                      <div style={{ lineHeight: 1.2 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {(c.Prenom || "") + " " + (c.Nom || "")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* --- Agent (ÉMISSION) --- */}
        <Row>
          <Col md="6">
            <FormGroup>
              <Label>Agent (Émission) <span className="text-danger">*</span></Label>
              {loadingAgents ? (
                <div className="d-flex align-items-center"><Spinner size="sm" className="mr-2" /> Chargement…</div>
              ) : errAgents ? (
                <div className="text-danger">{errAgents}</div>
              ) : (
                <Input
                  type="select"
                  value={idAgent}
                  onChange={(e) => setIdAgent(e.target.value)}
                  invalid={touched.agent && isAgentInvalid}
                  innerRef={el => {
                    if (touched.agent && isAgentInvalid && !firstInvalidRef.current) firstInvalidRef.current = el;
                  }}
                >
                  <option value="">— Choisir un agent —</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nom} (#{a.id})
                    </option>
                  ))}
                </Input>
              )}
              <FormFeedback>Veuillez sélectionner un agent.</FormFeedback>
            </FormGroup>
          </Col>

          <Col md="6">
            <FormGroup>
              <Label>Date <span className="text-danger">*</span></Label>
              <Input
                type="date"
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                invalid={touched.date && isDateInvalid}
              />
              <FormFeedback>La date doit être aujourd’hui ou ultérieure.</FormFeedback>
            </FormGroup>
          </Col>
        </Row>

        {/* --- Commentaire --- */}
        <Row>
          <Col md="12">
            <FormGroup>
              <Label>Commentaire <span className="text-danger">*</span></Label>
              <Input
                type="textarea"
                rows="3"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                invalid={touched.commentaire && isComInvalid}
                placeholder="Notes internes…"
                maxLength={1000}
              />
              <FormFeedback>Merci de saisir un commentaire (min. 3 caractères).</FormFeedback>
            </FormGroup>
          </Col>
        </Row>
      </ModalBody>

      <ModalFooter>
        <small className="mr-auto text-muted">
          <span className="text-danger">*</span> champs obligatoires
        </small>
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
