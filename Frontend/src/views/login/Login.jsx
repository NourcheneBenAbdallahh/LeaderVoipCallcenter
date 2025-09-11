import React, { useState, useEffect } from "react";
import api from "api";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Input,
  Col,
  Row,
} from "reactstrap";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(() => !!localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    //Test
    // console.log("Vérification initiale du token dans Login.jsx:", token);
    if (token) {
     //Test
     //  console.log("Token valide, redirection vers /admin");
      navigate("/admin", { replace: true });
    } else {
      //Test
      // console.log("Aucun token, rester sur la page de connexion");
    }
  }, [navigate]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        login: login,
        mot_de_passe: password,
      });

      const token = res?.data?.token;
      if (!token) throw new Error("Jeton manquant dans la réponse");

      saveToken(token, remember);
      console.log("Connexion réussie, token sauvegardé :", token, "Remember:", remember);

      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Erreur lors de la connexion :", err);
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Erreur serveur");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Col lg="5" md="7">
      <Card className="bg-secondary shadow border-0 rounded-3 overflow-hidden">
        <CardHeader className="bg-transparent pb-4">
          <div className="text-center">
            <div
              className="icon icon-shape text-white rounded-circle shadow d-inline-flex align-items-center justify-content-center"
              style={{
                width: 56,
                height: 56,
                background: "linear-gradient(135deg, #1177EF 0%, #172B4D 100%)",
              }}
            >
              <i className="fas fa-headset" />
            </div>
            <h5 className="mt-3 mb-0" style={{ color: "#172B4D" }}>
              Connexion
            </h5>
            <small className="text-muted">Accédez à votre plateforme</small>
          </div>
        </CardHeader>

        <CardBody className="px-lg-5 py-lg-5">
          {error && (
            <div className="alert alert-danger mb-4" role="alert">
              <i className="ni ni-fat-remove mr-2" />
              {error}
            </div>
          )}

          <div>
            <FormGroup className="mb-3">
              <InputGroup className="input-group-alternative">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText style={{ color: "#1177EF" }}>
                    <i className="ni ni-single-02" />
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  placeholder="Login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                />
              </InputGroup>
            </FormGroup>

            <FormGroup className="mb-2">
              <InputGroup className="input-group-alternative">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText style={{ color: "#1177EF" }}>
                    <i className="ni ni-lock-circle-open" />
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  placeholder="Mot de passe"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <InputGroupAddon addonType="append">
                  <InputGroupText
                    role="button"
                    onClick={() => setShowPwd((s) => !s)}
                    title={showPwd ? "Masquer" : "Afficher"}
                    style={{ cursor: "pointer", color: "#1177EF" }}
                  >
                    <i className={`fas ${showPwd ? "fa-eye-slash" : "fa-eye"}`} />
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </FormGroup>

            <Row className="align-items-center mb-4">
              <div className="col-6">
                <label
                  className="d-inline-flex align-items-center"
                  style={{
                    color: "#172B4D",
                    cursor: loading ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loading}
                  />
                  <span>Se souvenir de moi</span>
                </label>
              </div>
            </Row>

            <div className="text-center">
              <Button
                onClick={handleLogin}
                className="my-3"
                block
                disabled={loading || !login.trim() || !password.trim()}
                style={{ backgroundColor: "#1177EF", borderColor: "#1177EF" }}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm mr-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Connexion…
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </div>

            <div className="text-center">
              <Button
                href="/select-region"
                className="my-3"
                block
                style={{ backgroundColor: "#1177EF", borderColor: "#1177EF" }}
              >
                Sélectionner la campagne
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
};

export default Login;

export function saveToken(token, remember = true) {
  console.log("Sauvegarde du token :", { token, remember });
  if (remember) {
    localStorage.setItem("token", token);
    sessionStorage.removeItem("token");
  } else {
    sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
  }
}

export function getToken() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  //Pour test Token

  //console.log("Récupération du token :", token);
  return token;
}

export function clearToken() {
 //Pour test Token
 //  console.log("Suppression du token");
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}