import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AiOutlineAlert } from "react-icons/ai";
import useAlert from "@/features/alert/hooks/useAlert";

function AlertManagementButton() {
  const { createDummyAlert, clearAlerts } = useAlert();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 px-0 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
        >
          <AiOutlineAlert className="size-[1.2rem]" />
          <span className="sr-only">Manage alerts</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={createDummyAlert}>
          ダミーアラートを作成する
        </DropdownMenuItem>
        <DropdownMenuItem onClick={clearAlerts}>
          すべてのアラートを削除する
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AlertManagementButton;
