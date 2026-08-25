import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test from "node:test";

import app from "../app.ts";

const serviceKey = "owners-api-proxy-test-service-key";

type CapturedRequest = {
  method: string;
  url: string;
  authorization: string | undefined;
  body: string;
};

let appServer: Server;
let ownersApiServer: Server;
let appBaseUrl: string;
let ownersApiBaseUrl: string;
let capturedRequest: CapturedRequest | null;
let requestCount = 0;

test.before(async () => {
  ownersApiServer = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      requestCount += 1;
      capturedRequest = {
        method: req.method ?? "",
        url: req.url ?? "",
        authorization: req.headers.authorization,
        body: Buffer.concat(chunks).toString(),
      };
      res.statusCode = 207;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ source: "owners-api-test" }));
    });
  });
  ownersApiServer.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => ownersApiServer.once("listening", resolve));

  const ownersApiAddress = ownersApiServer.address();
  assert.ok(ownersApiAddress && typeof ownersApiAddress === "object");
  ownersApiBaseUrl = `http://127.0.0.1:${ownersApiAddress.port}`;

  appServer = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => appServer.once("listening", resolve));
  const appAddress = appServer.address();
  assert.ok(appAddress && typeof appAddress === "object");
  appBaseUrl = `http://127.0.0.1:${appAddress.port}`;

  process.env.SHIPHUB_OWNERS_API_BASE_URL = ownersApiBaseUrl;
  process.env.SHIPHUB_OWNERS_API_KEY = serviceKey;
});

test.after(async () => {
  await new Promise<void>((resolve, reject) =>
    appServer.close((error) => (error ? reject(error) : resolve())),
  );
  await new Promise<void>((resolve, reject) =>
    ownersApiServer.close((error) => (error ? reject(error) : resolve())),
  );
});

test.beforeEach(() => {
  capturedRequest = null;
  process.env.SHIPHUB_LOCAL_FIXTURE_MODE = "false";
});

test("forwards matching requests with method, path, authorization, and status", async () => {
  process.env.NODE_ENV = "development";
  const authorization = "Bearer charterer-session-token";
  const response = await fetch(`${appBaseUrl}/api/vessels/42?view=full`, {
    method: "PATCH",
    headers: {
      authorization,
      "content-type": "application/json",
    },
    body: JSON.stringify({ status: "available" }),
  });

  assert.equal(response.status, 207);
  assert.deepEqual(capturedRequest, {
    method: "PATCH",
    url: "/vessels/42?view=full",
    authorization,
    body: JSON.stringify({ status: "available" }),
  });
});

test("bypasses forwarding for local fixtures outside production", async () => {
  process.env.NODE_ENV = "development";
  process.env.SHIPHUB_LOCAL_FIXTURE_MODE = "true";
  const requestsBefore = requestCount;

  const response = await fetch(`${appBaseUrl}/api/vessels`);

  assert.equal(response.status, 401);
  assert.equal(requestCount, requestsBefore);
  assert.equal(capturedRequest, null);
});

test("forwards in production even when local fixture mode is enabled", async () => {
  process.env.NODE_ENV = "production";
  process.env.SHIPHUB_LOCAL_FIXTURE_MODE = "true";

  const response = await fetch(`${appBaseUrl}/api/vessels`);

  assert.equal(response.status, 207);
  assert.deepEqual(capturedRequest, {
    method: "GET",
    url: "/vessels",
    authorization: `Bearer ${serviceKey}`,
    body: "",
  });
});