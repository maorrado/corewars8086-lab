import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "repos", "corewars8086_js", "war");
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const file = path.resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end("forbidden");
    return;
  }
  fs.readFile(file, (error, body) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500).end(error.code ?? "error");
      return;
    }
    response.writeHead(200, { "Content-Type": mime.get(path.extname(file).toLowerCase()) ?? "application/octet-stream" });
    response.end(body);
  });
}).listen(8123, "127.0.0.1", () => console.log("simulator server listening on http://127.0.0.1:8123/page.html"));
