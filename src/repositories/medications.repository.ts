import { db } from "./sqlite";
import type { CreateMedicationInput } from "../validation/medications.schemas";

export type Medication = CreateMedicationInput & { id: number; encounterId: number };
export interface MedicationsRepository {
  findByEncounter(encounterId: number): Promise<Medication[]>;
  create(encounterId: number, input: CreateMedicationInput): Promise<Medication>;
}
type Row = { id: number; encounter_id: number; medication: string; dosage: string };
const map = (row: Row): Medication => ({ id: row.id, encounterId: row.encounter_id, medication: row.medication, dosage: row.dosage });
export class SqliteMedicationsRepository implements MedicationsRepository {
  async findByEncounter(encounterId: number) {
    return (db.prepare("SELECT id, encounter_id, medication, dosage FROM medication_requests WHERE encounter_id = ? ORDER BY id").all(encounterId) as Row[]).map(map);
  }
  async create(encounterId: number, input: CreateMedicationInput) {
    const result = db.prepare("INSERT INTO medication_requests (encounter_id, medication, dosage) VALUES (?, ?, ?)").run(encounterId, input.medication, input.dosage);
    return map(db.prepare("SELECT id, encounter_id, medication, dosage FROM medication_requests WHERE id = ?").get(result.lastInsertRowid) as Row);
  }
}
