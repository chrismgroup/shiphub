import assert from "node:assert/strict";
import test from "node:test";

import { canActivateCharter, validateHireDates } from "./charter-lifecycle.ts";

const owner = { userId: 10, role: "owner" };
const admin = { userId: 99, role: "admin" };
const charter = {
  ownerId: 10,
  durationDays: 7,
  laycanEarliest: new Date("2026-09-01T00:00:00.000Z"),
};

test("only the vessel owner or an admin can activate", () => {
  assert.equal(canActivateCharter(owner, charter), true);
  assert.equal(canActivateCharter(admin, charter), true);
  assert.equal(canActivateCharter({ userId: 20, role: "client" }, charter), false);
});

test("activation dates default to the laycan and charter duration", () => {
  const result = validateHireDates({}, charter);
  assert.deepEqual(result, {
    hireStart: new Date("2026-09-01T00:00:00.000Z"),
    hireEnd: new Date("2026-09-08T00:00:00.000Z"),
  });
});

test("invalid and reversed hire dates return clear errors", () => {
  assert.deepEqual(
    validateHireDates({ hireStart: "not-a-date" }, charter),
    { error: "Hire dates must be valid dates" },
  );
  assert.deepEqual(
    validateHireDates(
      { hireStart: "2026-09-10", hireEnd: "2026-09-09" },
      charter,
    ),
    { error: "hireEnd must be after hireStart" },
  );
});