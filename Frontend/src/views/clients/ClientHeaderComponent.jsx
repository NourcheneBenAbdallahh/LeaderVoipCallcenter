import { Row, Col, Input, Button } from "reactstrap";

const Header = ({ totalClients, totalAppelsEmis, totalAppelsRecus }) => (
  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-8">
    <Container>
      <h1 className="text-3xl font-bold">Tableau de bord des clients</h1>
      <div className="mt-4 flex space-x-6">
        <div>
          <h3 className="text-lg">Total Clients</h3>
          <p className="text-2xl font-semibold">{totalClients}</p>
        </div>
        <div>
          <h3 className="text-lg">Appels Émis</h3>
          <p className="text-2xl font-semibold">{totalAppelsEmis}</p>
        </div>
        <div>
          <h3 className="text-lg">Appels Reçus</h3>
          <p className="text-2xl font-semibold">{totalAppelsRecus}</p>
        </div>
      </div>
    </Container>
  </div>
);export default ClientHeader;
