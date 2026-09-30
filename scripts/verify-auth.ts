/** Verificação complementar: matriz completa e requests.http A1–A7. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import argon2 from "argon2";
import { app } from "../src/app";
import { usersRepository } from "../src/repositories/users.repository";

const server = app.listen(0);
await new Promise<void>((resolve) => server.once("listening", resolve));
const address = server.address();
assert.ok(address && typeof address !== "string");
const base = `http://127.0.0.1:${address.port}`;
const request = (path: string, token?: string, body?: unknown) => fetch(base + path, {
  method: body === undefined ? "GET" : "POST",
  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const encounterInput = { startedAt: "2026-09-30T10:00", chiefComplaint: "Verificação da matriz" };
const medicationInput = { medication: "Medicamento fictício", dosage: "Dose fictícia" };
const cns = () => `7${BigInt(`0x${randomBytes(6).toString("hex")}`).toString().padStart(14, "0")}`;

try {
  const tokens: Record<string, string> = {};
  const credentials = new Map<string, { email: string; password: string }>();
  for (const role of ["admin", "profissional", "recepcao"]) {
    const input = { name: `Teste ${role}`, role, email: `${randomBytes(8).toString("hex")}@teste.local`, password: randomBytes(24).toString("hex") };
    const register = await request("/api/auth/register", undefined, input);
    assert.equal(register.status, 201);
    const registeredUser = await register.json();
    assert.ok(registeredUser && typeof registeredUser === "object");
    assert.deepEqual(Object.keys(registeredUser).sort(), ["email", "id", "name", "role"]);
    const row = await usersRepository.findByEmail(input.email);
    assert.ok(row && row.passwordHash !== input.password);
    assert.ok(await argon2.verify(row.passwordHash, input.password));
    const login = await request("/api/auth/login", undefined, input);
    assert.equal(login.status, 200);
    const result = await login.json() as { token: string; user: Record<string, unknown> };
    assert.deepEqual(Object.keys(result.user).sort(), ["email", "id", "name", "role"]);
    const payload = JSON.parse(Buffer.from(result.token.split(".")[1]!, "base64url").toString());
    assert.deepEqual(Object.keys(payload).sort(), ["exp", "iat", "id", "name", "role"]);
    assert.equal((await request("/api/auth/me", result.token)).status, 200);
    tokens[role] = result.token;
    credentials.set(role, input);
  }
  console.log("A1/A2: registro 201, login 200, me 200, hash argon2 e payload mínimo: OK");

  const owned = await request("/api/patients/1/encounters", tokens.profissional, encounterInput);
  assert.equal(owned.status, 201);
  const { id } = await owned.json() as { id: number };
  const medications = `/api/encounters/${id}/medications`;
  for (const role of ["admin", "profissional", "recepcao"]) {
    const token = tokens[role]!;
    assert.equal((await request("/api/patients", token)).status, 200);
    assert.equal((await request("/api/patients/1/encounters", token)).status, 200);
    assert.equal((await request("/api/patients", token, { name: "Matriz", birthDate: "1990-01-01", nationalId: cns() })).status, 201);
    const photo = new FormData();
    photo.append("photo", new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")], { type: "image/png" }), "teste.png");
    assert.equal((await fetch(base + "/api/patients/2/photo", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: photo })).status, 200);
    assert.equal((await request("/api/patients/1/encounters", token, encounterInput)).status, role === "recepcao" ? 403 : 201);
    assert.equal((await request(medications, token)).status, role === "recepcao" ? 403 : 200);
    assert.equal((await request(medications, token, medicationInput)).status, role === "profissional" ? 201 : 403);
    console.log(`Matriz ${role}: leitura, paciente, foto, atendimento e prescrições: OK`);
  }
  for (const [path, body] of [
    ["/api/patients", undefined], ["/api/patients/1", undefined],
    ["/api/patients", {}], ["/api/patients/1/photo", {}],
    ["/api/patients/1/encounters", undefined], ["/api/patients/1/encounters", encounterInput],
    [medications, undefined], [medications, medicationInput],
  ] as const) assert.equal((await request(path, undefined, body)).status, 401);
  console.log("A3: todas as rotas protegidas sem token -> 401: OK");
  assert.equal((await request("/api/patients/1/encounters", tokens.profissional + "x", encounterInput)).status, 401);
  for (const header of ["Basic abc", "Bearer", "Bearer abc def"]) {
    assert.equal((await fetch(base + "/api/patients", { headers: { Authorization: header } })).status, 401);
  }
  console.log("A4: token adulterado e headers malformados -> 401: OK");
  console.log("A5: recepcao/admin prescrevendo -> 403; profissional autor -> 201: OK");
  const professional = credentials.get("profissional")!;
  const wrong = await request("/api/auth/login", undefined, { ...professional, password: "x" });
  const unknown = await request("/api/auth/login", undefined, { email: "inexistente@teste.local", password: "x" });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(await wrong.json(), await unknown.json());
  console.log("A6: senha curta/errada e e-mail inexistente -> mesmo 401: OK");

  const previousExpiry = process.env.JWT_EXPIRES_IN;
  let expiredToken: string;
  try {
    process.env.JWT_EXPIRES_IN = "1s";
    expiredToken = ((await (await request("/api/auth/login", undefined, professional)).json()) as { token: string }).token;
  } finally {
    if (previousExpiry === undefined) delete process.env.JWT_EXPIRES_IN;
    else process.env.JWT_EXPIRES_IN = previousExpiry;
  }
  await setTimeout(1200);
  assert.equal((await request("/api/auth/me", expiredToken)).status, 401);
  console.log("A7: token emitido com expiração de 1s, usado após expirar -> 401: OK");
} finally {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
