import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(dir, "../../frontend");

// O SDK do Sentry e servido de uma copia local em test-results/tmp
// (pasta ignorada pelo git). O teste aponta o CDN oficial para ca, o
// que mantem o CI independente de rede externa durante os testes e
// ainda exercita o caminho real de carregamento e integridade (SRI).
//
// A copia e baixada sob demanda pelo proprio servidor a partir do
// CDN oficial. O hash do Subresource Integrity no frontend/js/erros.js
// continua valendo: se o arquivo divergir do publicado, o navegador
// recusa o script e o teste falha.
const raizSdk = resolve(dir, "../../test-results/tmp");
const ARQUIVO_SDK = resolve(raizSdk, "sentry-sdk.min.js");
const CDN_SDK = "https://browser.sentry-cdn.com/11.2.0/bundle.min.js";

async function garantirSdkLocal() {
  try {
    readFileSync(ARQUIVO_SDK);
    return true;
  } catch {
    /* precisa baixar */
  }
  try {
    mkdirSync(raizSdk, { recursive: true });
    const resposta = await fetch(CDN_SDK);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    writeFileSync(ARQUIVO_SDK, Buffer.from(await resposta.arrayBuffer()));
    return true;
  } catch (erro) {
    console.error(`aviso: SDK do Sentry indisponivel (${erro.message}); testes de erro serao pulados`);
    return false;
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function responder(arquivo, res) {
  try {
    const dados = readFileSync(arquivo);
    res.writeHead(200, { "Content-Type": MIME[extname(arquivo).toLowerCase()] ?? "application/octet-stream" });
    res.end(dados);
  } catch {
    res.writeHead(404);
    res.end("404");
  }
}

createServer((req, res) => {
  let caminho = decodeURIComponent(req.url.split("?")[0]);

  // Copia local do SDK, no lugar do CDN.
  if (caminho === "/sdk/sentry.min.js") {
    responder(ARQUIVO_SDK, res);
    return;
  }

  // Fixture de teste: script que lanca um erro nao tratado, usado
  // para conferir arquivo e linha no relatorio do Sentry. Vive nos
  // testes e nunca faz parte do frontend publicado.
  if (caminho.startsWith("/__fixtures__/")) {
    responder(resolve(dir, "fixtures", caminho.slice("/__fixtures__/".length)), res);
    return;
  }

  if (caminho === "/") caminho = "/index.html";
  const arquivo = resolve(raiz, "." + caminho);
  if (!arquivo.startsWith(raiz)) {
    res.writeHead(403);
    res.end("403");
    return;
  }
  responder(arquivo, res);
}).listen(3456, async () => {
  await garantirSdkLocal();
  console.log("servidor de teste em :3456");
});