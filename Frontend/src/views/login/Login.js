import React, { useState } from "react";
import api from "api";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Input,
  Col,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { Alert, Spinner, Row } from "reactstrap";

const Login = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");


const [showPwd, setShowPwd] = useState(false);
const [remember, setRemember] = useState(true);
const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // éviter le rechargement de la page
    setError("");

    try {
      //      const res = await api.post("http://localhost:5000/auth/login", {

      const res = await api.post("/auth/login", {
        login: login,       // exactement "login"
  mot_de_passe: password, // exactement "password"
      });

      // stocker le token
      localStorage.setItem("token", res.data.token);

      // rediriger vers l'admin
      navigate("/admin");

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Erreur serveur");
      }
    }
  };

  return (
<Col lg="5" md="7">
  <Card className="bg-secondary shadow border-0 rounded-3 overflow-hidden">
    <CardHeader className="bg-transparent pb-4">
      <div className="text-center">
        {/* pastille avec ton dégradé #1177EF → #172B4D */}
        <div
          className="icon icon-shape text-white rounded-circle shadow d-inline-flex align-items-center justify-content-center"
          style={{
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, #1177EF 0%, #172B4D 100%)"
          }}
        >
<i className="fas fa-headset" />        </div>
        <h5 className="mt-3 mb-0" style={{ color: "#172B4D" }}>Connexion</h5>
        <small className="text-muted">Accédez à votre platforme</small>
      </div>
    </CardHeader>

    <CardBody className="px-lg-5 py-lg-5">
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <i className="ni ni-fat-remove mr-2" />
          {error}
        </div>
      )}

      <Form onSubmit={handleLogin}>
        {/* Login */}
        <FormGroup className="mb-3">
          <label className="form-control-label" style={{ color: "#172B4D" }}>Login</label>
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
            />
          </InputGroup>
        </FormGroup>

        {/* Mot de passe */}
        <FormGroup className="mb-2">
          <label className="form-control-label" style={{ color: "#172B4D" }}>Mot de passe</label>
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
            />
            <InputGroupAddon addonType="append">
              <InputGroupText
                role="button"
                onClick={() => setShowPwd(s => !s)}
                title={showPwd ? "Masquer" : "Afficher"}
                style={{ cursor: "pointer", color: "#1177EF" }}
              >
                <i className={`fas ${showPwd ? "fa-eye-slash" : "fa-eye"}`} />
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </FormGroup>

        {/* Options */}
        <Row className="align-items-center mb-4">
          <div className="col-6">
 <label className="d-inline-flex align-items-center" style={{ color: "#172B4D", cursor: "pointer", whiteSpace: "nowrap" }}>
  <input
    type="checkbox"
    className="mr-2"
    checked={remember}
    onChange={(e) => setRemember(e.target.checked)}
  />
  <span>Se souvenir de moi</span>
</label>


          </div>
        
        </Row>

        {/* Bouton */}
        <div className="text-center">
          <Button
            type="submit"
            className="my-3"
            block
            disabled={loading || !login.trim() || !password.trim()}
            style={{ backgroundColor: "#1177EF", borderColor: "#1177EF" }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
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
            Selectionner la region
         </Button>
        </div>

      </Form>
    </CardBody>
  </Card>
</Col>


  );
};

export default Login;
