import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { initAuth } from "@/auth";

/**
 * Protects guest-only routes (e.g. login, signup).
 * Redirects authenticated users to `/dashboard`.
 */
export const guestMiddleware = createMiddleware().server(async ({ next }) => {
  const auth = await initAuth();
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (session) {
    throw redirect({ to: "/dashboard" });
  }

  return await next();
});

/**
 * Protects routes that require authentication.
 * Redirects unauthenticated users to `/login`.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const auth = await initAuth();
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw redirect({ to: "/login" });
  }

  return await next();
});

/**
 * Protects routes that require admin privileges.
 * Redirects unauthenticated users to `/login` and non-admin users to `/unauthorized`.
 */
export const adminMiddleware = createMiddleware().server(async ({ next }) => {
  const auth = await initAuth();
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw redirect({ to: "/login" });
  }

  if (session.user.role !== "admin") {
    throw redirect({ to: "/unauthorized" });
  }

  return await next();
});
