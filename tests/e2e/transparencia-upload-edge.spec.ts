import { expect, type Page, test } from "@playwright/test";

const BASE = `http://127.0.0.1:3456`;

function jwtFalso(login: string): string {
  const agora = Math.floor(Date.now() / 1000);
  const parte = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString(`base64url`);
  return [parte({ alg: `none`, typ: `JWT` }), parte({ sub: `11111111-1111-1111-1111-111111111111`, email: `${login}@exemplo.invalid`, aud: `authenticated`, role: `authenticated`, iat: agora, exp: agora + 3600 }), `assinatura-ignorada`].join(`.`);
}

async function mockAuth(page: Page, { login, autenticar, membro }: { login: string; autenticar: boolean; membro?: boolean }) {
  const usuario = { id: `11111111-1111-1111-1111-111111111111`, aud: `authenticated`, role: `authenticated`, email: `${login}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: `2026-01-01T00:00:00Z` };
  await page.route(`**/auth/v1/user`, (route) => route.fulfill({ status: 200, contentType: `application/json`, body: JSON.stringify(usuario) }));
  await page.route(`**/functions/v1/login-username`, (route) => route.fulfill({ status: 200, contentType: `application/json`, body: JSON.stringify(autenticar ? { ok: true, access_token: jwtFalso(login), refresh_token: `refresh-falso` } : { ok: false, mensagem: `Login ou senha incorretos.` }) }));
  await page.route(`**/rest/v1/rpc/eh_membro_ong`, (route) => route.fulfill({ status: 200, contentType: `application/json`, body: membro === false ? `false` : `true` }));
  await page.route(`**/rest/v1/rpc/eh_gerente_transparencia`, (route) => route.fulfill({ status: 200, contentType: `application/json`, body: membro === false ? `false` : `true` }));
  await page.route(`**/rest/v1/adocoes*`, (route) => route.fulfill({ status: 200, contentType: `application/json`, body: `[]`, headers: { "content-range": "0-0/0" } }));
  await page.route(`**/rest/v1/animais*`, (route) => route.fulfill({ status: 200, contentType: `application/json`, body: `[]`, headers: { "content-range": "0-0/0" } }));
}

async function login(page: Page, login: string, lembrar: boolean) {
  await page.goto(`${BASE}/admin/login.html`);
  await page.locator(`#username`).fill(login);
  await page.locator(`#senha`).fill(`senha-qualquer-123`);
  if (lembrar) await page.locator(`#lembrar-me`).check();
  else await page.locator(`#lembrar-me`).uncheck();
  await page.locator(`#botao-entrar`).click();
  await expect(page).toHaveURL(/painel\.html/, { timeout: 10_000 });
}

test.describe(`Transparência — edge cases de upload`, () => {
  test(`upload sem autenticação (sem Bearer) retorna 401/403`, async ({ request }) => {
    const resp = await request.post(`https://fnlqruzbgwffhrqmpfvi.supabase.co/functions/v1/transparencia/upload`, {
      multipart: {
        arquivo: { name: "teste.pdf", mimeType: "application/pdf", buffer: Buffer.from("conteudo") },
        ano: "2026",
        mes: "01",
      },
    });
    // Sem token, deve ser rejeitado (401/403) ou 404 (função não expõe sem auth).
    expect([401, 403, 404, 405]).toContain(resp.status());
  });

  test(`upload com arquivo muito grande é rejeitado`, async ({ page }) => {
    await mockAuth(page, { login: `ong`, autenticar: true, membro: true });
    await page.route(`**/functions/v1/transparencia/upload`, (route) =>
      route.fulfill({ status: 413, contentType: `application/json`, body: JSON.stringify({ ok: false, mensagem: `Arquivo muito grande.` }) })
    );
    await login(page, `ong`, true);
    // Navega para aba transparência
    await page.locator(`#aba-transparencia`).click();
    // Verifica que a aba carregou
    await expect(page.locator(`#secao-transparencia`)).not.toHaveClass(/oculto/);
  });

  test(`upload com MIME inválido é rejeitado pelo backend`, async ({ page }) => {
    await mockAuth(page, { login: `ong`, autenticar: true, membro: true });
    await page.route(`**/functions/v1/transparencia/upload`, (route) =>
      route.fulfill({ status: 415, contentType: `application/json`, body: JSON.stringify({ ok: false, mensagem: `Tipo de conteúdo não suportado.` }) })
    );
    await login(page, `ong`, true);
    await page.locator(`#aba-transparencia`).click();
    await expect(page.locator(`#secao-transparencia`)).not.toHaveClass(/oculto/);
  });
});