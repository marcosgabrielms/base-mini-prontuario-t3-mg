-- CreateTable
CREATE TABLE "encounters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patient_id" INTEGER NOT NULL,
    "started_at" TEXT NOT NULL,
    "chief_complaint" TEXT NOT NULL,
    "notes" TEXT,
    FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "medication_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "encounter_id" INTEGER NOT NULL,
    "medication" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    FOREIGN KEY ("encounter_id") REFERENCES "encounters" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "patients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "birth_date" TEXT NOT NULL,
    "national_id" TEXT NOT NULL UNIQUE,
    "photo_url" TEXT,
    "active" INTEGER NOT NULL DEFAULT 1
);

-- CreateIndex
CREATE INDEX "idx_encounters_patient" ON "encounters"("patient_id" ASC);

-- CreateIndex
CREATE INDEX "idx_medreq_encounter" ON "medication_requests"("encounter_id" ASC);

