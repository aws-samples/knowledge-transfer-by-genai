import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import useChime from "@/features/video-call/hooks/useChime";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog-expandable";
import {
  LuMic,
  LuMicOff,
  LuVideo,
  LuVideoOff,
  LuPhoneOff,
} from "react-icons/lu";
import { TbBlur, TbBlurOff } from "react-icons/tb";
import {
  useMeetingManager,
  useLocalVideo,
  useToggleLocalMute,
  VideoTileGrid,
} from "amazon-chime-sdk-component-library-react";
import { useBackgroundBlurToggle } from "@/features/video-call/hooks/useBackgroundBlurToggle";

type Props = {
  myName: string;
};

function ChimeDialog(props: Props) {
  const { isOpen, close, attendees, meetingInfo, disconnect, sendMessage } =
    useChime();

  const [minimize, setMinimize] = useState(false);

  const meetingManager = useMeetingManager();
  const { isBlurred, toggleBlur } = useBackgroundBlurToggle();
  const { toggleVideo, isVideoEnabled } = useLocalVideo();
  const { toggleMute, muted } = useToggleLocalMute();

  const { myName } = props;

  useEffect(() => {
    if (!isOpen) {
      meetingManager.leave();
    }
  }, [isOpen, meetingManager]);

  // Make sure the dialog does not close when you click outside the dialog
  const onInteractOutside = (e: Event) => {
    e.preventDefault();
  };

  const onClickEndCall = async () => {
    disconnect();
    // Notify other participants that the meeting has ended
    sendMessage({
      myName,
      targetId: attendees[0].id,
      state: "MEETING_END",
      meetingInfo: JSON.stringify(meetingInfo),
    });
    close();
  };

  const gridClass = minimize ? "" : "grid-rows-[32px,1fr,48px] min-h-[416px]";

  return (
    <Dialog open={isOpen} modal={false}>
      <DialogContent
        collapsecallback={setMinimize}
        className={cn(
          "border-2 border-slate-300 bg-slate-800 text-white",
          gridClass
        )}
        onInteractOutside={onInteractOutside}
      >
        {!meetingInfo ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-lg">会議部屋を作成しています...</p>
          </div>
        ) : (
          <>
            {!minimize && <DialogHeader className="h-8">通話中</DialogHeader>}
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
                  className="size-12 rounded-full bg-white text-black"
                  onClick={toggleMute}
                >
                  {!muted ? <LuMic size="20" /> : <LuMicOff size="20" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  className="size-12 rounded-full bg-white text-black"
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
                  className="size-12 rounded-full bg-rose-700 text-white"
                  onClick={onClickEndCall}
                >
                  <LuPhoneOff size="20" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-12 rounded-full bg-white text-black"
                  onClick={toggleBlur}
                >
                  {isBlurred ? <TbBlurOff size="20" /> : <TbBlur size="20" />}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
export default ChimeDialog;
