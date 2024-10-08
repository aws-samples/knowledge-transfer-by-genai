import {
  Link,
  // Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthUser } from "aws-amplify/auth";

interface RouterContext {
  signOut: () => void;
  user: AuthUser | undefined;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // component: RootComponent,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    );
  },
});

// // For debug purpose
// function RootComponent() {
//   return (
//     <>
//       <div className="p-2 flex gap-2 text-lg border-b">
//         <Link
//           to="/"
//           activeProps={{
//             className: "font-bold",
//           }}
//           activeOptions={{ exact: true }}
//         >
//           Home
//         </Link>{" "}
//         <Link
//           to={"/alerts"}
//           activeProps={{
//             className: "font-bold",
//           }}
//         >
//           Alerts
//         </Link>{" "}
//       </div>
//       <hr />
//       <Outlet />
//       {/* Start rendering router matches */}
//       <TanStackRouterDevtools position="bottom-right" />
//     </>
//   );
// }
