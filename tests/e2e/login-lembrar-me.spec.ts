import { test, expect, type Page, type Browser } from "@playwright/test";

// Os testes de sessao nao usam conta nem senha reais: a autenticacao e
// interceptada e o login pertence ao dominio reservado .invalid, que nunca
// resolve. Assim o repositorio nao guarda nenhuma credencial e o teste nao
// depende de dado de ninguem.
const BASE = `http://127.0.0.1:3456`;
const PROJETO = `fnlqruzbgwffhrqmpfvi`;
const LOGIN_INEXISTENTE = `ninguem@exemplo.invalid`;
const CHAVE_SESSAO = `sb-${PROJETO}-auth-token`;

/** JWT sem assinatura real: o cliente so precisa decodificar o payload. */
function jwtFalso(login: string): string {
  const agora = Math.floor(Date.now() / 1000);
  const parte = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString(`base64url`);
  return [
    parte({ alg: `none`, typ: `JWT` }),
    parte({
      sub: `11111111-1111-1111-1111-111111111111`,
      email: `${login}@exemplo.invalid`,
      aud: `authenticated`,
      role: `authenticated`,
      iat: agora,
      exp: agora + 3600,
    }),
    `assinatura-ignorada`,
  ].join(`.`);
}

/** Reproduz o contrato da Edge Function login-username, sem chamar o servidor. */
async function mockAuth(
  page: Page,
  { login, autenticar }: { login: string; autenticar: boolean }
) {
  const usuario = {
    id: `11111111-1111-1111-1111-111111111111`,
    aud: `authenticated`,
    role: `authenticated`,
    email: `${login}@exemplo.invalid`,
    app_metadata: {},
    user_metadata: {},
    created_at: `2026-01-01T00:00:00Z`,
  };

  // setSession pede o usuario ao servidor logo apos gravar a sessao; sem
  // este mock a chamada sai para a internet e o login falha por causa da
  // rede, nao por causa do que esta sendo testado.
  await page.route(`**/auth/v1/user`, (route) =>
    route.fulfill({
      status: 200,
      contentType: `application/json`,
      body: JSON.stringify(usuario),
    })
  );

  await page.route(`**/functions/v1/login-username`, (route) =>
    route.fulfill({
      status: 200,
      contentType: `application/json`,
      body: JSON.stringify(
        autenticar
          ? {
              ok: true,
              access_token: jwtFalso(login),
              refresh_token: `refresh-falso-${Math.random().toString(36).slice(2)}`,
            }
          : { ok: false, mensagem: `Login ou senha incorretos. Confira e tente novamente.` }
      ),
    })
  );

  await page.route(`**/rest/v1/rpc/eh_membro_ong`, (route) =>
    route.fulfill({
      status: 200,
      contentType: `application/json`,
      body: `true`,
    })
  );

  await page.route(`**/rest/v1/adocoes*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: `application/json`,
      body: `[]`,
      headers: { "content-range": "0-0/0" },
    })
  );
}

/** Reabre o navegador levando so o que persiste no perfil (cookies e localStorage). */
function reabrirNavegador(browser: Browser, storageState: any) {
  return browser.newContext({ storageState });
}

async function login(page: Page, login: string, lembrar: boolean) {
  await page.goto(`${BASE}/admin/login.html`);
  await page.locator(`#username`).fill(login);
  await page.locator(`#senha`).fill(`senha-qualquer-123`);
  if (lembrar) await page.locator(`#lembrar-me`).check();
  else await page.locator(`#lembrar-me`).uncheck();
  await page.locator(`#botao-entrar`).click();
}

function ondeEstaASessao(page: Page) {
  return page.evaluate((k) => ({
    local: localStorage.getItem(k),
    session: sessionStorage.getItem(k),
  }), CHAVE_SESSAO);
}

test.describe(`Lembrar-me`, () => {
  test(`marcado: guarda no localStorage e sobrevive ao navegador reaberto`, async ({
    page,
    browser,
  }) => {
    await mockAuth(page, { login: `ong`, autenticar: true });
    await login(page, `ong`, true);

    await expect(page).toHaveURL(/painel\.html/);
    await expect(page.locator(`#conteudo-painel`)).toBeVisible();

    // A sessao tem de estar no storage persistente e em nenhum outro.
    const guardado = await ondeEstaASessao(page);
    expect(guardado.local, `sessao deve ficar no localStorage`).not.toBeNull();
    expect(guardado.session, `sessao nao pode vazar para o sessionStorage`).toBeNull();

    // Recarregar a pagina: segue autenticado.
    await page.reload();
    await expect(page.locator(`#conteudo-painel`)).toBeVisible();

    // Fechar e reabrir o navegador: a sessao persistente continua valendo.
    const contexto = await reabrirNavegador(
      browser,
      await page.context().storageState()
    );
    const pagina = await contexto.newPage();
    await mockAuth(pagina, { login: `ong`, autenticar: true });
    await pagina.goto(`${BASE}/admin/painel.html`);
    await expect(pagina.locator(`#conteudo-painel`)).toBeVisible();
    await contexto.close();
  });

  test(`desmarcado: guarda no sessionStorage, sobrevive ao recarregar e morre ao reabrir`, async ({
    page,
    browser,
  }) => {
    await mockAuth(page, { login: `ong`, autenticar: true });
    await login(page, `ong`, false);

    await expect(page).toHaveURL(/painel\.html/);
    await expect(page.locator(`#conteudo-painel`)).toBeVisible();

    const guardado = await ondeEstaASessao(page);
    expect(guardado.session, `sessao temporaria fica no sessionStorage`).not.toBeNull();
    expect(guardado.local, `sessao temporaria nao pode ir para o localStorage`).toBeNull();

    // Recarregar na mesma aba: a sessao temporaria continua valendo.
    await page.reload();
    await expect(page.locator(`#conteudo-painel`)).toBeVisible();

    // Fechar e reabrir o navegador: a sessao temporaria nao vem atras.
    const contexto = await reabrirNavegador(
      browser,
      await page.context().storageState()
    );
    const pagina = await contexto.newPage();
    await mockAuth(pagina, { login: `ong`, autenticar: true });
    await pagina.goto(`${BASE}/admin/painel.html`);
    await expect(pagina).toHaveURL(/login\.html/);
    await contexto.close();
  });

  test(`logout limpa a sessao dos dois storages`, async ({ page }) => {
    await mockAuth(page, { login: `ong`, autenticar: true });
    await login(page, `ong`, true);

    await expect(page).toHaveURL(/painel\.html/);
    await page.locator(`#botao-sair`).click();
    await expect(page).toHaveURL(/login\.html/);

    const guardado = await ondeEstaASessao(page);
    expect(guardado.local, `logout deve limpar o localStorage`).toBeNull();
    expect(guardado.session, `logout deve limpar o sessionStorage`).toBeNull();
  });

  test(`login inexistente mostra erro e nao entra`, async ({ page }) => {
    await mockAuth(page, { login: LOGIN_INEXISTENTE, autenticar: false });
    await login(page, LOGIN_INEXISTENTE, true);

    await expect(page.locator(`#mensagem-erro`)).toHaveClass(/visivel/);
    await expect(page.locator(`#mensagem-erro`)).toContainText(
      `Login ou senha incorretos`
    );
    await expect(page).toHaveURL(/login\.html/);
    expect((await ondeEstaASessao(page)).local, `nao pode criar sessao`).toBeNull();
  });

  test(`senha incorreta mostra erro e nao entra`, async ({ page }) => {
    await mockAuth(page, { login: `ong`, autenticar: false });
    await login(page, `ong`, false);

    await expect(page.locator(`#mensagem-erro`)).toHaveClass(/visivel/);
    await expect(page.locator(`#mensagem-erro`)).toContainText(
      `Login ou senha incorretos`
    );
    await expect(page).toHaveURL(/login\.html/);
    expect((await ondeEstaASessao(page)).session, `nao pode criar sessao`).toBeNull();
  });

  test(`o campo e do tipo certo, tem rotulo e nao tem valor fixo`, async ({ page }) => {
    await page.goto(`${BASE}/admin/login.html`);
    const campo = page.locator(`#lembrar-me`);
    await expect(campo).toBeVisible();
    await expect(campo).toHaveAttribute(`type`, `checkbox`);
    await expect(page.locator(`label[for="lembrar-me"]`)).toHaveText(`Lembrar-me`);

    // Nenhum value no HTML: o que o navegador mostra ("on") e o padrao do
    // proprio tipo checkbox, nao algo escrito pela pagina.
    await expect(campo).not.toHaveAttribute(`value`, /.*/);
  });
});
