import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { registerStorageProxy } from "./_core/storageProxy";

const originalNodeEnv = process.env.NODE_ENV;
const originalBypass = process.env.LOCAL_DEV_BYPASS_AUTH;
const originalForgeUrl = process.env.BUILT_IN_FORGE_API_URL;
const originalForgeKey = process.env.BUILT_IN_FORGE_API_KEY;
const originalEnvForgeUrl = ENV.forgeApiUrl;
const originalEnvForgeKey = ENV.forgeApiKey;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalBypass === undefined) delete process.env.LOCAL_DEV_BYPASS_AUTH;
  else process.env.LOCAL_DEV_BYPASS_AUTH = originalBypass;
  if (originalForgeUrl === undefined) delete process.env.BUILT_IN_FORGE_API_URL;
  else process.env.BUILT_IN_FORGE_API_URL = originalForgeUrl;
  if (originalForgeKey === undefined) delete process.env.BUILT_IN_FORGE_API_KEY;
  else process.env.BUILT_IN_FORGE_API_KEY = originalForgeKey;
  ENV.forgeApiUrl = originalEnvForgeUrl;
  ENV.forgeApiKey = originalEnvForgeKey;
});

describe("proxy de armazenamento local", () => {
  it("retorna o logotipo SVG de fallback sem credenciais hospedadas", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOCAL_DEV_BYPASS_AUTH = "true";
    delete process.env.BUILT_IN_FORGE_API_URL;
    delete process.env.BUILT_IN_FORGE_API_KEY;
    ENV.forgeApiUrl = "";
    ENV.forgeApiKey = "";

    let handler: ((req: { params: Record<string, string> }, res: unknown) => Promise<void>) | undefined;
    const app = {
      get: vi.fn((_path: string, registeredHandler: typeof handler) => {
        handler = registeredHandler;
      }),
    };
    const res = {
      type: vi.fn().mockReturnThis(),
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      redirect: vi.fn(),
    };

    registerStorageProxy(app as never);
    await handler?.({ params: { "0": "thi-engenharia-positivo.png" } }, res);

    expect(res.type).toHaveBeenCalledWith("image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("THI"));
  });
});
