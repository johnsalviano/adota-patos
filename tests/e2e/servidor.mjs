import { createServer } from "http";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, extname, resolve } from "path";

const dir = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(dir, "../../frontend");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

createServer((req, res) => {
  let caminho = decodeURIComponent(req.url.split("?")[0]);
  if (caminho === "/") caminho = "/index.html";
  const arquivo = resolve(raiz, "." + caminho);
  if (!arquivo.startsWith(raiz)) {
    res.writeHead(403);
    res.end("403");
    return;
  }
  try {
    const dados = readFileSync(arquivo);
    res.writeHead(200, { "Content-Type": MIME[extname(arquivo).toLowerCase()] ?? "application/octet-stream" });
    res.end(dados);
  } catch {
    res.writeHead(404);
    res.end("404");
  }
}).listen(3456, () => console.log("servidor de teste em :3456"));