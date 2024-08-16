import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
// import useAlerts from "@/hooks/useAlert";
import { LuMoreVertical } from "react-icons/lu";

export interface SettingsButtonProps {
  signOut?: () => void;
  userName: string;
  email: string;
}

function SettingsButton({ signOut, userName, email }: SettingsButtonProps) {
  //   const { deleteAlerts } = useAlerts();

  //   const deleteAll = () => {
  //     if (window.confirm("Are you sure you want to delete all alerts?")) {
  //       deleteAlerts();
  //     }
  //   };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 px-0 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
        >
          <LuMoreVertical className="size-[1.2rem]" />
          <span className="sr-only">Toggle settings</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="font-medium">{userName}</div>
          <div className="text-sm font-normal text-muted-foreground">
            {email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* <DropdownMenuItem onClick={deleteAll} className="text-red-500">
          Delete alerts
        </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SettingsButton;
