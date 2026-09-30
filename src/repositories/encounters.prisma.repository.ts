import { prisma } from "./prisma";
import type { EncountersRepository } from "./encounters.repository";
import type { CreateEncounterInput } from "../validation/encounters.schemas";

export class PrismaEncountersRepository implements EncountersRepository {
  findByPatient(patientId: number) {
    return prisma.encounter.findMany({ where: { patientId }, orderBy: { startedAt: "desc" } });
  }
  findById(id: number) { return prisma.encounter.findUnique({ where: { id } }); }
  create(patientId: number, input: CreateEncounterInput, professionalId: number) {
    return prisma.encounter.create({ data: { patientId, ...input, professionalId } });
  }
}
