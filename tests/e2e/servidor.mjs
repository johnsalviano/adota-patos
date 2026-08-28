import { createServer } from "http";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(dir, "../../frontend/index.html"), "utf-8");

createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(3456, () => console.log("servidor de teste em :3456"));