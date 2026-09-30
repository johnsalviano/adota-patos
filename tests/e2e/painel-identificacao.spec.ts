import { test, expect, type Page } from "@playwright/test";

// Este arquivo cobre o texto de identificacao do painel: o que aparece logo
// abaixo do cabecalho depois do login.
//
// O problema: o painel escrevia session.user.email, que e o identificador
// interno do Auth, e nao o username cadastrado em perfis_membros.
//
// Nao ha credencial real aqui. O login e interceptado e o username devolvido
// pela RPC meu_username vem simulado, entao nenhum dado de membro real e
// nenhuma senha entram no repositorio. O e-mail interno tambem e simulado, no
// dominio reservado .invalid, justamente para provar que ele NAO aparece.

const BASE = `http://127.0.0.1:3456`;
const PROJETO = `fnlqruzbgwffhrqmpfvi`;
const CHAVE_SESSAO = `sb-${PROJETO}-auth-token`;
const INTERNO = `@exemplo.invalid`;

// Usernames ficticios. O repositorio nao guarda o username de nenhum membro
// real: o teste valida o mecanismo (a RPC decide o que aparece), e a conferencia
// com as contas de verdade e feita no navegador, com login manual.
const CONTAS = [`Membro.Exemplo`, `Outra.Membro`];

/** JWT sem assinatura real: o cliente so precisa decodificar o payload. */
function jwtFalso(email: string): string {
  const agora = Math.floor(Date.now() / 1000);
  const parte = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString(`base64url`);
  return [
    parte({ alg: `none`, typ: `JWT` }),
    parte({
      sub: `11111111-1111-1111-1111-111111111111`,
      email,
      aud: `authenticated`,
      role: `authenticated`,
      iat: agora,
      exp: agora + 3600,
    }),
    `assinatura-ignorada`,
  ].join(`.`);
}

/**
 * Intercepta a autenticacao e devolve a RPC meu_username com o username da
 * conta simulada. Reproduz o mesmo contrato de login-lembrar-me.spec.ts, mais
 * a RPC nova.
 */
async function mockAuth(page: Page, username: string) {
  const email = `${username.toLowerCase()}${INTERNO}`;
  const usuario = {
    id: `11111111-1111-1111-1111-111111111111`,
    aud: `authenticated`,
    role: `authenticated`,
    email,
    app_metadata: {},
    user_metadata: {},
    created_at: `2026-01-01T00:00:00Z`,
  };

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
      body: JSON.stringify({
        ok: true,
        access_token: jwtFalso(email),
        refresh_token: `refresh-falso-${Math.random().toString(36).slice(2)}`,
      }),
    })
  );

  await page.route(`**/rest/v1/rpc/eh_membro_ong`, (route) =>
    route.fulfill({
      status: 200,
      contentType: `application/json`,
      body: `true`,
    })
  );

  // A RPC retorna text puro, entao a resposta e o username entre aspas.
  await page.route(`**/rest/v1/rpc/meu_username`, (route) =>
    route.fulfill({
      status: 200,
      contentType: `application/json`,
      body: JSON.stringify(username),
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

/** Faz o login pela pagina de verdade, para o sessao.js gravar a sessao. */
async function entrarNoPainel(page: Page, username: string) {
  await mockAuth(page, username);
  await page.goto(`${BASE}/admin/login.html`);
  await page.locator(`#username`).fill(username);
  await page.locator(`#senha`).fill(`senha-qualquer-123`);
  await page.locator(`#botao-entrar`).click();
  await expect(page).toHaveURL(/painel\.html/);
  await expect(page.locator(`#conteudo-painel`)).toBeVisible();
}

test.describe(`Identificacao do membro no painel`, () => {
  for (const username of CONTAS) {
    test(`${username} ve o proprio username e nada mais`, async ({ page }) => {
      await entrarNoPainel(page, username);

      await expect(page.locator(`#usuario-logado`)).toHaveText(username);
      await expect(page.locator(`.ola`)).toHaveText(
        `Você está logado como ${username}.`
      );
    });
  }

  test(`o texto nao contem e-mail interno, e-mail real nem uuid`, async ({
    page,
  }) => {
    await entrarNoPainel(page, CONTAS[0]);

    const tela = await page.locator(`.ola`).innerText();
    expect(tela).toBe(`Você está logado como ${CONTAS[0]}.`);
    expect(tela).not.toMatch(/@/);
    expect(tela).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/i);
    expect(tela).not.toContain(INTERNO);
  });

  test(`um membro nunca ve o username de outro`, async ({ page }) => {
    await entrarNoPainel(page, CONTAS[1]);

    const tela = await page.locator(`body`).innerText();
    expect(tela).toContain(CONTAS[1]);
    expect(tela).not.toContain(CONTAS[0]);
  });

  test(`sem sessao o painel continua bloqueado`, async ({ page }) => {
    // Sem mock de sessao: nenhum token no storage, entao o acesso deve falhar.
    await page.goto(`${BASE}/admin/painel.html`);
    await page.waitForURL(/login\.html/);
    expect(page.url()).toMatch(/login\.html/);
    await expect(page.locator(`#usuario-logado`)).toHaveCount(0);
  });

  test(`logout volta para o login e limpa a sessao`, async ({ page }) => {
    await entrarNoPainel(page, CONTAS[0]);

    await page.locator(`#botao-sair`).click();
    await expect(page).toHaveURL(/login\.html/);

    const guardado = await page.evaluate(
      (k) => ({
        local: localStorage.getItem(k),
        session: sessionStorage.getItem(k),
      }),
      CHAVE_SESSAO
    );
    expect(guardado.local, `logout deve limpar o localStorage`).toBeNull();
    expect(guardado.session, `logout deve limpar o sessionStorage`).toBeNull();
  });
});