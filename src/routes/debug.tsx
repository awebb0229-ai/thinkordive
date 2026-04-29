import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/auth/auth-client";
import { authMiddleware } from "@/middleware/auth";

export const Route = createFileRoute("/debug")({
  component: RouteComponent,
  server: {
    middleware: [authMiddleware],
  },
});

function RouteComponent() {
  const { data: sessionData, isPending } = authClient.useSession();
  if (isPending) {
    return <div className="p-8">Loading...</div>;
  }

  if (!sessionData) {
    return <div className="p-8">Session Data is null</div>;
  }

  return (
    <div>
      <div>Hello "/debug"!</div>
      <pre>{JSON.stringify(sessionData.user, null, 2)}</pre>
      <pre>{JSON.stringify(sessionData.session, null, 2)}</pre>
    </div>
  );
}
