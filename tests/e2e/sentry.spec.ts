import { expect, test } from "@playwright/test";

// O modulo de monitoramento (frontend/js/erros.js) expoe estes
// nomes na janela. Declarados aqui para os testes falharem se o
// contrato mudar.
declare global {
    interface Window {
        AdotaPatosErros?: { dsnConfigurado(): boolean };
        Sentry?: unknown;
        ADOTA_PATOS_DSN?: string;
    }
}

// O monitoramento de erros nao pode quebrar o site nem vazar dado
// pessoal. Estes testes rodam contra o servidor local e NAO tocam em
// producao nem em nenhum projeto real do Sentry.
//
// A captura e verificada interceptando a requisicao que o SDK faria
// para o Sentry (route). Assim provamos o caminho completo - carregar
// SDK, iniciar, capturar erro, enviar envelope - sem DSN valido.

// DSN de teste. A chave e hexadecimal proposital: o SDK 11 valida o
// formato da public key e descarta o evento silenciosamente quando ela
// tem caracteres invalidos, o que faria o teste passar sem provar nada.
const DSN_LOCAL = "https://a1b2c3d4e5f6a7b8c9d0@o0.ingest.sentry.io/0";
// A URL real e https://<org>.ingest.sentry.io/api/<projectId>/envelope/.
// O projectId vem do DSN e pode ser qualquer numero, entao o padrao
// cobre qualquer projectId sem assumir o projeto de teste.
const ENVELOPE = "**/api/*/envelope/**";
const CDN_SENTRY = "https://browser.sentry-cdn.com/**";

// O SDK e servido de uma copia local (tests/e2e/servidor.mjs) para o
// CI nao depender do CDN. O hash SRI continua valendo: se a copia
// local divergir do arquivo oficial, o navegador recusa o script e o
// teste falha. E o proprio teste, portanto, mantem a garantia.
async function usarSdkLocal(page: import("@playwright/test").Page) {
    await page.route(CDN_SENTRY, async (route) => {
        const resposta = await route.fetch({
            url: route.request().url().replace(CDN_SENTRY, "http://127.0.0.1:3456/sdk/sentry.min.js"),
        });
        await route.fulfill({ response: resposta });
    });
}

// O SDK tambem envia um envelope de sessao quando a pagina abre, e
// nao e um erro. Os testes de conteudo olham so o envelope de evento,
// que e o que o Sentry mostraria como alerta.
async function capturarEventosDeErro(page: import("@playwright/test").Page) {
    const eventos: string[] = [];
    await page.route(ENVELOPE, async (route) => {
        const corpo = route.request().postData() ?? "";
        if (corpo.includes('"type":"event"')) eventos.push(corpo);
        await route.fulfill({ status: 200, body: "{}" });
    });
    return eventos;
}

test.describe("Monitoramento de erros", () => {
    test("site funciona e nao requisita o Sentry sem DSN configurado", async ({ page }) => {
        const requisicoesSentry: string[] = [];
        page.on("request", (req) => {
            // Compara o HOST, e nao a URL inteira: casar o trecho do
            // dominio aceitaria tambem um site falso como
            // "sentry-cdn.com.meudominio.com", que nao tem nada a ver.
            const host = new URL(req.url()).host;
            if (host === "browser.sentry-cdn.com" || host.endsWith(".ingest.sentry.io")) {
                requisicoesSentry.push(req.url());
            }
        });
        const errosDaPagina: string[] = [];
        page.on("pageerror", (err) => errosDaPagina.push(err.message));

        await page.goto("/index.html");

        // O site segue inteiro mesmo sem monitoramento.
        await expect(page.locator("#animalModal")).toHaveCount(1);
        await expect(page.locator("h1").first()).toBeVisible();

        // Nenhum script do Sentry e carregado: DSN vazio = site igual.
        expect(requisicoesSentry, "nao deve carregar o SDK do Sentry").toHaveLength(0);
        expect(errosDaPagina, "site nao pode gerar erro").toHaveLength(0);

        // O modulo existe e se declara desligado.
        const desligado = await page.evaluate(() => window.AdotaPatosErros?.dsnConfigurado());
        expect(desligado).toBe(false);
    });

    test("captura erro nao tratado e envia com arquivo e linha", async ({ page }) => {
        await usarSdkLocal(page);
        const envelopes = await capturarEventosDeErro(page);

        // Injeta um DSN de teste antes dos scripts da pagina rodarem.
        // O arquivo real em erros.js continua com DSN vazio.
        await page.addInitScript((dsn) => {
            window.ADOTA_PATOS_DSN = dsn;
        }, DSN_LOCAL);

        await page.goto("/index.html");
        await page.waitForFunction(() => Boolean(window.Sentry), undefined, { timeout: 20000 });

        // Injeta um script real que lanca um erro nao tratado. E o
        // caminho que o Sentry precisa cobrir: erro de verdade, de
        // arquivo de verdade, com arquivo e linha verdadeiros.
        await page.addScriptTag({ url: "/__fixtures__/erro-controlado.js" });

        await expect.poll(() => envelopes.length, { timeout: 15000 }).toBeGreaterThan(0);

        const corpo = envelopes.join("\n");
        expect(corpo, "deve conter o arquivo que falhou").toContain("erro-controlado.js");
        expect(corpo, "deve conter a mensagem do erro").toContain("erro artificial de verificacao");
        // Linha 13 do fixture: o arquivo nao passa por build nem
        // minificacao, entao a linha tem de bater.
        expect(corpo, "deve conter a linha 13 do arquivo").toContain('"lineno":13');
    });

    test("nao envia dado pessoal no evento", async ({ page }) => {
        await usarSdkLocal(page);
        const envelopes = await capturarEventosDeErro(page);

        await page.addInitScript((dsn) => {
            window.ADOTA_PATOS_DSN = dsn;
        }, DSN_LOCAL);

        await page.goto("/index.html");
        await page.waitForFunction(() => Boolean(window.Sentry), undefined, { timeout: 20000 });

        // A pessoa esta com dados no formulario quando o site quebra:
        // e o cenario que poderia vazar dado.
        const segredo = "adocao-joao-silva@exemplo.com";
        await page.evaluate((texto) => {
            const campo = document.createElement("input");
            campo.name = "email";
            campo.value = texto;
            document.body.appendChild(campo);
        }, segredo);

        await page.addScriptTag({ url: "/__fixtures__/erro-controlado.js" });

        await expect.poll(() => envelopes.length, { timeout: 15000 }).toBeGreaterThan(0);

        const corpo = envelopes.join("\n");
        // O erro precisa ter chegado (senao o teste passa sem provar).
        expect(corpo).toContain("erro artificial de verificacao");

        // O contrato de privacidade nao e "a string nunca aparece":
        // e o modulo nao anexar nada. Se o codigo colocasse o e-mail
        // DENTRO da mensagem do erro, ele viajaria - e isso seria bug
        // no codigo que lancou o erro, nao no monitoramento. O que
        // travamos aqui e o que o Sentry acrescentaria por conta
        // propria: identidade, IP, URL com query, cookies.
        expect(corpo, "nao pode enviar user (identidade)").not.toContain('"user":');
        expect(corpo, "nao pode enviar ip").not.toContain('"ip_address"');
        expect(corpo, "nao pode enviar cookies").not.toContain('"cookies"');
        // O valor preenchido no formulario nao pode ser anexado.
        expect(corpo, "valor do formulario nao pode vazar").not.toContain(segredo);
    });

    test("erro conhecido de terceiros nao vira alerta", async ({ page }) => {
        await usarSdkLocal(page);
        // O SDK tambem envia um envelope de sessao no inicio da pagina.
        // Isso nao e alerta, entao o teste conta so eventos de erro.
        let erros = 0;
        await page.route(ENVELOPE, async (route) => {
            if ((route.request().postData() ?? "").includes('"type":"event"')) erros++;
            await route.fulfill({ status: 200, body: "{}" });
        });

        await page.addInitScript((dsn) => {
            window.ADOTA_PATOS_DSN = dsn;
        }, DSN_LOCAL);

        await page.goto("/index.html");
        await page.waitForFunction(() => Boolean(window.Sentry), undefined, { timeout: 20000 });
        // Deixa a pagina estabilizar antes de medir.
        await page.waitForTimeout(2000);
        const antes = erros;

        // Ruido tipico de extensao de navegador: nao e problema nosso.
        await page.evaluate(() => {
            setTimeout(() => {
                throw new Error("ResizeObserver loop limit exceeded");
            }, 0);
        });

        await page.waitForTimeout(3000);
        expect(erros, "erro ignorado nao deve gerar evento").toBe(antes);
    });
});