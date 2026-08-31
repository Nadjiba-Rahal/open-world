import { createHash } from "node:crypto";
import type { Socket } from "node:net";

export interface WebSocketPeer {
  send(payload: string): void;
  close(): void;
  onMessage(listener: (payload: string) => void): void;
  onClose(listener: () => void): void;
}

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function frame(payload: string): Buffer {
  const body = Buffer.from(payload);
  if (body.length < 126) return Buffer.concat([Buffer.from([0x81, body.length]), body]);
  if (body.length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(body.length, 2);
    return Buffer.concat([header, body]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(body.length), 2);
  return Buffer.concat([header, body]);
}

/**
 * Small RFC 6455 text-frame peer. Keeping this in the server boundary avoids
 * coupling the game to a provider-specific realtime SDK.
 */
export function acceptWebSocket(socket: Socket, key: string): WebSocketPeer {
  const accept = createHash("sha1").update(key + GUID).digest("base64");
  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`,
    "",
    ""
  ].join("\r\n"));

  let buffer = Buffer.alloc(0);
  let closed = false;
  const messageListeners = new Set<(payload: string) => void>();
  const closeListeners = new Set<() => void>();
  const notifyClose = () => {
    if (closed) return;
    closed = true;
    for (const listener of closeListeners) listener();
  };

  socket.on("data", (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 2) {
      const first = buffer[0] ?? 0;
      const second = buffer[1] ?? 0;
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (buffer.length < 4) return;
        length = buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (buffer.length < 10) return;
        const longLength = Number(buffer.readBigUInt64BE(2));
        if (!Number.isSafeInteger(longLength) || longLength > 1_000_000) {
          socket.destroy();
          return;
        }
        length = longLength;
        offset = 10;
      }
      const maskOffset = masked ? 4 : 0;
      if (buffer.length < offset + maskOffset + length) return;
      const mask = masked ? buffer.subarray(offset, offset + 4) : undefined;
      const start = offset + maskOffset;
      const payload = Buffer.from(buffer.subarray(start, start + length));
      buffer = buffer.subarray(start + length);
      if (mask) for (let index = 0; index < payload.length; index += 1) payload[index] = (payload[index] ?? 0) ^ (mask[index % 4] ?? 0);

      if (opcode === 0x8) {
        socket.end(Buffer.from([0x88, 0x00]));
        return;
      }
      if (opcode === 0x9) {
        socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload]));
        continue;
      }
      if (opcode === 0x1) {
        const text = payload.toString("utf8");
        for (const listener of messageListeners) listener(text);
      }
    }
  });
  socket.on("close", notifyClose);
  socket.on("error", notifyClose);

  return {
    send(payload) {
      if (!closed && !socket.destroyed) socket.write(frame(payload));
    },
    close() {
      if (!closed) socket.end(Buffer.from([0x88, 0x00]));
    },
    onMessage(listener) {
      messageListeners.add(listener);
    },
    onClose(listener) {
      closeListeners.add(listener);
    }
  };
}