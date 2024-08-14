import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { updateMeeting } from "@industrial-knowledge-transfer-by-genai/common";

const { CONCATENATED_BUCKET_NAME } = process.env;

const s3Client = new S3Client();

const checkIfObjectExists = async (
  bucketName: string,
  key: string
): Promise<boolean> => {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    if (error.name === "NotFound") {
      console.log(`Object not found at ${bucketName}/${key}`);
      return false;
    } else {
      console.error(`Error checking S3 object: ${error.message}`);
      throw error;
    }
  }
};

export const prepareInput = async (event: any) => {
  console.log("Chime Event:", JSON.stringify(event, null, 2));
  /**Example event:
   * 2024-08-07T03:07:17.853Z	6b1e4a66-92dd-4378-90ea-943616baa1d8	INFO	Chime Event: {
    "version": "0",
    "id": "482cc26c-e10f-8471-a03a-417ce1b7cb91",
    "detail-type": "Chime Media Pipeline State Change",
    "source": "aws.chime",
    "account": "151364017355",
    "time": "2024-08-07T03:07:17Z",
    "region": "us-east-1",
    "resources": [],
    "detail": {
        "version": "0",
        "eventType": "chime:MediaPipelineDeleted",
        "timestamp": 1723000036853,
        "meetingId": "4b14cf17-72dc-47aa-9e8d-263413992713",
        "externalMeetingId": "d960c834-d51f-4e4f-97f5-e16cac30008c",
        "mediaPipelineId": "ecf06ff9-d0af-449f-a520-550b8b4c341b",
        "mediaRegion": "ap-northeast-1"
    }
}
   */
  const meetingId = event.detail.meetingId;
  const mediaPipelineId = event.detail.mediaPipelineId;
  // Add `video` prefix so that can set CloudFront behavior
  const key = `video/${meetingId}/composited-video/${mediaPipelineId}.mp4`;

  // Note: Both Capture pipeline and Concatenation pipeline send the same event structure.
  // If exists, which means the event is from the Concatenation pipeline
  const ifExists = await checkIfObjectExists(CONCATENATED_BUCKET_NAME!, key);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (!ifExists) {
    // Return with `IsEventConcatenatedMediaPipeline` set to false
    return {
      MeetingId: meetingId,
      // S3Uri: `s3://${CONCATENATED_BUCKET_NAME}/video/${meetingId}/composited-video/${mediaPipelineId}.mp4`,
      S3Uri: `s3://${CONCATENATED_BUCKET_NAME}/${key}`,
      IsEventConcatenatedMediaPipeline: false,
      SourceBucketName: CONCATENATED_BUCKET_NAME,
      SourceKeyName: `${meetingId}/composited-video/${mediaPipelineId}.mp4`,
      SourceFileName: `${mediaPipelineId}.mp4`,
      SourceFileNameWithDate: `${mediaPipelineId}-${timestamp}.mp4`,
    };
  }

  await updateMeeting(meetingId, {
    concatenatedAt: timestamp,
  });

  return {
    MeetingId: meetingId,
    // S3Uri: `s3://${CONCATENATED_BUCKET_NAME}/video/${meetingId}/composited-video/${mediaPipelineId}.mp4`,
    S3Uri: `s3://${CONCATENATED_BUCKET_NAME}/${key}`,
    IsEventConcatenatedMediaPipeline: true,
    SourceBucketName: CONCATENATED_BUCKET_NAME,
    SourceKeyName: `${meetingId}/composited-video/${mediaPipelineId}.mp4`,
    SourceFileName: `${mediaPipelineId}.mp4`,
    SourceFileNameWithDate: `${mediaPipelineId}-${timestamp}.mp4`,
  };
};