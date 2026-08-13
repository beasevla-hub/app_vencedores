import { describe, expect, it } from "vitest";

const NOTION_API_VERSION = "2026-03-11";

describe("integração com o Notion", () => {
  it("autentica a integração configurada", async () => {
    const token = process.env.NOTION_API_KEY;
    expect(token, "NOTION_API_KEY deve estar configurada no ambiente do servidor").toBeTruthy();

    const response = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_API_VERSION,
      },
    });

    expect(response.status, "A integração do Notion deve responder com sucesso").toBe(200);

    const payload = (await response.json()) as { object?: string; type?: string };
    expect(payload.object).toBe("user");
    expect(["bot", "person"]).toContain(payload.type);
  }, 15_000);
});
