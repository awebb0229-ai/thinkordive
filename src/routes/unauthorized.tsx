import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-500 mb-4">
          You don't have permission to access this page.
        </p>
      </div>
    </div>
  );
}
