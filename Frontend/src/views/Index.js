// src/views/Index.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, CardBody, CardHeader, Container, Row, Col, Table, Badge, Spinner,
} from "reactstrap";
import Header from "components/Headers/Header.js";
import { Link } from "react-router-dom";

const getBadgeColor = (statut) => {
  switch (statut) {
    case "PROMESSE": return "warning";
    case "RECEPTION": return "primary";
    case "RAPPEL": return "danger";
    case "PLUS 2H":
    case "PLUS 6H": return "secondary";
    case "NRP":
    case "REFUS":
    case "CLIENT FROID": return "dark";
    case "RECLAMATION":
    case "LIGNE SUSPENDU": return "info";
    case "+75 ANS":
    case "+65 ANS": return "success";
    case "TCHATCHE":
    case "ATTENTE PAYEMENT FACTURE":
    case "A RAPPELER": return "info";
    case "DU 10 AU 20":
    case "DU 1ER AU 10": return "light";
    case "JUSTE 1H":
    case "4H": return "secondary";
    case "À APPELER": return "primary";
    case "TRAITE": return "success";
    case "NE REPOND PAS": return "dark";
    case "À appeler": return "danger";

    default: return "secondary";
  }
};

// helper durée (mm:ss)
const fmtDuree = (s) => {
  const n = Number(s) || 0;
  const m = Math.floor(n / 60);
  const sec = n % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const typeBadge = (t) => {
  if (t === 1 || t === "1") return <Badge color="info">1</Badge>;
  if (t === 2 || t === "2") return <Badge color="success">2</Badge>;
  if (t === 0 || t === "0") return <Badge color="secondary">0</Badge>;
  return <Badge color="light">{t}</Badge>;
};

export default function Index() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 fetch des 10 derniers appels depuis le backend
  useEffect(() => {
    const ac = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/recents?limit=10`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Erreur chargement derniers appels:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => ac.abort();
  }, []);

  // on garde memo au cas où
  const derniers10 = useMemo(() => rows.slice(0, 10), [rows]);

  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        <Row>
          <Col xl="12">
            <Card className="shadow">
              <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Derniers appels (aperçu)</h3>
                <Link className="btn btn-sm btn-primary" to="/admin/aapeler">
                  Ouvrir le journal
                </Link>
              </CardHeader>
              <CardBody className="pt-0">
                {loading ? (
                  <div className="text-center my-4">
                    <Spinner color="primary" /> Chargement…
                  </div>
                ) : (
                  <Table className="align-items-center table-flush" responsive hover>
                    <thead style={{ backgroundColor: "#e0f0ff" }}>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Heure</th>
                        <th>Type</th>
                        <th>Durée</th>
                        <th>Numéro</th>
                        <th>Client</th>
                        <th>Sous statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {derniers10.map((r) => (
                        <tr key={r.IDAppel}>
                          <td>{r.IDAppel}</td>
                          <td>{r.Date ? new Date(r.Date).toLocaleDateString() : "—"}</td>
                          <td>{r.Heure || "—"}</td>
                          <td>{typeBadge(r.Type_Appel)}</td>
                          <td>{fmtDuree(r.Duree_Appel)}</td>
                          <td>{r.Numero || "—"}</td>
                          <td>{r.IDClient ?? "—"}</td>
                          <td>
                            <Badge color={getBadgeColor(r.Sous_Statut)}>
                              {r.Sous_Statut || "—"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {derniers10.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-4">
                            Aucun appel à afficher.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
