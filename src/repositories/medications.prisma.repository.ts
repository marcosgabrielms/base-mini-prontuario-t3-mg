import { prisma } from "./prisma";
import type { MedicationsRepository } from "./medications.repository";
import type { CreateMedicationInput } from "../validation/medications.schemas";

export class PrismaMedicationsRepository implements MedicationsRepository {
  findByEncounter(encounterId: number) {
    return prisma.medicationRequest.findMany({ where: { encounterId }, orderBy: { id: "asc" } });
  }
  create(encounterId: number, input: CreateMedicationInput) {
    return prisma.medicationRequest.create({ data: { encounterId, ...input } });
  }
}
