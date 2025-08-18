// authRoutes.js
import Login from "views/login/Login";
import Register from "views/examples/Register.js";

const authRoutes = [
  { path: "/login", name: "Login", icon: "ni ni-key-25 text-info", component: <Login />, layout: "/auth" },
  { path: "/register", name: "Register", icon: "ni ni-circle-08 text-pink", component: <Register />, layout: "/auth" },
];

export default authRoutes;
