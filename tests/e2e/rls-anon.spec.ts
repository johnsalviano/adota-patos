import { expect, test } from "@playwright/test";

const SUPABASE_URL = `https://fnlqruzbgwffhrqmpfvi.supabase.co`;
const ANON_KEY = `sb_publishable_jLvZpI_9Kg97Yqg6sdOzrQ_9gvAmRIR`;

test.describe(`RLS — acesso anônimo`, () => {
  test(`anon não lê perfis_membros (RLS)`, async ({ request }) => {
    const resp = await request.get(`${SUPABASE_URL}/rest/v1/perfis_membros?select=*`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    });
    // RLS deve bloquear: 200 com lista vazia, ou 401/403.
    if (resp.status() === 200) {
      const body = await resp.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    } else {
      expect([401, 403]).toContain(resp.status());
    }
  });

  test(`anon não lê doacoes_monetarias (RLS)`, async ({ request }) => {
    const resp = await request.get(`${SUPABASE_URL}/rest/v1/doacoes_monetarias?select=*`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    });
    if (resp.status() === 200) {
      const body = await resp.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    } else {
      expect([401, 403]).toContain(resp.status());
    }
  });

  test(`anon lê catálogo de animais (RLS permite)`, async ({ request }) => {
    const resp = await request.get(`${SUPABASE_URL}/rest/v1/animais?select=id,nome&limit=1`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    });
    // Catálogo é público: 200 OK.
    expect(resp.status()).toBe(200);
  });
});