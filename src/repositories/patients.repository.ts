import { db } from "./sqlite";
import { ConflictError } from "../errors/HttpError";
import type { CreatePatientInput } from "../validation/patients.schemas";

export type Patient = CreatePatientInput & { id: number; photoUrl: string | null; active: boolean };
export interface PatientsRepository {
  findAll(): Promise<Patient[]>;
  findById(id: number): Promise<Patient | null>;
  findByNationalId(nationalId: string): Promise<Patient | null>;
  create(input: CreatePatientInput): Promise<Patient>;
  updatePhoto(id: number, photoUrl: string): Promise<void>;
}
type Row = { id: number; name: string; birth_date: string; national_id: string; photo_url: string | null; active: number };
const map = (row: Row): Patient => ({ id: row.id, name: row.name, birthDate: row.birth_date, nationalId: row.national_id, photoUrl: row.photo_url, active: row.active === 1 });
export class SqlitePatientsRepository implements PatientsRepository {
  async findAll() {
    return (db.prepare("SELECT id, name, birth_date, national_id, photo_url, active FROM patients ORDER BY name").all() as Row[]).map(map);
  }
  async findById(id: number) {
    const row = db.prepare("SELECT id, name, birth_date, national_id, photo_url, active FROM patients WHERE id = ?").get(id) as Row | undefined;
    return row ? map(row) : null;
  }
  async findByNationalId(nationalId: string) {
    const row = db.prepare("SELECT id, name, birth_date, national_id, photo_url, active FROM patients WHERE national_id = ?").get(nationalId) as Row | undefined;
    return row ? map(row) : null;
  }
  async create(input: CreatePatientInput) {
    try {
      const result = db.prepare("INSERT INTO patients (name, birth_date, national_id, active) VALUES (?, ?, ?, 1)").run(input.name, input.birthDate, input.nationalId);
      return (await this.findById(Number(result.lastInsertRowid)))!;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new ConflictError("Já existe um paciente com este CNS.");
      }
      throw error;
    }
  }
  async updatePhoto(id: number, photoUrl: string) {
    db.prepare("UPDATE patients SET photo_url = ? WHERE id = ?").run(photoUrl, id);
  }
}
