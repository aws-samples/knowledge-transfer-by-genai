import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LuChevronsUpDown } from "react-icons/lu";
import useChime from "@/features/video-call/hooks/useChime";
import { generateClient } from "aws-amplify/api";
import { getCognitoId } from "@/features/video-call/graphql/queries";
import { getCurrentUser } from "aws-amplify/auth";
import { useTranslation } from "react-i18next";

type User = {
  id: string;
  name: string;
};

function ContactCard() {
  const { open: openChime, isOpen: isOpenChime, setAttendees } = useChime();
  const [openMenu, setOpenMenu] = useState(false);
  const [callees, setCallees] = useState<User[]>([]);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { t } = useTranslation();

  const onClickCall = () => {
    setAttendees(callees);
    openChime();
  };

  useEffect(() => {
    //TODO: add new attendee to chime meeting
    currentAuthenticatedUser();
    if (currentUserId.length !== 0) {
      getAlertAsignee();
    }
  }, [currentUserId]);

  const getAlertAsignee = async () => {
    const client = generateClient();

    const userInfos = await client.graphql({
      query: getCognitoId,
      authMode: "userPool",
    });

    const userId = userInfos?.data?.getCognitoId?.userId;
    if (typeof userId === "string") {
      const userIdNames: { id: string; name: string }[] = JSON.parse(userId);
      const filteredUserIdNames = userIdNames.filter(
        (element) => element.id !== currentUserId
      );
      console.log(filteredUserIdNames);
      setAssignees(filteredUserIdNames);
    } else {
      console.error("userId is undefined or not a string");
    }
  };

  const currentAuthenticatedUser = async () => {
    try {
      const { userId } = await getCurrentUser();
      setCurrentUserId(userId);
      console.log(`The username: ${userId}`);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Card className="my-4 px-12 py-6">
        <label className="font-semibold">コンタクト先</label>
        <p className="text-sm text-muted-foreground">ビデオ通話を開始します</p>
        <div className="mt-6 flex flex-col space-y-2 md:block md:space-x-4 md:space-y-0">
          <Popover open={openMenu} onOpenChange={setOpenMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openMenu}
                className="w-full md:w-[280px]"
              >
                <span className="flex-1 overflow-hidden text-ellipsis text-left">
                  {assignees.find(
                    (person) => callees[0] && person.id === callees[0].id
                  )?.name || t("alertDetail.contactCard.selectContact")}
                </span>
                <LuChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 md:w-[280px]">
              <Command>
                <CommandGroup className="w-[200px] md:w-[280px]">
                  {assignees.map((person) => (
                    <CommandItem
                      key={person.id}
                      value={person.id}
                      onSelect={() => {
                        setCallees([person]);
                        setOpenMenu(false);
                      }}
                    >
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {person.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button
            variant="default"
            onClick={onClickCall}
            disabled={isOpenChime || callees.length === 0}
          >
            通話する
          </Button>
        </div>
      </Card>
    </>
  );
}
export default ContactCard;
