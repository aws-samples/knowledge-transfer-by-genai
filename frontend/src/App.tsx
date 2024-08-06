import ChimeDialogProvider from "@/features/video-call/components/ChimeDialogProvider";
import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { useTranslation } from "react-i18next";

const router = createRouter({
  routeTree: routeTree,
  context: { signOut: () => {}, user: undefined },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: import.meta.env.VITE_APP_USER_POOL_CLIENT_ID,
      userPoolId: import.meta.env.VITE_APP_USER_POOL_ID,
    },
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APP_CHIME_BACKEND,
      region: import.meta.env.VITE_APP_REGION,
      defaultAuthMode: "userPool",
    },
  },
});

function App() {
  const { t } = useTranslation();
  return (
    <Authenticator
      components={{
        Header: () => (
          <div className="text-aws-font-color mb-5 mt-10 flex justify-center text-3xl">
            {t("app.title")}
          </div>
        ),
      }}
    >
      {({ signOut, user }) => (
        <>
          <ChimeDialogProvider myName={user?.username ?? ""}>
            <RouterProvider router={router} context={{ signOut, user }} />;
          </ChimeDialogProvider>
        </>
      )}
    </Authenticator>
  );
}

export default App;
