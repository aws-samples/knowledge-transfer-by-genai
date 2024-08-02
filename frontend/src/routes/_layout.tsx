import Header from "@/components/header/Header";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div className="p-2">
      <header>
        <Header signOut={() => {}} userName={"test"} />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
