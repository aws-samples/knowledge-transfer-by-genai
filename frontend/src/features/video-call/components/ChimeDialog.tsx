import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import useChime from "@/features/video-call/hooks/useChime";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog-expandable";
import {
  LuMic,
  LuMicOff,
  LuVideo,
  LuVideoOff,
  //  LuPhone,
  LuPhoneOff,
} from "react-icons/lu";
import { MeetingSessionConfiguration } from "amazon-chime-sdk-js";
import {
  useMeetingManager,
  useLocalVideo,
  useToggleLocalMute,
  VideoTileGrid,
} from "amazon-chime-sdk-component-library-react";
import { OnMeetingMessageReceivedSubscription } from "@/features/video-call/graphql-api";

type Props = {
  myName: string;
  alertId: string;
};

function ChimeDialog(props: Props) {
  // ダイアログの状態は useChime hook でグローバルに管理
  const {
    open,
    isOpen,
    close,
    attendees,
    meetingInfo,
    setMeetingInfo,
    createAndJoin,
    join,
    disconnect,
    sendMessage,
    subscribeMessage,
  } = useChime();

  const [minimize, setMinimize] = useState(false);

  const meetingManager = useMeetingManager();
  const { toggleVideo, isVideoEnabled } = useLocalVideo();
  const { toggleMute, muted } = useToggleLocalMute();

  const { myName, alertId } = props;

  // 会議の終了通知を受け取る
  useEffect(() => {
    if (myName) {
      const subscriber = subscribeMessage(myName, receiveMessage);
      return () => {
        subscriber.unsubscribe();
      };
    }
  }, [myName]);

  // 参加者が登録されたら会議を開始または参加する
  useEffect(() => {
    //TODO: add new attendee to chime meeting
    if (attendees.length > 0) {
      initiateMeeting();
    }
  }, [attendees]);

  useEffect(() => {
    if (!isOpen) {
      meetingManager.leave();
    }
  }, [isOpen]);

  // ダイアログ外をクリックしてもダイアログを閉じないようにする
  const onInteractOutside = (e: Event) => {
    e.preventDefault();
  };

  // dialog-expandable で Close ボタンを削除したため、このメソッドは呼ばれることはない
  const onOpenChange = (isopen: boolean) => {
    if (isopen) {
      open();
    } else {
      close();
    }
  };

  const onClickEndCall = async () => {
    disconnect();
    // 会議終了を他の参加者に通知する
    sendMessage({
      myName,
      targetId: attendees[0].id,
      state: "MEETING_END",
      meetingInfo: JSON.stringify(meetingInfo),
    });
    close();
  };

  // 会議の作成と参加、または招集された会議への参加を開始する
  const initiateMeeting = async (): Promise<void> => {
    if (!meetingInfo) {
      // 会議の作成・参加を開始する
      const { meeting, attendee } = await createAndJoin(alertId);
      const meetingSessionConfiguration = new MeetingSessionConfiguration(
        meeting,
        attendee
      );
      await meetingManager.join(meetingSessionConfiguration);
      await meetingManager.start();
      setMeetingInfo(meeting);

      // 他の参加者に会議を通知する
      sendMessage({
        myName,
        targetId: attendees[0].id,
        state: "MEETING_START",
        meetingInfo: JSON.stringify(meeting),
      });
    } else {
      // 招集された会議への参加を開始する
      const { meeting, attendee } = await join();
      const meetingSessionConfiguration = new MeetingSessionConfiguration(
        meeting,
        attendee
      );
      await meetingManager.join(meetingSessionConfiguration);
      await meetingManager.start();
    }
  };

  // 他の参加者からの会議終了通知を受け取る
  const receiveMessage = (response: OnMeetingMessageReceivedSubscription) => {
    if (response.onMeetingMessageReceived?.state === "MEETING_END") {
      close();
    }
  };

  const gridClass = minimize ? "" : "grid-rows-[32px,1fr,48px] min-h-[416px]";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        collapsecallback={setMinimize}
        className={cn(
          "border-2 border-slate-300 bg-slate-800 text-white",
          gridClass
        )}
        onInteractOutside={onInteractOutside}
      >
        {!minimize && (
          <DialogHeader className="h-8">
            <DialogTitle>通話中</DialogTitle>
          </DialogHeader>
        )}
        {!minimize && (
          <div className="flex min-h-64">
            <VideoTileGrid />
          </div>
        )}
        <DialogFooter>
          <div className="flex h-12 w-full justify-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-white text-black"
              onClick={toggleMute}
            >
              {!muted ? <LuMic size="20" /> : <LuMicOff size="20" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              className="h-12 w-12 rounded-full bg-white text-black"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? (
                <LuVideo size="20" />
              ) : (
                <LuVideoOff size="20" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              className="h-12 w-12 rounded-full bg-rose-700 text-white"
              onClick={onClickEndCall}
            >
              <LuPhoneOff size="20" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default ChimeDialog;
