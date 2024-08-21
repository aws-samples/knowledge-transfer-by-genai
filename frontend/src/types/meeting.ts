export type MeetingResponse = {
  id: string;
  alertId: string;
  capturePipelineArn: string;
  concatPipelineArn: string;
  createdAt: string;
  concatenatedAt?: string;
  summarizedAt?: string;
};

export type Meeting = MeetingResponse & {
  capturePipelineId: string;
  concatPipelineId: string;
  isConcatenated: boolean;
  isSummarized: boolean;
  status: VideoStatus;
};

export type VideoStatus = "Saving" | "Summarizing" | "Completed";
