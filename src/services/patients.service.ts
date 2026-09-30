import { ConflictError, NotFoundError } from "../errors/HttpError";
import { patientsRepository } from "../repositories";
import type { PatientsRepository } from "../repositories/patients.repository";
import type { CreatePatientInput } from "../validation/patients.schemas";

export function createPatientsService(repository: PatientsRepository) {
  async function getPatientById(id: number) {
    const patient = await repository.findById(id);
    if (!patient) throw new NotFoundError("Paciente não encontrado.");
    return patient;
  }
  return {
    listPatients: () => repository.findAll(),
    getPatientById,
    async createPatient(input: CreatePatientInput) {
      if (await repository.findByNationalId(input.nationalId)) {
        throw new ConflictError("Já existe um paciente com este CNS.");
      }
      return repository.create(input);
    },
    async setPatientPhoto(id: number, photoUrl: string) {
      await getPatientById(id);
      await repository.updatePhoto(id, photoUrl);
      return getPatientById(id);
    },
  };
}
export const { listPatients, getPatientById, createPatient, setPatientPhoto } = createPatientsService(patientsRepository);
