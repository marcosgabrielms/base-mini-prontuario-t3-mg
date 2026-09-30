import type { PatientsRepository } from "./patients.repository";
import type { EncountersRepository } from "./encounters.repository";
import type { MedicationsRepository } from "./medications.repository";
import { PrismaPatientsRepository } from "./patients.prisma.repository";
import { PrismaEncountersRepository } from "./encounters.prisma.repository";
import { PrismaMedicationsRepository } from "./medications.prisma.repository";

// Ponto único de seleção dos adapters; consumidores enxergam os ports.
export const patientsRepository: PatientsRepository = new PrismaPatientsRepository();
export const encountersRepository: EncountersRepository = new PrismaEncountersRepository();
export const medicationsRepository: MedicationsRepository = new PrismaMedicationsRepository();
