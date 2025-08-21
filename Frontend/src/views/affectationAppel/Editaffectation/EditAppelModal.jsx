// src/views/affectationAppel/Editaffectation/EditAppelModal.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, FormGroup, Label, Input, Spinner, FormFeedback
} from "reactstrap";
import axios from "axios";

const API = "http://localhost:5000/api";
const FALLBACK_SOUS_STATUTS = ["RECEPTION","RAPPEL","PROMESSE","+75 ANS","PLUS 6H","RECLAMATION"];
const COMMENT_MAX = 1000;

export default function EditAppelModal({ isOpen, onClose, appel, onSaved }) {
  const IDAppel = appel?.IDAppel ?? null;

  const [statut, setStatut] = useState(appel?.Sous_Statut ?? "");
  const [commentaire, setCommentaire] = useState(appel?.Commentaire ?? "");
  const [saving, setSaving] = useState(false);

  const [allSousStatuts, setAllSousStatuts] = useState(FALLBACK_SOUS_STATUTS);
  const [ssLoading, setSsLoading] = useState(false);
  const [ssError, setSsError] = useState("");
  const fetchedOnce = useRef(false);

  // champs touchés (pour afficher les erreurs après interaction)
  const [touched, setTouched] = useState({ statut: false, commentaire: false });

  // reset à chaque ouverture
  useEffect(() => {
    if (!isOpen) return;
    setStatut(appel?.Sous_Statut ?? "");
    setCommentaire(appel?.Commentaire ?? "");
    setTouched({ statut: false, commentaire: false });
  }, [isOpen, appel]);

  // charger sous statuts
  useEffect(() => {
    if (!isOpen || fetchedOnce.current) return;
    const fetchSousStatuts = async () => {
      try {
        setSsLoading(true);
        setSsError("");
        const res = await axios.get(`${API}/sous_statutsedd`);
        let list = res.data;

        if (Array.isArray(list) && list.length && typeof list[0] === "object") {
          list = list
            .map((x) => x.name ?? x.Nom ?? x.Sous_Statut ?? x.code ?? x.libelle)
            .filter(Boolean);
        }

        // nettoyage minimal (trim + unicité + tri)
        const unique = Array.from(
          new Set(list.map(s => s?.toString().replace(/\s+/g," ").trim()))
        ).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

        if (unique.length) setAllSousStatuts(unique);
        fetchedOnce.current = true;
      } catch (e) {
        console.error("Erreur sous-statuts :", e);
        setSsError("Impossible de charger les sous-statuts (fallback utilisé).");
        setAllSousStatuts(FALLBACK_SOUS_STATUTS);
      } finally {
        setSsLoading(false);
      }
    };
    fetchSousStatuts();
  }, [isOpen]);

  const normalizeStatut = (s) => {
    if (!s) return s;
    const noTabs = s.replace(/\t|\r|\n/g, "");
    const trimmed = noTabs.trim().replace(/\s+/g, " ");
    return trimmed;
  };

  // validations
  const errors = useMemo(() => {
    const errs = {};
    if (!statut?.trim()) errs.statut = "Sous statut est obligatoire.";
    if (!commentaire?.trim()) errs.commentaire = "Le commentaire est obligatoire.";
    if (commentaire && commentaire.length > COMMENT_MAX) errs.commentaire = `Maximum ${COMMENT_MAX} caractères.`;
    return errs;
  }, [statut, commentaire]);

  const canSave = Boolean(IDAppel) && !saving && Object.keys(errors).length === 0;

  const handleSave = async () => {
    setTouched({ statut: true, commentaire: true });
    if (!canSave) return;

    const statutNorm = normalizeStatut(statut);
    const payload = {
      Sous_Statut: statutNorm,
      Commentaire: commentaire.trim()
    };

    try {
      setSaving(true);
      const res = await axios.put(`${API}/journalappels/${IDAppel}`, payload);
      if (res.status >= 200 && res.status < 300) {
        onSaved?.({ ...appel, ...payload });
        onClose?.();
        window.location.reload();
      } else {
        alert(`Échec (${res.status}) : ${JSON.stringify(res.data)}`);
      }
    } catch (error) {
      console.error("Erreur API complète:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: error.config
      });
      // feedback utilisateur court
      alert(error.response?.data?.error || "Échec de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} centered>
      <ModalHeader toggle={onClose}>
        {IDAppel ? `Modifier l’appel #${IDAppel}` : "Modifier l’appel"}
      </ModalHeader>

      <ModalBody>
        {IDAppel ? (
          <>
            <FormGroup>
              <Label className="mb-1">Sous statut <span className="text-danger">*</span></Label>
              {ssLoading ? (
                <div className="d-flex align-items-center">
                  <Spinner size="sm" className="mr-2" /> Chargement…
                </div>
              ) : (
                <>
                  <Input
                    type="select"
                    value={statut}
                    onChange={(e) => setStatut(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, statut: true }))}
                    invalid={touched.statut && Boolean(errors.statut)}
                    required
                  >
                    <option value="">— Sélectionner un sous statut —</option>
                    {allSousStatuts.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Input>
                  <FormFeedback>{errors.statut}</FormFeedback>
                  {ssError && <div className="text-danger small mt-2">{ssError}</div>}
                </>
              )}
            </FormGroup>

            <FormGroup className="mb-0">
              <Label className="mb-1">Commentaire <span className="text-danger">*</span></Label>
              <Input
                type="textarea"
                rows="3"
                maxLength={COMMENT_MAX}
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, commentaire: true }))}
                placeholder="Notes internes…"
                invalid={touched.commentaire && Boolean(errors.commentaire)}
                required
              />
              <FormFeedback>{errors.commentaire}</FormFeedback>
              <div className="text-muted small mt-1">
                {commentaire.length}/{COMMENT_MAX}
              </div>
            </FormGroup>
          </>
        ) : (
          <div className="text-muted">Aucun appel sélectionné.</div>
        )}
      </ModalBody>

      <ModalFooter className="d-flex justify-content-between">
        <Button color="secondary" onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button
          color="primary"
          onClick={handleSave}
          disabled={!canSave}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
