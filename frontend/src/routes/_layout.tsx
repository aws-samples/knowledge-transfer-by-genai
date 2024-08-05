import Header from "@/components/header/Header";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AuthUser } from "aws-amplify/auth";

let signOut: () => void;
let user: AuthUser | undefined;

export const Route = createFileRoute("/_layout")({
  loader: ({ context }) => {
    signOut = context.signOut;
    user = context.user;
  },
  component: () => {
    return <LayoutComponent signOut={signOut} user={user}></LayoutComponent>;
  },
});

type ComponentProps = {
  signOut: () => void;
  user: AuthUser | undefined;
};

function LayoutComponent(props: ComponentProps) {
  signOut = props.signOut;
  user = props.user;
  return (
    <div className="p-2">
      <header>
        <Header signOut={signOut} userName={user?.username!} />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
