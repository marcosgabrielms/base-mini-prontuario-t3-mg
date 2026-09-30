import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../validation/auth.schemas";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.get("/me", requireAuth, authController.me);
