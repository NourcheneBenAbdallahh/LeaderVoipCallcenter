// src/views/affectationAppel/Editaffectation/EditAppelModal.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, FormGroup, Label, Input, Spinner
} from "reactstrap";
import axios from "axios";

const API = "http://localhost:5000/api";
const FALLBACK_SOUS_STATUTS = [
  "RECEPTION","RAPPEL","PROMESSE","+75 ANS","PLUS 6H","RECLAMATION"
];

export default function EditAppelModal({ isOpen, onClose, appel, onSaved }) {
  const IDAppel = appel?.IDAppel ?? null;

  const [statut, setStatut] = useState(appel?.Sous_Statut ?? "");
  const [commentaire, setCommentaire] = useState(appel?.Commentaire ?? "");
  const [saving, setSaving] = useState(false);

  // gestion sous statuts
  const [allSousStatuts, setAllSousStatuts] = useState(FALLBACK_SOUS_STATUTS);
  const [ssLoading, setSsLoading] = useState(false);
  const [ssError, setSsError] = useState("");
  const fetchedOnce = useRef(false);

  // reset champs à chaque ouverture
  useEffect(() => {
    if (!isOpen) return;
    setStatut(appel?.Sous_Statut ?? "");
    setCommentaire(appel?.Commentaire ?? "");
  }, [isOpen, appel]);

  // charger les sous statuts (comme FiltersDrawer)
  useEffect(() => {
    if (!isOpen) return;
    if (fetchedOnce.current) return;

    const fetchSousStatuts = async () => {
      try {
        setSsLoading(true);
        setSsError("");

        const res = await axios.get(`${API}/sous_statuts_sauf_aapellername`);
        let list = res.data;

        if (Array.isArray(list) && list.length && typeof list[0] === "object") {
          list = list
            .map((x) => x.name ?? x.Nom ?? x.Sous_Statut ?? x.code ?? x.libelle)
            .filter(Boolean);
        }

        const unique = Array.from(new Set(list)).sort((a, b) =>
          a.toString().localeCompare(b.toString(), "fr", { sensitivity: "base" })
        );

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

  const canSave = Boolean(IDAppel) && Boolean(statut) && !saving;

  const handleSave = async () => {
    if (!IDAppel) return; 
    try {
      setSaving(true);
      await axios.put(`${API}/journalappels/${IDAppel}`, {
        Sous_Statut: statut,        
        Commentaire: commentaire ?? ""
      });
      onSaved?.({ ...appel, Sous_Statut: statut, Commentaire: commentaire ?? "" });
      onClose?.();
    } catch (e) {
      console.error(e);
      alert("Échec de la mise à jour.");
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
              <Label>Sous statut</Label>
              {ssLoading ? (
                <div className="d-flex align-items-center">
                  <Spinner size="sm" className="mr-2" /> Chargement…
                </div>
              ) : (
                <Input
                  type="select"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                >
                  <option value="">— Choisir —</option>
                  {allSousStatuts.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Input>
              )}
              {ssError && <div className="text-danger small mt-1">{ssError}</div>}
            </FormGroup>

            <FormGroup>
              <Label>Commentaire</Label>
              <Input
                type="textarea"
                rows="3"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Saisir un commentaire…"
              />
            </FormGroup>
          </>
        ) : (
          <div className="text-muted">Aucun appel sélectionné.</div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button color="secondary" onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button color="primary" onClick={handleSave} disabled={!canSave}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
