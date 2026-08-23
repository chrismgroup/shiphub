import { createHash } from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import type { Socket } from "node:net";
import { authenticateVesselToken } from "../routes/vessel-auth-middleware";

const charterClients = new Set<Socket>();

function sendFrame(socket: Socket, message: string): void {
  const payload = Buffer.from(message);
  let header: Buffer;

  if (payload.length < 126) {
    header = Buffer.from([0x81, payload.length]);
  } else if (payload.length <= 0xffff) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }

  socket.write(Buffer.concat([header, payload]));
}

function rejectUpgrade(socket: Socket, status: string): void {
  socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function handleUpgrade(request: IncomingMessage, socket: Socket): void {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname !== "/api/ws/charters") {
    rejectUpgrade(socket, "404 Not Found");
    return;
  }

  const auth = authenticateVesselToken(url.searchParams.get("token") ?? undefined);
  const key = request.headers["sec-websocket-key"];
  if (!auth || typeof key !== "string") {
    rejectUpgrade(socket, "401 Unauthorized");
    return;
  }

  const accept = createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");
  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "",
      "",
    ].join("\r\n"),
  );

  charterClients.add(socket);
  socket.on("close", () => charterClients.delete(socket));
  socket.on("error", () => charterClients.delete(socket));
}

export function attachCharterSocket(server: Server): void {
  server.on("upgrade", handleUpgrade);
}

export function broadcastCharterUpdate(charterId: number): void {
  const message = JSON.stringify({ type: "charter_updated", charterId });
  for (const socket of charterClients) {
    if (socket.destroyed) {
      charterClients.delete(socket);
      continue;
    }
    sendFrame(socket, message);
  }
}