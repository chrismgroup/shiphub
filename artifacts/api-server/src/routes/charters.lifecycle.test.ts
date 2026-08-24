import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.SHIPHUB_LOCAL_FIXTURE_MODE = "true";
process.env.SESSION_SECRET ??= "charter-lifecycle-test-secret";

import { and, eq, inArray } from "drizzle-orm";
import app from "../app.ts";
import {
  charterOffersTable,
  charterPartiesTable,
  db,
  pool,
  vesselNotificationsTable,
  vesselUsersTable,
  vesselsTable,
} from "@workspace/db";
import { canActivateCharter, validateHireDates } from "./charter-lifecycle.ts";

const owner = { userId: 10, role: "owner" };
const admin = { userId: 99, role: "admin" };
const charter = {
  ownerId: 10,
  durationDays: 7,
  laycanEarliest: new Date("2026-09-01T00:00:00.000Z"),
};

let server: Server;
let baseUrl: string;

test.before(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await pool.end();
});

function token(user: { id: number; email: string; role: string }): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    userId: user.id,
    email: user.email,
    role: user.role,
    scope: "vessel",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const content = `${header}.${payload}`;
  const signature = createHmac("sha256", process.env.SESSION_SECRET!)
    .update(content)
    .digest("base64url");
  return `${content}.${signature}`;
}

async function request(
  path: string,
  authToken: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${authToken}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() as Record<string, unknown> };
}

async function createFixture() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const [ownerUser] = await db.insert(vesselUsersTable).values({
    name: "Lifecycle Test Owner",
    email: `lifecycle-owner-${suffix}@example.test`,
    password: "not-used",
    role: "owner",
  }).returning();
  const [chartererUser] = await db.insert(vesselUsersTable).values({
    name: "Lifecycle Test Charterer",
    email: `lifecycle-charterer-${suffix}@example.test`,
    password: "not-used",
    role: "client",
  }).returning();
  const [vessel] = await db.insert(vesselsTable).values({
    ownerId: ownerUser.id,
    name: "Lifecycle Test Vessel",
    vesselType: "Tanker",
    status: "available",
  }).returning();
  const now = new Date();
  const [charter] = await db.insert(charterPartiesTable).values({
    vesselId: vessel.id,
    chartererId: chartererUser.id,
    ownerId: ownerUser.id,
    status: "confirmed",
    durationDays: 14,
    laycanEarliest: new Date("2026-09-01T00:00:00.000Z"),
    ownerConfirmedAt: now,
    chartererConfirmedAt: now,
  }).returning();

  return {
    ownerUser,
    chartererUser,
    vessel,
    charter,
    ownerToken: token(ownerUser),
    chartererToken: token(chartererUser),
    cleanup: async () => {
      await db.delete(charterPartiesTable).where(eq(charterPartiesTable.id, charter.id));
      await db.delete(vesselsTable).where(eq(vesselsTable.id, vessel.id));
      await db.delete(vesselUsersTable).where(inArray(vesselUsersTable.id, [ownerUser.id, chartererUser.id]));
    },
  };
}

test("owner must respond before the charterer can confirm an enquiry", async () => {
  const fixture = await createFixture();
  try {
    await db.update(charterPartiesTable)
      .set({
        status: "enquiry",
        ownerConfirmedAt: null,
        chartererConfirmedAt: null,
      })
      .where(eq(charterPartiesTable.id, fixture.charter.id));

    const blocked = await request(
      `/api/charter-parties/${fixture.charter.id}/confirm`,
      fixture.chartererToken,
    );
    assert.equal(blocked.status, 409);
    assert.equal(
      blocked.body.error,
      "The ship owner must confirm the enquiry before you can confirm it",
    );

    const ownerResponse = await request(
      `/api/charter-parties/${fixture.charter.id}/confirm`,
      fixture.ownerToken,
    );
    assert.equal(ownerResponse.status, 200);
    assert.equal(ownerResponse.body.status, "negotiating");

    const chartererResponse = await request(
      `/api/charter-parties/${fixture.charter.id}/confirm`,
      fixture.chartererToken,
    );
    assert.equal(chartererResponse.status, 200);
    assert.equal(chartererResponse.body.status, "confirmed");
  } finally {
    await fixture.cleanup();
  }
});

test("owner can send a counter-offer and notify the charterer", async () => {
  const fixture = await createFixture();
  try {
    await db.update(charterPartiesTable)
      .set({
        status: "enquiry",
        rate: "5000",
        rateCurrency: "USD",
        rateBasis: "Per Day",
        terms: "Initial terms",
        ownerConfirmedAt: null,
        chartererConfirmedAt: null,
      })
      .where(eq(charterPartiesTable.id, fixture.charter.id));

    const result = await fetch(`${baseUrl}/api/charter-parties/${fixture.charter.id}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${fixture.ownerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        rate: "7500",
        terms: "Owner counter-offer: weather downtime excluded.",
      }),
    });
    const body = await result.json() as Record<string, unknown>;

    assert.equal(result.status, 200);
    assert.equal(body.rate, "7500");
    assert.equal(body.rateBasis, "Per Day");
    assert.equal(body.terms, "Owner counter-offer: weather downtime excluded.");
    assert.equal(body.status, "negotiating");
    assert.equal(body.ownerConfirmedAt, null);
    assert.equal(body.chartererConfirmedAt, null);

    const notifications = await db.select().from(vesselNotificationsTable).where(and(
      eq(vesselNotificationsTable.userId, fixture.chartererUser.id),
      eq(vesselNotificationsTable.relatedId, fixture.charter.id),
      eq(vesselNotificationsTable.type, "terms_updated"),
    ));
    assert.equal(notifications.length, 1);
    assert.match(notifications[0].message, /revised terms/);
  } finally {
    await fixture.cleanup();
  }
});

test("offer history records the owner response and charterer counter-offer in order", async () => {
  const fixture = await createFixture();
  try {
    await db.update(charterPartiesTable)
      .set({
        status: "enquiry",
        rate: "5000",
        rateCurrency: "USD",
        rateBasis: "Per Day",
        terms: "Initial terms",
        ownerConfirmedAt: null,
        chartererConfirmedAt: null,
      })
      .where(eq(charterPartiesTable.id, fixture.charter.id));

    const offersPath = `/api/charter-parties/${fixture.charter.id}/offers`;
    const initialResponse = await fetch(`${baseUrl}${offersPath}`, {
      headers: { authorization: `Bearer ${fixture.ownerToken}` },
    });
    const initialOffers = await initialResponse.json() as Array<Record<string, unknown>>;
    assert.equal(initialResponse.status, 200);
    assert.equal(initialOffers.length, 1);
    assert.equal(initialOffers[0].actorRole, "charterer");

    const ownerOffer = await fetch(`${baseUrl}/api/charter-parties/${fixture.charter.id}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${fixture.ownerToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ rate: "7500", terms: "Owner terms" }),
    });
    assert.equal(ownerOffer.status, 200);

    const chartererOffer = await fetch(`${baseUrl}/api/charter-parties/${fixture.charter.id}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${fixture.chartererToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ rate: "7000", terms: "Charterer counter terms" }),
    });
    assert.equal(chartererOffer.status, 200);

    const historyResponse = await fetch(`${baseUrl}${offersPath}`, {
      headers: { authorization: `Bearer ${fixture.chartererToken}` },
    });
    const history = await historyResponse.json() as Array<Record<string, unknown>>;
    assert.equal(history.length, 3);
    assert.deepEqual(history.map(({ actorRole }) => actorRole), ["charterer", "owner", "charterer"]);
    assert.equal(history[0].rate, "7000");
    assert.equal(history[1].rate, "7500");
    assert.equal(history[2].rate, "5000");
    assert.equal(history[0].supersedesOfferId, history[1].id);
    assert.equal(history[1].supersedesOfferId, history[2].id);
    assert.equal(history[2].supersedesOfferId, null);
    assert.ok(history.every(({ id, createdAt }) => Number(id) > 0 && typeof createdAt === "string"));

    const persistedOffers = await db.select().from(charterOffersTable)
      .where(eq(charterOffersTable.charterId, fixture.charter.id));
    assert.equal(persistedOffers.length, 3);
  } finally {
    await fixture.cleanup();
  }
});

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

test("activating a confirmed charter persists hire dates, vessel status, and one charterer notification", async () => {
  const fixture = await createFixture();
  try {
    const result = await request(
      `/api/charter-parties/${fixture.charter.id}/activate`,
      fixture.ownerToken,
      { hireStart: "2026-09-03", hireEnd: "2026-09-17" },
    );
    assert.equal(result.status, 200);
    assert.equal(result.body.status, "active");
    assert.equal(result.body.hireStart, "2026-09-03T00:00:00.000Z");
    assert.equal(result.body.hireEnd, "2026-09-17T00:00:00.000Z");

    const [persistedCharter] = await db.select().from(charterPartiesTable)
      .where(eq(charterPartiesTable.id, fixture.charter.id));
    const [persistedVessel] = await db.select().from(vesselsTable)
      .where(eq(vesselsTable.id, fixture.vessel.id));
    const notifications = await db.select().from(vesselNotificationsTable).where(and(
      eq(vesselNotificationsTable.userId, fixture.chartererUser.id),
      eq(vesselNotificationsTable.relatedId, fixture.charter.id),
      eq(vesselNotificationsTable.type, "charter_active"),
    ));
    assert.equal(persistedCharter.status, "active");
    assert.equal(persistedCharter.hireStart?.toISOString(), "2026-09-03T00:00:00.000Z");
    assert.equal(persistedCharter.hireEnd?.toISOString(), "2026-09-17T00:00:00.000Z");
    assert.equal(persistedVessel.status, "on_hire");
    assert.equal(notifications.length, 1);
  } finally {
    await fixture.cleanup();
  }
});

test("termination restores availability and creates exactly one notification", async () => {
  const fixture = await createFixture();
  try {
    assert.equal((await request(`/api/charter-parties/${fixture.charter.id}/activate`, fixture.ownerToken)).status, 200);
    const result = await request(`/api/charter-parties/${fixture.charter.id}/terminate`, fixture.ownerToken);
    assert.equal(result.status, 200);
    assert.equal(result.body.status, "terminated");

    const [persistedVessel] = await db.select().from(vesselsTable)
      .where(eq(vesselsTable.id, fixture.vessel.id));
    const notifications = await db.select().from(vesselNotificationsTable).where(and(
      eq(vesselNotificationsTable.userId, fixture.chartererUser.id),
      eq(vesselNotificationsTable.relatedId, fixture.charter.id),
      eq(vesselNotificationsTable.type, "charter_terminated"),
    ));
    assert.equal(persistedVessel.status, "available");
    assert.equal(notifications.length, 1);

    const repeated = await request(`/api/charter-parties/${fixture.charter.id}/terminate`, fixture.ownerToken);
    assert.equal(repeated.status, 409);
    assert.equal(repeated.body.error, "Only active charters can be terminated");
    const notificationsAfterRepeat = await db.select().from(vesselNotificationsTable).where(and(
      eq(vesselNotificationsTable.userId, fixture.chartererUser.id),
      eq(vesselNotificationsTable.relatedId, fixture.charter.id),
      eq(vesselNotificationsTable.type, "charter_terminated"),
    ));
    assert.equal(notificationsAfterRepeat.length, 1);
  } finally {
    await fixture.cleanup();
  }
});

test("concurrent activation and termination allow one transition and reject the other clearly", async () => {
  const fixture = await createFixture();
  try {
    const activations = await Promise.all([
      request(`/api/charter-parties/${fixture.charter.id}/activate`, fixture.ownerToken),
      request(`/api/charter-parties/${fixture.charter.id}/activate`, fixture.ownerToken),
    ]);
    assert.deepEqual(activations.map(({ status }) => status).sort(), [200, 409]);
    const activationConflict = activations.find(({ status }) => status === 409);
    assert.ok([
      "This vessel is not currently available",
      "Only confirmed charters can be activated",
    ].includes(String(activationConflict?.body.error)));

    const terminations = await Promise.all([
      request(`/api/charter-parties/${fixture.charter.id}/terminate`, fixture.ownerToken),
      request(`/api/charter-parties/${fixture.charter.id}/terminate`, fixture.ownerToken),
    ]);
    assert.deepEqual(terminations.map(({ status }) => status).sort(), [200, 409]);
    const terminationConflict = terminations.find(({ status }) => status === 409);
    assert.equal(terminationConflict?.body.error, "Only active charters can be terminated");

    const notifications = await db.select().from(vesselNotificationsTable).where(
      and(
        eq(vesselNotificationsTable.userId, fixture.chartererUser.id),
        eq(vesselNotificationsTable.relatedId, fixture.charter.id),
      ),
    );
    assert.equal(notifications.filter(({ type }) => type === "charter_active").length, 1);
    assert.equal(notifications.filter(({ type }) => type === "charter_terminated").length, 1);
  } finally {
    await fixture.cleanup();
  }
});