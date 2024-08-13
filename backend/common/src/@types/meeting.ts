export type Meeting = {
  id: string;
  alertId: string;
  capturePipelineArn: string;
  concatPipelineArn: string;
  createdAt: string;
  concatenatedAt?: string;
  summarizedAt?: string;
};
