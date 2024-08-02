import { useEffect, useState } from "react";

import { Link, useLocation } from "@tanstack/react-router";
import { fetchUserAttributes } from "aws-amplify/auth";
import ThemeButton from "./ThemeButton";
import LanguageButton from "./LanguageButton";
import SettingsButton from "./SettingsButton";

export interface HeaderProps {
  signOut?: () => void;
  userName: string;
}

function Header({ signOut, userName }: HeaderProps) {
  const location = useLocation();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (signOut) {
      loadUserAttributes();
    }
  }, [signOut]);

  const loadUserAttributes = async () => {
    const userAttributes = await fetchUserAttributes();
    setEmail(userAttributes.email ?? "");
  };

  // breadcrumb for alert detail page
  let alertId = "";
  if (location.pathname.includes("/alert")) {
    alertId = location.pathname.split("/")[2];
  }

  return (
    <div className="container flex h-12 min-w-full items-center justify-end border-b border-border/40 bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="grid flex-1 grid-cols-[auto,3rem,3rem,3rem]">
        <div className="flex items-center">
          {alertId && (
            <div className="space-x-2">
              <Link to="/alerts" className="underline-offset-4 hover:underline">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-md font-semibold">Alert ID: {alertId}</span>
            </div>
          )}
          {!alertId && <h3 className="text-lg font-semibold">Dashboard</h3>}
        </div>
        <LanguageButton />
        <ThemeButton />
      </div>
      {signOut && (
        <SettingsButton signOut={signOut} userName={userName} email={email} />
      )}
    </div>
  );
}

export default Header;
