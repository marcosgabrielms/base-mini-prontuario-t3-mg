import { medicationsRepository } from "../repositories";
import type { MedicationsRepository } from "../repositories/medications.repository";
import { getEncounterById } from "./encounters.service";
import { ForbiddenError } from "../errors/HttpError";
import type { AuthenticatedUser } from "./auth.service";
import type { CreateMedicationInput } from "../validation/medications.schemas";

export function createMedicationsService(repository: MedicationsRepository) {
  return {
    async listMedicationsByEncounter(encounterId: number) {
      await getEncounterById(encounterId);
      return repository.findByEncounter(encounterId);
    },
    async createMedication(encounterId: number, input: CreateMedicationInput, user: AuthenticatedUser) {
      if (user.role !== "profissional") throw new ForbiddenError();
      const encounter = await getEncounterById(encounterId);
      if (encounter.professionalId !== user.id) {
        throw new ForbiddenError("Somente quem registrou o atendimento pode prescrever nele.");
      }
      return repository.create(encounterId, input);
    },
  };
}
export const { listMedicationsByEncounter, createMedication } = createMedicationsService(medicationsRepository);
