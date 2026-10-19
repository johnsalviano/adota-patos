import { expect, type Page, test } from "@playwright/test";

const BASE = `http://127.0.0.1:3456`;

async function mockSupabase(page: Page) {
  await page.route("**/fnlqruzbgwffhrqmpfvi.supabase.co/rest/v1/animais*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "11111111-1111-1111-1111-111111111111",
          nome: "Rex",
          idade: "2 anos",
          sexo: "Macho",
          porte: "Grande",
          descricao: "Cachorro dócil.",
          foto_url: "https://placekitten.com/400/300",
        },
      ]),
      headers: { "content-range": "0-0/1" },
    })
  );
  await page.route("**/googletagmanager.com/**", (route) => route.fulfill({ status: 204, body: "" }));
}

// Regressão: estrutura do catálogo (see REGRAS.md §prevenção 2026-10-19).
test.describe("Estrutura e largura do catálogo de animais", () => {
  test("HTML: .section-header é fechado antes de .animals-grid e #test-banner é único", async ({ page }) => {
    await mockSupabase(page);
    await page.goto(BASE);
    await page.waitForFunction(() => document.querySelector(".animal-card"), { timeout: 15_000 });

    // Apenas um #test-banner deve existir.
    await expect(await page.locator("#test-banner").count()).toBe(1);

    // #catalogo-animais é filho direto de .animals-grid (dentro da section animals)...
    const catParent = await page.locator("section.animals #catalogo-animais").evaluate((n) => n.parentElement?.classList.contains("animals-grid"));
    expect(catParent).toBe(true);

    // ...e .animals-grid é filha direta de .container [da section animals], NÃO de .section-header.
    const gridParentIsContainer = await page.locator("section.animals .animals-grid").evaluate((n) => n.parentElement?.classList.contains("container"));
    expect(gridParentIsContainer).toBe(true);

    const gridParentIsHeader = await page.locator("section.animals .animals-grid").evaluate((n) => n.parentElement?.classList.contains("section-header"));
    expect(gridParentIsHeader).toBe(false);

    // .section-header é irmão de .animals-grid (mesmo pai .container, dentro da section animals).
    const headerAndGridShareParent = await page.locator("section.animals .section-header").evaluate((n) => n.parentElement?.classList.contains("container"));
    expect(headerAndGridShareParent).toBe(true);
  });

  test("Desktop: catálogo ocupa a largura útil do container (>700px) em 3 colunas", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 800, "layout de 3 colunas é verificado só em desktop");
    await mockSupabase(page);
    await page.goto(BASE);
    await page.waitForFunction(() => document.querySelector(".animal-card"), { timeout: 15_000 });

    const w = await page.locator("section.animals #catalogo-animais").evaluate((n) => n.getBoundingClientRect().width);
    expect(w).toBeGreaterThan(900); // ~1120px: fora do teto de 700 do .section-header.

    const cols = await page.locator("section.animals #catalogo-animais").evaluate((n) => getComputedStyle(n).gridTemplateColumns);
    const colCount = cols.split(" ").length;
    expect(colCount).toBe(3);

    const imgH = await page.locator("section.animals .animal-card img").first().evaluate((n) => getComputedStyle(n).height);
    expect(imgH).toBe("250px");
  });

  test("Mobile (375px): 1 coluna e .animals-grid fora de .section-header", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockSupabase(page);
    await page.goto(BASE);
    await page.waitForFunction(() => document.querySelector(".animal-card"), { timeout: 15_000 });

    const cols = await page.locator("section.animals #catalogo-animais").evaluate((n) => getComputedStyle(n).gridTemplateColumns);
    expect(cols).toBe("337.5px"); // 1fr

    const gridParent = await page.locator("section.animals .animals-grid").evaluate((n) => n.parentElement?.classList.contains("section-header"));
    expect(gridParent).toBe(false);
  });
});
