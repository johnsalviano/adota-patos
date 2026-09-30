import { test, expect, type Page } from "@playwright/test";

// Este arquivo mede o visual da tela de login. Nao ha login, senha nem
// credencial aqui: a pagina e so aberta e os campos sao medidos.
//
// O motivo do teste: #username e type="text" e #senha e type="password". Um
// CSS que so estiliza input[type="email"] e input[type="password"] deixa o
// username de fora sem erro nenhum, e ele aparece com o estilo nativo do
// navegador. Aqui comparamos os dois campos entre si para que essa regressao
// volte a falhar o teste.

const BASE = `http://127.0.0.1:3456`;

/** Propriedades que definem o desenho do campo, no nome exato que o CSS usa.
 *  camelCase aqui devolveria string vazia e a comparacao passaria sem
 *  verificar nada, entao o nome tem de ser o kebab-case do navegador. */
const PROPRIEDADES = [
  `width`,
  `height`,
  `padding-top`,
  `padding-right`,
  `padding-bottom`,
  `padding-left`,
  `border-top-width`,
  `border-top-style`,
  `border-top-color`,
  `border-radius`,
  `font-family`,
  `font-size`,
  `font-weight`,
  `line-height`,
  `background-color`,
  `box-sizing`,
  `appearance`,
  `outline-style`,
  `outline-width`,
] as const;

async function medir(page: Page, seletor: string) {
  const dados = await page.locator(seletor).evaluate((el, props) => {
    const cs = getComputedStyle(el);
    const d: Record<string, string> = {};
    for (const p of props) d[p] = cs.getPropertyValue(p);
    return d;
  }, PROPRIEDADES);

  // Rede de seguranca do proprio teste: valor vazio aqui significa nome de
  // propriedade errado, e nao ausencia de estilo. Sem isso a comparacao
  // passaria por cima de dois vazios e nao provaria nada.
  for (const [prop, valor] of Object.entries(dados)) {
    expect(valor, `"${prop}" de ${seletor} veio vazio: nome de propriedade invalido`).not.toBe(``);
  }
  return dados;
}

/** Caixa renderizada, para comparar tamanho de verdade e nao so a regra CSS. */
async function caixa(page: Page, seletor: string) {
  const b = await page.locator(seletor).boundingBox();
  expect(b, `${seletor} precisa estar renderizado`).not.toBeNull();
  return b!;
}

test.describe(`Visual da tela de login`, () => {
  test(`#username e #senha sao visualmente identicos`, async ({ page }) => {
    await page.goto(`${BASE}/admin/login.html`);

    const username = await medir(page, `#username`);
    const senha = await medir(page, `#senha`);

    for (const p of PROPRIEDADES) {
      expect(
        username[p],
        `#username e #senha precisam ter o mesmo "${p}"`
      ).toBe(senha[p]);
    }
  });

  test(`#username tem o mesmo tamanho renderizado que #senha`, async ({ page }) => {
    await page.goto(`${BASE}/admin/login.html`);

    const cUser = await caixa(page, `#username`);
    const cSenha = await caixa(page, `#senha`);

    expect(cUser.width).toBeCloseTo(cSenha.width, 1);
    expect(cUser.height).toBeCloseTo(cSenha.height, 1);

    // O campo ocupa a largura do formulario: e prova de que a regra de
    // largura do CSS foi aplicada, e nao so uma coincidencia de tamanho.
    const form = await caixa(page, `#formulario-login`);
    expect(cUser.width).toBeLessThanOrEqual(form.width);
    expect(cUser.width).toBeGreaterThan(form.width * 0.9);
  });

  test(`#username nao usa o estilo nativo do navegador`, async ({ page }) => {
    await page.goto(`${BASE}/admin/login.html`);

    const username = await medir(page, `#username`);
    const senha = await medir(page, `#senha`);

    // O padrao nativo do input de texto no Chromium e fundo branco, borda de
    // 2px cinza solida e sem raio. A folha do projeto usa fundo #f7faf9 e
    // raio definido, entao qualquer um desses valores indica estilo nativo.
    expect(username[`background-color`], `fundo`).not.toBe(`rgb(255, 255, 255)`);
    expect(username[`background-color`]).toBe(senha[`background-color`]);
    expect(parseFloat(username[`border-radius`]), `raio`).toBeGreaterThan(0);
    expect(parseFloat(username[`border-top-width`]), `borda`).toBe(2);
    expect(username[`border-top-style`], `borda`).not.toBe(`inset`);

    // O box tem de ser o do projeto (13px 16px de padding), nao o nativo (1px 2px).
    expect(parseFloat(username[`padding-left`])).toBeGreaterThanOrEqual(8);
    expect(parseFloat(username[`padding-top`])).toBeGreaterThanOrEqual(8);
  });

  test(`o foco muda os dois campos do mesmo jeito`, async ({ page }) => {
    await page.goto(`${BASE}/admin/login.html`);

    const normal = await medir(page, `#username`);

    // A folha tem `transition: border-color 0.2s`, entao medir logo apos o
    // foco pega a cor no meio da animacao. Esta e a espera da transicao.
    const FOCO = 400;

    await page.locator(`#username`).focus();
    await page.waitForTimeout(FOCO);
    const focado = await medir(page, `#username`);

    // Foco muda a borda e o fundo, e nunca deixa o contorno nativo do
    // navegador aparecer por cima do estilo do projeto.
    expect(focado[`border-top-color`]).not.toBe(normal[`border-top-color`]);
    expect(focado[`outline-style`]).toBe(`none`);
    expect(focado[`background-color`]).toBe(`rgb(255, 255, 255)`);

    await page.locator(`#senha`).focus();
    await page.waitForTimeout(FOCO);
    const senhaFocada = await medir(page, `#senha`);
    expect(senhaFocada[`border-top-color`]).toBe(focado[`border-top-color`]);
    expect(senhaFocada[`background-color`]).toBe(focado[`background-color`]);
  });

  test(`os dois campos continuam com a semantica correta`, async ({ page }) => {
    await page.goto(`${BASE}/admin/login.html`);

    const user = page.locator(`#username`);
    await expect(user).toHaveAttribute(`type`, `text`);
    await expect(user).toHaveAttribute(`autocomplete`, `username`);

    await expect(page.locator(`label[for="username"]`)).toHaveText(`Login`);
    await expect(page.locator(`label[for="senha"]`)).toHaveText(`Senha`);

    // O placeholder e generico: nao revela nome, e-mail nem usuario de ninguem.
    const placeholder = await user.getAttribute(`placeholder`);
    expect(placeholder).toBe(`Seu nome de usuário`);
    expect(placeholder).not.toMatch(/@/);
    expect(placeholder).not.toMatch(/salviano|john/i);

    // Nenhum dos dois campos nasce preenchido.
    await expect(user).toHaveValue(``);
    await expect(page.locator(`#senha`)).toHaveValue(``);
    await expect(user).not.toHaveAttribute(`value`, /.*/);
  });
});
