import { createFileRoute, redirect } from "@tanstack/react-router";

// Define the route with a redirect
export const Route = createFileRoute("/")({
  component: Home,
  loader: () => {
    return redirect({ to: "/alerts" });
  },
});

function Home() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  );
}
