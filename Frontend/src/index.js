import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-modern-drawer/dist/index.css';

import "assets/plugins/nucleo/css/nucleo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "assets/scss/argon-dashboard-react.scss";

import AdminLayout from "layouts/Admin.js";
import AuthLayout from "layouts/Auth.js";
import AgentsReception from "views/agentsreceptions/AgentsReception";
import Agents from "views/agents/agent";
import Clients from "views/clients/client";

import RequireAuth from "views/login/RequireAuth";
import URLMask from "utils/URLMask";
import RequireRegion from "views/login/RequireRegion";
import RegionSelect from "views/Region/RegionSelect";

const Start = () => {
  const hasRegion = !!localStorage.getItem("region");
  return <Navigate to={hasRegion ? "/select-region" : "/select-region"} replace />;
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    {/* URL visible figée
    /leaderVoipSupport */}
    <URLMask fixed="/" />

    <Routes>
      {/* Sélection de région */}
      <Route path="/select-region" element={<RegionSelect />} />

      {/* Publique (nécessite région) */}
      <Route
        path="/auth/*"
        element={
          <RequireRegion>
            <AuthLayout />
          </RequireRegion>
        }
      />

      {/* Protégées (auth + région) */}
      <Route
        path="/admin/*"
        element={
          <RequireRegion>
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          </RequireRegion>
        }
      />
      <Route
        path="/agents-reception"
        element={
          <RequireRegion>
            <RequireAuth>
              <AgentsReception />
            </RequireAuth>
          </RequireRegion>
        }
      />
      <Route
        path="/agents"
        element={
          <RequireRegion>
            <RequireAuth>
              <Agents />
            </RequireAuth>
          </RequireRegion>
        }
      />
      <Route
        path="/clients"
        element={
          <RequireRegion>
            <RequireAuth>
              <Clients />
            </RequireAuth>
          </RequireRegion>
        }
      />

      {/* Démarrage & fallback */}
      <Route path="/" element={<Start />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
