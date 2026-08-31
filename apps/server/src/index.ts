import { createServer } from "node:http";
import { CURRENT_PHASE } from "@afterlight/shared";

const port = Number(process.env.PORT ?? 3001);
const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, phase: CURRENT_PHASE }));
    return;
  }
  response.writeHead(200, { "content-type": "text/plain" });
  response.end("Afterlight server boundary");
});
server.listen(port, () => console.log("Afterlight server listening on port " + port));
