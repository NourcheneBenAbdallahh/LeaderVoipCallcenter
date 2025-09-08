// src/views/Index.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Container,
  Row,
  Col,
  Table,
  Badge,
  Spinner,
} from "reactstrap";
import Header from "components/Headers/Header.js";
import { Link, useNavigate } from "react-router-dom";
import useBadgeColor from "utils/useBadgeColor";
import api from "api";

const getInitials = (full) =>
  (full ?? "")
    .trim()
    .split(/\s+/)
    .map(s => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "•";


//badge 


// Format durée mm:ss
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
  const navigate = useNavigate();

  const { getBadgeColor } = useBadgeColor();


  // clients
  const [clients, setClients] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        //        const res = await api.get("http://localhost:5000/api/clients");

        const res = await api.get("/api/clients");
        const list = (Array.isArray(res.data) ? res.data : [])
          .map(c => ({
            id: c.IDClient ?? c.id,
            nom: `${c.Prenom ?? ""} ${c.Nom ?? ""}`.trim() || c.RaisonSociale || `Client ${c.IDClient ?? c.id ?? ""}`,
          }))
          .filter(c => c.id != null);
        if (alive) setClients(list);
      } catch (e) {
        console.error("Erreur chargement clients:", e);
        if (alive) setClients([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const clientNameById = Object.fromEntries((clients || []).map(c => [c.id, c.nom]));

  // 🔄 fetch des 10 derniers appels depuis le backend
  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      try {
        setLoading(true);

        // ✅ Récupère la région choisie
        const region = (localStorage.getItem("region") || "").toLowerCase();
        if (!region) {
          console.warn("Aucune région trouvée → redirection sélection région");
          navigate("/select-region", { replace: true });
          return;
        }

        // ✅ Envoie le header x-region
        const res = await fetch(`/api/recents?limit=10`, {
          method: "GET",
          headers: {
            "x-region": region,
            "Accept": "application/json",
          },
          signal: ac.signal,
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => `HTTP ${res.status}`);
          throw new Error(msg || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Erreur chargement derniers appels:", e);
          setRows([]);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, [navigate]);

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
                  <Table
                    className="align-items-center table-flush"
                    responsive
                    hover
                  >
                    <thead style={{ backgroundColor: "#e0f0ff" }}>
                      <tr>
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
                          <td>
                            {r.Date
                              ? new Date(r.Date).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>{r.Heure || "—"}</td>
                          <td>{typeBadge(r.Type_Appel)}</td>
                          <td>{fmtDuree(r.Duree_Appel)}</td>
                          <td>{r.Numero || "—"}</td>
             <td>
  {r.IDClient && clientNameById?.[r.IDClient] ? (
    <Link
      to={`/admin/clients?focus=${r.IDClient}`}
      className="d-flex align-items-center text-primary"
      title={clientNameById[r.IDClient]}
    >
      <span
        className="rounded-circle border bg-light d-inline-flex align-items-center justify-content-center mr-2"
        style={{ width: 22, height: 22, fontSize: 12 }}
      >
        {getInitials(clientNameById[r.IDClient])}
      </span>
      <span className="font-weight-bold">{clientNameById[r.IDClient]}</span>
    </Link>
  ) : (
    "—"
  )}
</td>                          <td>
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
