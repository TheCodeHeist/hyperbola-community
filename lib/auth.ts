import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./auth-schema";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

export const auth = betterAuth({
  appName: "Hyperbola Community",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    changeEmail: { enabled: true },
    changePassword: { enabled: true },
  },
  advanced: {
    cookiePrefix: "hyperbola",
  },
  plugins: [nextCookies(), twoFactor(), passkey()],
});
