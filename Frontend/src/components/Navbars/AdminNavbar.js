import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  DropdownToggle,
  Form,
  FormGroup,
  InputGroupAddon,
  InputGroupText,
  Input,
  InputGroup,
  Navbar,
  Nav,
  Container,
  Media,
} from "reactstrap";

import { jwtDecode } from "jwt-decode"; 

const AdminNavbar = (props) => {
  // Récupérer le nom de l'utilisateur depuis le token JWT
  let username = "Guest"; // valpar défaut
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token); // décoder le JWT
      username = decoded.nom + " " + decoded.prenom;
    } catch (err) {
      console.error("Token invalide");
    }
  }

  //logout
  const handleLogout = () => {
  localStorage.removeItem("token"); // suppr le token
  window.location.href = "/auth/login"; 
};

  return (
    <>
      <Navbar className="navbar-top navbar-dark" expand="md" id="navbar-main">
        <Container fluid>
          {/* Titre de la page */}
          <Link
            className="h4 mb-0 text-white text-uppercase d-none d-lg-inline-block"
            to="/"
          >
            {props.brandText}
          </Link>

          {/* Formulaire recherche
          <Form className="navbar-search navbar-search-dark form-inline mr-3 d-none d-md-flex ml-lg-auto">
            <FormGroup className="mb-0">
              <InputGroup className="input-group-alternative">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>
                    <i className="fas fa-search" />
                  </InputGroupText>
                </InputGroupAddon>
                <Input placeholder="Search" type="text" />
              </InputGroup>
            </FormGroup>
          </Form>
 */}
          {/* Menu utilisateur */}
          <Nav className="align-items-center d-none d-md-flex" navbar>
            <UncontrolledDropdown nav>
              <DropdownToggle className="pr-0" nav>
                <Media className="align-items-center">
               <span className="avatar avatar-sm rounded-circle bg-white text-primary d-flex justify-content-center align-items-center">
  <i className="fas fa-user" />
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

                {/* Exemples de liens du menu utilisateur 
                <DropdownItem to="/admin/user-profile" tag={Link}>
                  <i className="ni ni-single-02" />
                  <span>My profile</span>
                </DropdownItem>
                <DropdownItem to="/admin/user-profile" tag={Link}>
                  <i className="ni ni-settings-gear-65" />
                  <span>Settings</span>
                </DropdownItem>*/}
                <DropdownItem divider />
                <DropdownItem href="#pablo"  onClick={handleLogout}>
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
