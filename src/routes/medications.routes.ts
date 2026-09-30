/**
 * Rotas de MedicationRequest, aninhadas em
 * /api/encounters/:encounterId/medications.
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import * as medicationsController from "../controllers/medications.controller";
import { validate } from "../middlewares/validate";
import { createMedicationSchema } from "../validation/medications.schemas";

export const medicationsRouter = Router({ mergeParams: true });
medicationsRouter.use(requireAuth);

medicationsRouter.get("/", requireRole("admin", "profissional"), medicationsController.listByEncounter);
medicationsRouter.post("/", requireRole("profissional"), validate(createMedicationSchema), medicationsController.create);
