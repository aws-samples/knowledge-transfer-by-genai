import {
  ChimeSDKMediaPipelinesClient,
  CreateMediaCapturePipelineCommand,
  CreateMediaCapturePipelineCommandInput,
  MediaCapturePipeline,
} from "@aws-sdk/client-chime-sdk-media-pipelines";

const pipelinesClient = new ChimeSDKMediaPipelinesClient({
  // The data storage of live transcription is not properly done, so the control region is set to us-east-1.
  // Related issue: https://github.com/aws/aws-cli/issues/8199
  region: "us-east-1",
});

export const startCapture = async (props: {
  meetingId: string;
  destination: string;
  accountId: string;
}): Promise<MediaCapturePipeline | null> => {
  const { meetingId, destination, accountId } = props;
  try {
    const request: CreateMediaCapturePipelineCommandInput = {
      ChimeSdkMeetingConfiguration: {
        ArtifactsConfiguration: {
          //Audio: { MuxType: 'AudioOnly' },
          Audio: { MuxType: "AudioWithCompositedVideo" },
          CompositedVideo: {
            GridViewConfiguration: {
              ContentShareLayout: "PresenterOnly",
            },
            Layout: "GridView",
            Resolution: "FHD",
          },
          Content: { State: "Disabled" },
          Video: { State: "Disabled" },
        },
      },
      SourceType: "ChimeSdkMeeting",
      SourceArn: `arn:aws:chime::${accountId}:meeting:${meetingId}`,
      SinkType: "S3Bucket",
      SinkArn: destination,
    };

    const input = new CreateMediaCapturePipelineCommand(request);
    const output = await pipelinesClient.send(input);
    const pipelineInfo = output.MediaCapturePipeline;
    console.debug("startCapture is completed.", { pipelineInfo });
    return pipelineInfo ?? null;
  } catch (error: any) {
    console.error("startCapture is failed.", { error });
    throw new Error("startCapture is failed.");
  }
};
