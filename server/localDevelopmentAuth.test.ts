import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest: vi.fn() },
}));

import { createContext } from "./_core/context";
import { sdk } from "./_core/sdk";

const originalNodeEnv = process.env.NODE_ENV;
const originalBypass = process.env.LOCAL_DEV_BYPASS_AUTH;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalBypass === undefined) delete process.env.LOCAL_DEV_BYPASS_AUTH;
  else process.env.LOCAL_DEV_BYPASS_AUTH = originalBypass;
  vi.clearAllMocks();
});

describe("acesso de desenvolvimento local", () => {
  it("habilita um usuário local somente com a flag explícita em desenvolvimento", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOCAL_DEV_BYPASS_AUTH = "true";
    vi.mocked(sdk.authenticateRequest).mockRejectedValueOnce(new Error("Sessão inexistente"));

    const context = await createContext({ req: {}, res: {} } as never);

    expect(context.user).toMatchObject({
      openId: "local-development-user",
      role: "admin",
      loginMethod: "local-development",
    });
  });

  it("não cria um usuário local fora do modo explicitamente configurado", async () => {
    process.env.NODE_ENV = "production";
    process.env.LOCAL_DEV_BYPASS_AUTH = "true";
    vi.mocked(sdk.authenticateRequest).mockRejectedValueOnce(new Error("Sessão inexistente"));

    const context = await createContext({ req: {}, res: {} } as never);

    expect(context.user).toBeNull();
  });
});
