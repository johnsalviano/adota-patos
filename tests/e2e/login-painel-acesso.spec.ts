import { expect, type Page, test } from "@playwright/test";

const BASE = `http://127.0.0.1:3456`;
const PROJETO = `fnlqruzbgwffhrqmpfvi`;

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

async function mockAuth(
  page: Page,
  { login, autenticar, membro }: { login: string; autenticar: boolean; membro?: boolean }
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

  await page.route(`**/auth/v1/user`, (route) =>
    route.fulfill({ status: 200, contentType: `application/json`, body: JSON.stringify(usuario) })
  );

  await page.route(`**/functions/v1/login-username`, (route) =>
    route.fulfill({
      status: 200,
      contentType: `application/json`,
      body: JSON.stringify(
        autenticar
          ? { ok: true, access_token: jwtFalso(login), refresh_token: `refresh-falso` }
          : { ok: false, mensagem: `Login ou senha incorretos. Confira e tente novamente.` }
      ),
    })
  );

  await page.route(`**/rest/v1/rpc/eh_membro_ong`, (route) =>
    route.fulfill({
      status: 200,
      contentType: `application/json`,
      body: membro === false ? `false` : `true`,
    })
  );

  await page.route(`**/rest/v1/adocoes*`, (route) =>
    route.fulfill({ status: 200, contentType: `application/json`, body: `[]`, headers: { "content-range": "0-0/0" } })
  );

  await page.route(`**/rest/v1/animais*`, (route) =>
    route.fulfill({ status: 200, contentType: `application/json`, body: `[]`, headers: { "content-range": "0-0/0" } })
  );
}

async function login(page: Page, login: string, lembrar: boolean) {
  await page.goto(`${BASE}/admin/login.html`);
  await page.locator(`#username`).fill(login);
  await page.locator(`#senha`).fill(`senha-qualquer-123`);
  if (lembrar) await page.locator(`#lembrar-me`).check();
  else await page.locator(`#lembrar-me`).uncheck();
  await page.locator(`#botao-entrar`).click();
}

test.describe(`Login e acesso ao painel`, () => {
  test(`login válido redireciona para o painel`, async ({ page }) => {
    await mockAuth(page, { login: `ong`, autenticar: true, membro: true });
    await login(page, `ong`, true);
    await expect(page).toHaveURL(/painel\.html/);
    await expect(page.locator(`#conteudo-painel`)).toBeVisible({ timeout: 10_000 });
  });

  test(`login com senha incorreta mostra erro e não entra`, async ({ page }) => {
    await mockAuth(page, { login: `ong`, autenticar: false });
    await login(page, `ong`, false);
    await expect(page.locator(`#mensagem-erro`)).toHaveClass(/visivel/);
    await expect(page.locator(`#mensagem-erro`)).toContainText(`Login ou senha incorretos`);
    await expect(page).toHaveURL(/login\.html/);
  });

  test(`login com usuário inexistente mostra erro e não entra`, async ({ page }) => {
    await mockAuth(page, { login: `ninguem`, autenticar: false });
    await login(page, `ninguem`, false);
    await expect(page.locator(`#mensagem-erro`)).toHaveClass(/visivel/);
    await expect(page).toHaveURL(/login\.html/);
  });

  test(`conta sem permissão de membro da ONG é bloqueada`, async ({ page }) => {
    await mockAuth(page, { login: `ong`, autenticar: true, membro: false });
    await login(page, `ong`, true);
    await expect(page.locator(`#mensagem-erro`)).toHaveClass(/visivel/);
    await expect(page.locator(`#mensagem-erro`)).toContainText(`permiss`);
    await expect(page).toHaveURL(/login\.html/);
  });

  test(`painel sem sessão redireciona para login`, async ({ page }) => {
    await page.goto(`${BASE}/admin/painel.html`);
    await expect(page).toHaveURL(/login\.html/, { timeout: 10_000 });
  });

  test(`painel com sessão válida carrega o conteúdo`, async ({ page }) => {
    await mockAuth(page, { login: `ong`, autenticar: true, membro: true });
    await login(page, `ong`, true);
    await expect(page).toHaveURL(/painel\.html/);
    await expect(page.locator(`#conteudo-painel`)).toBeVisible({ timeout: 10_000 });
    // abas principais presentes
    await expect(page.locator(`#aba-solicitacoes`)).toBeVisible();
    await expect(page.locator(`#aba-animais`)).toBeVisible();
  });

  test(`botão "ver senha" não existe (removido por segurança)`, async ({ page }) => {
    await page.goto(`${BASE}/admin/login.html`);
    await expect(page.locator(`#toggle-senha`)).toHaveCount(0);
  });
});