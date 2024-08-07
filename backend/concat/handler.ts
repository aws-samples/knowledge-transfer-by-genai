import {
  ChimeSDKMediaPipelinesClient,
  CreateMediaConcatenationPipelineCommand,
} from "@aws-sdk/client-chime-sdk-media-pipelines";
import { findMeetingById } from "@industrial-knowledge-transfer-by-genai/common";

const { CONCATENATED_BUCKET_ARN } = process.env;

exports.handler = async (event: any) => {
  console.log("Chime Meeting Delete Event:", JSON.stringify(event, null, 2));
  /**Example event:
   * {
    "version": "0",
    "id": "060047bc-f58c-cba2-be52-afda7ceeb1e7",
    "detail-type": "Chime Meeting State Change",
    "source": "aws.chime",
    "account": "151364017355",
    "time": "2024-08-06T14:15:34Z",
    "region": "us-east-1",
    "resources": [],
    "detail": {
        "version": "0",
        "eventType": "chime:MeetingEnded",
        "timestamp": 1722953732569,
        "meetingId": "1c92fc0e-5210-4b4a-b661-261934f22713",
        "externalMeetingId": "0695a9a6-dfd1-4af8-a66c-564d169a2328",
        "mediaRegion": "ap-northeast-1"
    }
}
   */

  const meetingId = event.detail.meetingId;
  const meeting = await findMeetingById(meetingId);

  const client = new ChimeSDKMediaPipelinesClient({
    // Media pipelines are available in us-east-1
    region: "us-east-1",
  });

  const command = new CreateMediaConcatenationPipelineCommand({
    Sources: [
      {
        Type: "MediaCapturePipeline",
        MediaCapturePipelineSourceConfiguration: {
          MediaPipelineArn: meeting.mediaPipelineArn,
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
          Destination: "arn:aws:s3:::tksuzuki-us-east-1",
        },
      },
    ],
  });

  console.debug("Command:", JSON.stringify(command, null, 2));

  try {
    const response = await client.send(command);
    console.log("Media Concatenation Pipeline Created:", response);
  } catch (error) {
    console.error("Error creating Media Concatenation Pipeline:", error);
  }
};
