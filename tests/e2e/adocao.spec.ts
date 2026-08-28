import { test, expect, type Page } from "@playwright/test";

const FAKE_ANIMALS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    nome: "Rex",
    idade: "2 anos",
    sexo: "Macho",
    porte: "Grande",
    descricao: "Cachorro dócil e brincalhão.",
    foto_url: "https://placekitten.com/400/300",
  },
];

async function mockSupabase(page: Page) {
  await page.route(
    "**/fnlqruzbgwffhrqmpfvi.supabase.co/rest/v1/animais*",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_ANIMALS),
        headers: { "content-range": "0-0/1" },
      })
  );
  await page.route(
    "**/fnlqruzbgwffhrqmpfvi.supabase.co/functions/v1/receber-adocao",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, mensagem: "Adoção registrada com sucesso!" }),
      })
  );
}

async function mockAnalytics(page: Page) {
  await page.route("**/googletagmanager.com/**", (route) =>
    route.fulfill({ status: 204, body: "" })
  );
}

const BASE = `http://127.0.0.1:3456`;

test("catalogo carrega e mostra animais", async ({ page }) => {
  await mockSupabase(page);
  await mockAnalytics(page);
  await page.goto(BASE);
  const card = page.locator(".animal-card:not([aria-hidden])").first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card).toContainText("Rex");
});

test("modal abre ao clicar no botao Conhecer", async ({ page }) => {
  await mockSupabase(page);
  await mockAnalytics(page);
  await page.goto(BASE);
  await page.locator(".btn-details").first().click();
  await expect(page.locator("#animalModal")).toHaveClass(/active/);
  await expect(page.locator("#modalName")).toHaveText("Rex");
});

test("modal fecha no botao fechar", async ({ page }) => {
  await mockSupabase(page);
  await mockAnalytics(page);
  await page.goto(BASE);
  await page.locator(".btn-details").first().click();
  await expect(page.locator("#animalModal")).toHaveClass(/active/);
  await page.locator("#closeModal").click({ force: true });
  await expect(page.locator("#animalModal")).not.toHaveClass(/active/);
});

test("formulario tem campos obrigatorios", async ({ page }) => {
  await mockSupabase(page);
  await mockAnalytics(page);
  await page.goto(BASE);
  await page.locator("#adocao").scrollIntoViewIfNeeded();
  await expect(page.locator("#name")).toBeVisible();
  await expect(page.locator("#phone")).toBeVisible();
  await expect(page.locator("#email")).toBeVisible();
  await expect(page.locator("#city")).toBeVisible();
  await expect(page.locator("#experience")).toBeVisible();
});

test("preencher e enviar formulario de adocao", async ({ page }) => {
  await mockSupabase(page);
  await mockAnalytics(page);
  await page.goto(BASE);
  await page.locator("#adocao").scrollIntoViewIfNeeded();

  await page.fill("#name", "João Silva");
  await page.fill("#phone", "(83) 99999-1234");
  await page.fill("#email", "joao@teste.com");
  await page.fill("#city", "Patos");
  await page.selectOption("#experience", { index: 1 });
  await page.fill("#reason", "Quero adotar um amigo.");
  await page.check("input[type=checkbox]");

  await page.locator("#adoptionForm button[type=submit]").click();

  const feedback = page.locator("#form-feedback");
  await expect(feedback).toBeVisible({ timeout: 10_000 });
  await expect(feedback).toContainText("🐶");
});

test("banner de cookies aparece para quem nunca decidiu", async ({ page }) => {
  await mockSupabase(page);
  await mockAnalytics(page);
  await page.goto(BASE);
  await expect(page.locator("#banner-cookies")).toBeVisible();
  await expect(page.locator(".btn", { hasText: "Aceitar" })).toBeVisible();
});

test("aceitar cookies salva consentimento e carrega analytics", async ({ page }) => {
  await mockSupabase(page);
  await mockAnalytics(page);
  await page.goto(BASE);
  await page.locator("#banner-cookies .btn", { hasText: "Aceitar" }).click();
  await expect(page.locator("#banner-cookies")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("consentimento-cookies"))).toBe("aceito");
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(1);
});

test("recusar cookies salva escolha e nao carrega analytics", async ({ page }) => {
  await mockSupabase(page);
  await mockAnalytics(page);
  await page.goto(BASE);
  await page.locator("#banner-cookies button", { hasText: "Recusar" }).click();
  await expect(page.locator("#banner-cookies")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("consentimento-cookies"))).toBe("recusado");
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
});