import { createFileRoute } from "@tanstack/react-router";
import { initAuth } from "@/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const auth = await initAuth();
        return auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        const auth = await initAuth();
        return auth.handler(request);
      },
    },
  },
});
