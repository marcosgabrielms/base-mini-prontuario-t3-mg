/**
 * Rotas de Patient — a camada que só ROTEIA.
 * Método + caminho + esteira de middlewares + controller. Nada mais.
 */
import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import * as patientsController from "../controllers/patients.controller";
import { validate } from "../middlewares/validate";
import { uploadPhoto } from "../middlewares/upload";
import { createPatientSchema } from "../validation/patients.schemas";

export const patientsRouter = Router();
patientsRouter.use(requireAuth);

patientsRouter.get("/", patientsController.list);
patientsRouter.get("/:id", patientsController.getById);
patientsRouter.post("/", validate(createPatientSchema), patientsController.create);
patientsRouter.post("/:id/photo", uploadPhoto.single("photo"), patientsController.uploadPhoto);
