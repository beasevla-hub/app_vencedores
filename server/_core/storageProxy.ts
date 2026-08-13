import type { Express, Response } from "express";
import { ENV } from "./env";

function sendLocalBrandFallback(res: Response) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" role="img" aria-label="THI Engenharia e Arquitetura">
    <rect width="360" height="180" fill="white"/>
    <path d="M16 18h328v24H16zM16 46h36v72h46v-72h194v72h52v24H16z" fill="#52A660" stroke="#174C2B" stroke-width="3"/>
    <text x="180" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="50" font-weight="800" fill="#174C2B">THI</text>
    <text x="180" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#174C2B">ENGENHARIA E ARQUITETURA</text>
  </svg>`;
  res.type("image/svg+xml").send(svg);
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      if (process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_BYPASS_AUTH === "true") {
        sendLocalBrandFallback(res);
        return;
      }
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
