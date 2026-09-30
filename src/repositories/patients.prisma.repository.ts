import { Prisma, type Patient as PatientRow } from "@prisma/client";
import { prisma } from "./prisma";
import type { Patient, PatientsRepository } from "./patients.repository";
import type { CreatePatientInput } from "../validation/patients.schemas";
import { ConflictError } from "../errors/HttpError";

const map = (row: PatientRow): Patient => ({ ...row, active: row.active === 1 });
export class PrismaPatientsRepository implements PatientsRepository {
  async findAll() { return (await prisma.patient.findMany({ orderBy: { name: "asc" } })).map(map); }
  async findById(id: number) {
    const row = await prisma.patient.findUnique({ where: { id } });
    return row ? map(row) : null;
  }
  async findByNationalId(nationalId: string) {
    const row = await prisma.patient.findUnique({ where: { nationalId } });
    return row ? map(row) : null;
  }
  async create(input: CreatePatientInput) {
    try { return map(await prisma.patient.create({ data: { ...input, active: 1 } })); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Já existe um paciente com este CNS.");
      }
      throw error;
    }
  }
  async updatePhoto(id: number, photoUrl: string) {
    await prisma.patient.update({ where: { id }, data: { photoUrl } });
  }
}
