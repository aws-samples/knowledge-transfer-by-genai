import {
  ChimeSDKMediaPipelinesClient,
  CreateMediaCapturePipelineCommand,
  CreateMediaCapturePipelineCommandInput,
  MediaCapturePipeline,
  CreateMediaConcatenationPipelineCommand,
  MediaConcatenationPipeline,
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

export const createConcat = async (props: {
  capturePipelineArn: string;
  destination: string;
}): Promise<MediaConcatenationPipeline | null> => {
  const command = new CreateMediaConcatenationPipelineCommand({
    Sources: [
      {
        Type: "MediaCapturePipeline",
        MediaCapturePipelineSourceConfiguration: {
          MediaPipelineArn: props.capturePipelineArn,
          ChimeSdkMeetingConfiguration: {
            ArtifactsConfiguration: {
              Audio: { State: "Enabled" },
              Video: { State: "Enabled" },
              Content: { State: "Enabled" },
              DataChannel: { State: "Enabled" },
              TranscriptionMessages: { State: "Enabled" },
              MeetingEvents: { State: "Enabled" },
              CompositedVideo: { State: "Enabled" },
            },
          },
        },
      },
    ],
    Sinks: [
      {
        Type: "S3Bucket",
        S3BucketSinkConfiguration: {
          // Destination: `${CONCATENATED_BUCKET_ARN}/${meetingId}`,
          // Destination: CONCATENATED_BUCKET_ARN,
          // Destination: "arn:aws:s3:::tksuzuki-us-east-1",
          Destination: props.destination,
        },
      },
    ],
  });
  console.debug("Concat Command:", JSON.stringify(command, null, 2));

  try {
    const response = await pipelinesClient.send(command);
    console.log("Media Concatenation Pipeline Created:", response);
    return response.MediaConcatenationPipeline ?? null;
  } catch (error) {
    console.error("Error creating Media Concatenation Pipeline:", error);
    throw new Error("Error creating Media Concatenation Pipeline");
  }
};
