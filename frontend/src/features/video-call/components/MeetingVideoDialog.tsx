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
import ReactPlayer from "react-player";

import { Meeting } from "@/types/meeting";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Props = {
  meeting: Meeting;
};

function MeetingVideoDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const { meeting } = props;
  const videoUrl = `${window.location.origin}/video/${meeting.id}/composited-video/${meeting.concatPipelineId}.mp4`;
  console.log("Video URL: ", videoUrl);

  const isDisabled = !meeting.isConcatenated;

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <DialogTrigger asChild>
                <TbMovie
                  size="25"
                  className={cn(
                    "cursor-pointer",
                    isDisabled
                      ? "pointer-events-none text-gray-400"
                      : "text-black"
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
            "border-2 border-slate-300 bg-slate-800 text-white",
            "grid-rows-[32px,1fr,48px] min-h-[416px]"
          )}
        >
          <DialogHeader className="h-8">Meeting Video</DialogHeader>
          <ReactPlayer url={videoUrl} controls width="100%" height="100%" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MeetingVideoDialog;
