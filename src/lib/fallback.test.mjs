import { test } from "node:test";
import assert from "node:assert/strict";
import { AllFailedError, firstSuccess } from "./fallback.ts";

const fatal = (e) => e?.fatal === true;
const fake = (down, calls = []) => async (m) => {
  calls.push(m);
  if (down[m] === "fatal") throw Object.assign(new Error("bad key"), { fatal: true });
  if (down[m]) throw new Error(`${m} is down`);
  return `answer from ${m}`;
};

test("model utama gagal → cadangan berikutnya dipakai", async () => {
  const r = await firstSuccess(["utama", "cadangan1", "cadangan2"], fake({ utama: true }), fatal);
  assert.equal(r.model, "cadangan1");
  assert.deepEqual(r.failed.map((f) => f.model), ["utama"]);
});

test("error fatal (API key salah) tidak memicu fallback", async () => {
  const calls = [];
  await assert.rejects(firstSuccess(["utama", "cadangan1"], fake({ utama: "fatal" }, calls), fatal), /bad key/);
  assert.deepEqual(calls, ["utama"]);
});

test("semua model mati → AllFailedError", async () => {
  await assert.rejects(firstSuccess(["a", "b"], fake({ a: true, b: true }), fatal), AllFailedError);
});
