import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const isLocalDevelopment = process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_BYPASS_AUTH === "true";

  if (isLocalDevelopment) {
    const now = new Date();
    return {
      req: opts.req,
      res: opts.res,
      user: {
        id: 0,
        openId: "local-development-user",
        name: "Desenvolvimento local",
        email: "local@thi.local",
        loginMethod: "local-development",
        role: "admin",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      },
    };
  }

  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
