import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LuPhone, LuPhoneOff } from "react-icons/lu";
import useChime, { Attendee } from "@/features/video-call/hooks/useChime";
import { OnMeetingMessageReceivedSubscription } from "@/features/video-call/graphql-api";

type Props = {
  myName: string;
};

function ChimeCalleeDialog(props: Props) {
  /**
   * Callee dialog component
   */
  const {
    open: openChime,
    isOpenRing,
    openRing,
    closeRing,
    setAttendees,
    meetingInfo,
    setMeetingInfo,
    sendMessage,
    subscribeMessage,
    getEmail,
  } = useChime();

  // setAttendees でグローバルステートに保存すると ChimeDialog で join が実行され会議参加が開始するため、attendee の一時的なストア先として利用
  const [caller, setCaller] = useState<Attendee | null>(null);

  const { myName } = props;

  // 会議の開始・終了通知を受け取る
  useEffect(() => {
    if (myName) {
      const subscriber = subscribeMessage(myName, receiveMessage);
      return () => {
        subscriber.unsubscribe();
      };
    }
  }, [myName]);

  const onClickCallOn = () => {
    setAttendees([caller!]);
    openChime();
    closeRing();
  };

  const onClickCallOff = () => {
    // 会議招集を拒否したことを通知する
    sendMessage({
      myName,
      targetId: caller!.id,
      state: "MEETING_END",
      meetingInfo: JSON.stringify(meetingInfo),
    });
    closeRing();
    setCaller(null);
  };

  // 他の参加者からの会議開始・終了通知を受け取る
  const receiveMessage = async (
    response: OnMeetingMessageReceivedSubscription
  ) => {
    const state = response.onMeetingMessageReceived?.state;
    if (state === "MEETING_START") {
      const callerId = response.onMeetingMessageReceived!.source;
      const callerEmail = await getEmail(callerId);
      setCaller({
        id: response.onMeetingMessageReceived!.source,
        name: callerEmail ?? "",
      });
      setMeetingInfo(
        JSON.parse(response.onMeetingMessageReceived!.meetingInfo)
      );
      openRing();
    } else if (state === "MEETING_END") {
      closeRing();
    }
  };

  return (
    <Dialog open={isOpenRing} onOpenChange={onClickCallOff}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>着信中</DialogTitle>
          <DialogDescription>{caller?.name}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex h-12 w-full justify-center space-x-6">
            <Button
              variant="ghost"
              size="icon"
              className="size-12 rounded-full bg-green-700 text-white"
              onClick={onClickCallOn}
            >
              <LuPhone size="20" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              className="size-12 rounded-full bg-rose-700 text-white"
              onClick={onClickCallOff}
            >
              <LuPhoneOff size="20" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default ChimeCalleeDialog;
