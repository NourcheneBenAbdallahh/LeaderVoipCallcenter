
import Index from "views/Index.js";
import Profile from "views/examples/Profile.js";
import Register from "views/examples/Register.js";
import Tables from "views/examples/Tables.js";
import Clients from "views/clients/client";
import Agents from "views/agents/agent";
import JournalAppels from "views/journalAppel/JournalAppels";
import AgentsReception from "views/agentsreceptions/AgentsReception";
import Login from "views/login/Login";

var routes = [
  {
    path: "/index",
    name: "Dashboard",
    icon: "ni ni-tv-2 text-primary",
    component: <Index />,
    layout: "/admin",
  },
  {
    path: "/user-profile",
    name: "User Profile",
    icon: "ni ni-single-02 text-yellow",
    component: <Profile />,
    layout: "/admin",
  },
  {
    path: "/tables",
    name: "Tables",
    icon: "ni ni-bullet-list-67 text-red",
    component: <Tables />,
    layout: "/admin",
  },
    {
    path: "/clients",
    name: "Clients",
    icon: "ni ni-single-02 text-orange",
    component: <Clients />,
    layout: "/admin",
  },    {
    path: "/agents",
    name: "Agents Emmission",
  icon: "ni ni-send text-blue", 
    component: <Agents />,
    layout: "/admin",
  },
  {
    path: "/agentsReception",
    name: "Agents Reception",
  icon: "ni ni-email-83 text-danger", 
    component: <AgentsReception />,
    layout: "/admin",
  },
  {
    path: "/JournalAppels",
    name: "Journal Appels",
icon: "ni ni-mobile-button text-success",
    component: <JournalAppels />,
    layout: "/admin",
  },
  /*{
    path: "/login",
    name: "Login",
    icon: "ni ni-key-25 text-info",
    component: <Login />,
    layout: "/auth",
  },
  {
    path: "/register",
    name: "Register",
    icon: "ni ni-circle-08 text-pink",
    component: <Register />,
    layout: "/auth",
  },*/
];
export default routes;
