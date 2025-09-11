import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  DropdownToggle,
  Navbar,
  Nav,
  Container,
  Media,
} from "reactstrap";
import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

function getStoredToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
}

const AdminNavbar = (props) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getStoredToken());

  // Se mettre à jour si le token change dans un autre onglet
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setToken(getStoredToken());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Décodage sécurisé du token
  const username = useMemo(() => {
    if (!token) return "Guest";
    try {
      const decoded = jwtDecode(token);
      const nom = (decoded?.nom || "").toString().trim();
      const prenom = (decoded?.prenom || "").toString().trim();
      const full = [nom, prenom].filter(Boolean).join(" ").trim();
      return full || "Utilisateur";
    } catch {
      return "Utilisateur";
    }
  }, [token]);

  const handleLogout = () => {
    // on nettoie partout
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
    navigate("/select-region", { replace: true });
  };

  // Petites initiales pour l’avatar
  const initials = useMemo(() => {
    const parts = username.trim().split(/\s+/);
    return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase() || "•";
  }, [username]);

  return (
    <>
      <Navbar className="navbar-top navbar-dark" expand="md" id="navbar-main">
        <Container fluid>
          <Link
            className="h4 mb-0 text-white text-uppercase d-none d-lg-inline-block"
            to="/"
          >
            {props.brandText}
          </Link>

          <Nav className="align-items-center d-none d-md-flex" navbar>
            <UncontrolledDropdown nav>
              <DropdownToggle className="pr-0" nav>
                <Media className="align-items-center">
                  <span
                    className="avatar avatar-sm rounded-circle bg-white text-primary d-flex justify-content-center align-items-center"
                    style={{ width: 36, height: 36, fontWeight: 700 }}
                  >
                    {initials}
                  </span>
                  <Media className="ml-2 d-none d-lg-block">
                    <span className="mb-0 text-sm font-weight-bold">{username}</span>
                  </Media>
                </Media>
              </DropdownToggle>

              <DropdownMenu className="dropdown-menu-arrow" right>
                <DropdownItem className="noti-title" header tag="div">
                  <h6 className="text-overflow m-0">Bienvenue!</h6>
                </DropdownItem>

                <DropdownItem divider />
                <DropdownItem onClick={handleLogout}>
                  <i className="ni ni-user-run" />
                  <span>Logout</span>
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
};

export default AdminNavbar;
