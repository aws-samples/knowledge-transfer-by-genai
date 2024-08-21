import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TbMovie } from "react-icons/tb";
import { FaDownload } from "react-icons/fa";
import ReactPlayer from "react-player";

import { Meeting } from "@/types/meeting";
import { cn } from "@/lib/utils";
import { useState } from "react";
import useMeeting from "@/features/video-call/hooks/useMeeting";
import { useTranslation } from "react-i18next";

type Props = {
  meeting: Meeting;
  alertId: string;
  inverted?: boolean;
};

function MeetingVideoDialog({ meeting, alertId, inverted = false }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { getMeetingVideoUrl, getSummarizedTranscriptUrl } =
    useMeeting(alertId);

  const isDisabled = !meeting.isConcatenated;

  const { meetingVideoUrl } = getMeetingVideoUrl(meeting.id);
  const { summarizedTranscriptUrl } = getSummarizedTranscriptUrl(meeting.id);

  const handleOpen = async () => {
    if (meeting.isConcatenated && !meetingVideoUrl) {
      setOpen(true);
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <DialogTrigger asChild onClick={handleOpen}>
                <TbMovie
                  size="25"
                  className={cn(
                    "cursor-pointer",
                    isDisabled
                      ? cn(
                          "pointer-events-none",
                          inverted ? "text-foreground" : "text-muted-foreground"
                        )
                      : inverted
                        ? "text-background"
                        : "text-foreground"
                  )}
                />
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              通話日時: {new Date(meeting.createdAt).toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DialogContent
          className={cn(
            "border-2 border-slate-300 bg-slate-800 text-white"
            // "grid-rows-[32px,1fr,48px] min-h-[416px]"
          )}
        >
          <DialogHeader className="h-8">{t("meetingVideo.title")}</DialogHeader>
          <div className="mb-4">
            <p>作成日時: {new Date(meeting.createdAt).toLocaleString()}</p>
            <p>
              ステータス:{" "}
              {meeting.status === "Saving"
                ? "保存中"
                : meeting.status === "Summarizing"
                  ? "要約中"
                  : "完了"}
            </p>
          </div>
          {meetingVideoUrl ? (
            <ReactPlayer
              url={meetingVideoUrl}
              controls
              width="100%"
              height="100%"
            />
          ) : (
            <p>Loading video...</p>
          )}
          {meeting.isSummarized && summarizedTranscriptUrl && (
            <div className="my-1 border-t pt-1 italic">
              <div
                className="ml-1 cursor-pointer underline flex items-center"
                onClick={() => {
                  window.open(summarizedTranscriptUrl, "_blank");
                }}
              >
                <FaDownload
                  size="15"
                  className={cn(
                    "cursor-pointer mr-2",
                    isDisabled
                      ? cn("pointer-events-none", "text-foreground")
                      : "text-background"
                  )}
                ></FaDownload>
                通話記録の要約
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MeetingVideoDialog;
