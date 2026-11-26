import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { existsSyncMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn(),
}));

vi.mock("fs", async importOriginal => {
  const actual = await importOriginal<typeof import("fs")>();
  return { ...actual, existsSync: existsSyncMock };
});

import { ENV } from "./_core/env";
import { registerStorageProxy } from "./_core/storageProxy";

const originalNodeEnv = process.env.NODE_ENV;
const originalBypass = process.env.LOCAL_DEV_BYPASS_AUTH;
const originalForgeUrl = process.env.BUILT_IN_FORGE_API_URL;
const originalForgeKey = process.env.BUILT_IN_FORGE_API_KEY;
const originalEnvForgeUrl = ENV.forgeApiUrl;
const originalEnvForgeKey = ENV.forgeApiKey;

type Handler = (req: { params: Record<string, string> }, res: unknown) => Promise<void>;

function configureLocalFallback() {
  process.env.NODE_ENV = "development";
  process.env.LOCAL_DEV_BYPASS_AUTH = "true";
  delete process.env.BUILT_IN_FORGE_API_URL;
  delete process.env.BUILT_IN_FORGE_API_KEY;
  ENV.forgeApiUrl = "";
  ENV.forgeApiKey = "";
}

function createResponse() {
  return {
    type: vi.fn().mockReturnThis(),
    send: vi.fn(),
    sendFile: vi.fn(),
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    redirect: vi.fn(),
  };
}

function registerAndGetHandler(): Handler {
  let handler: Handler | undefined;
  const app = {
    get: vi.fn((_path: string, registeredHandler: Handler) => {
      handler = registeredHandler;
    }),
  };

  registerStorageProxy(app as never);

  if (!handler) throw new Error("O handler do proxy de armazenamento não foi registrado.");
  return handler;
}

beforeEach(() => {
  existsSyncMock.mockReset();
  configureLocalFallback();
});

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
  it("envia o logotipo local quando o arquivo existe", async () => {
    existsSyncMock.mockReturnValue(true);
    const handler = registerAndGetHandler();
    const res = createResponse();

    await handler({ params: { "0": "thi-engenharia-positivo.png" } }, res);

    expect(res.sendFile).toHaveBeenCalledWith(expect.stringMatching(/logo\.png$/));
    expect(res.type).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("retorna o logotipo SVG de fallback quando o arquivo local não existe", async () => {
    existsSyncMock.mockReturnValue(false);
    const handler = registerAndGetHandler();
    const res = createResponse();

    await handler({ params: { "0": "thi-engenharia-positivo.png" } }, res);

    expect(res.type).toHaveBeenCalledWith("image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("THI"));
    expect(res.sendFile).not.toHaveBeenCalled();
  });
});
