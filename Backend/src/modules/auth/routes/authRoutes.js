import { Router } from "express";
import { login, me } from "../controllers/authControllers.js";
import { authRequired } from "../middleware/middleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", authRequired, me);

export default router;
