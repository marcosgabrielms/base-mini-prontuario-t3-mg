import { db } from "./sqlite";
import type { CreateEncounterInput } from "../validation/encounters.schemas";

export type Encounter = { id: number; patientId: number; startedAt: string; chiefComplaint: string; notes: string | null; professionalId: number | null };
export interface EncountersRepository {
  findByPatient(patientId: number): Promise<Encounter[]>;
  findById(id: number): Promise<Encounter | null>;
  create(patientId: number, input: CreateEncounterInput, professionalId: number): Promise<Encounter>;
}
type Row = { id: number; patient_id: number; started_at: string; chief_complaint: string; notes: string | null; professional_id: number | null };
const map = (row: Row): Encounter => ({ id: row.id, patientId: row.patient_id, startedAt: row.started_at, chiefComplaint: row.chief_complaint, notes: row.notes, professionalId: row.professional_id });
export class SqliteEncountersRepository implements EncountersRepository {
  async findByPatient(patientId: number) {
    return (db.prepare("SELECT id, patient_id, started_at, chief_complaint, notes, professional_id FROM encounters WHERE patient_id = ? ORDER BY started_at DESC").all(patientId) as Row[]).map(map);
  }
  async findById(id: number) {
    const row = db.prepare("SELECT id, patient_id, started_at, chief_complaint, notes, professional_id FROM encounters WHERE id = ?").get(id) as Row | undefined;
    return row ? map(row) : null;
  }
  async create(patientId: number, input: CreateEncounterInput, professionalId: number) {
    const result = db.prepare("INSERT INTO encounters (patient_id, started_at, chief_complaint, notes, professional_id) VALUES (?, ?, ?, ?, ?)").run(patientId, input.startedAt, input.chiefComplaint, input.notes ?? null, professionalId);
    return (await this.findById(Number(result.lastInsertRowid)))!;
  }
}
