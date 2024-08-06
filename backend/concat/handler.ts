// lambda/index.ts
import {
  ChimeSDKMediaPipelinesClient,
  CreateMediaConcatenationPipelineCommand,
} from "@aws-sdk/client-chime-sdk-media-pipelines";

exports.handler = async (event: any) => {
  console.log("Chime Meeting Delete Event:", JSON.stringify(event, null, 2));

  // const client = new ChimeSDKMediaPipelinesClient({
  //   // region: process.env.REGION,
  //   region: "us-east-1",
  // });

  // const command = new CreateMediaConcatenationPipelineCommand({
  //   Sources: [
  //     {
  //       Type: "MediaCapturePipeline",
  //       MediaCapturePipelineSourceConfiguration: {
  //         MediaPipelineArn:
  //           "arn:aws:chime:us-east-1:111122223333:media-pipeline/87654321-4321-4321-1234-111122223333",
  //         ChimeSdkMeetingConfiguration: {
  //           ArtifactsConfiguration: {
  //             Audio: { State: "Enabled" },
  //             Video: { State: "Enabled" },
  //             Content: { State: "Enabled" },
  //             DataChannel: { State: "Enabled" },
  //             TranscriptionMessages: { State: "Enabled" },
  //             MeetingEvents: { State: "Enabled" },
  //             CompositedVideo: { State: "Enabled" },
  //           },
  //         },
  //       },
  //     },
  //   ],
  //   Sinks: [
  //     {
  //       Type: "S3Bucket",
  //       S3BucketSinkConfiguration: {
  //         Destination: "s3://your-bucket-name/concatenated-media",
  //       },
  //     },
  //   ],
  // });

  // try {
  //   const response = await client.send(command);
  //   console.log("Media Concatenation Pipeline Created:", response);
  // } catch (error) {
  //   console.error("Error creating Media Concatenation Pipeline:", error);
  // }
};
