import { NotFoundError } from "../errors/HttpError";
import { encountersRepository } from "../repositories";
import type { Encounter, EncountersRepository } from "../repositories/encounters.repository";
import type { AuthenticatedUser } from "./auth.service";
import { getPatientById } from "./patients.service";
import type { CreateEncounterInput } from "../validation/encounters.schemas";

export function createEncountersService(repository: EncountersRepository) {
  const publicEncounter = ({ professionalId: _owner, ...encounter }: Encounter) => encounter;
  return {
    async listEncountersByPatient(patientId: number) {
      await getPatientById(patientId);
      return (await repository.findByPatient(patientId)).map(publicEncounter);
    },
    async getEncounterById(id: number) {
      const encounter = await repository.findById(id);
      if (!encounter) throw new NotFoundError("Atendimento não encontrado.");
      return encounter;
    },
    async createEncounter(patientId: number, input: CreateEncounterInput, user: AuthenticatedUser) {
      await getPatientById(patientId);
      return publicEncounter(await repository.create(patientId, input, user.id));
    },
  };
}
export const { listEncountersByPatient, getEncounterById, createEncounter } = createEncountersService(encountersRepository);
