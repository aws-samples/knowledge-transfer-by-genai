import { S3Handler } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  StartTranscriptionJobCommandInput,
} from "@aws-sdk/client-transcribe";

const { TRANSCRIBE_BUCKET_NAME } = process.env;

const s3 = new S3Client({ region: process.env.AWS_REGION });
const transcribe = new TranscribeClient({ region: process.env.AWS_REGION });

export const handler: S3Handler = async (event) => {
  const promises = event.Records.map(async (record) => {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const transcriptionJobName = `transcription-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const params: StartTranscriptionJobCommandInput = {
      TranscriptionJobName: transcriptionJobName,
      LanguageCode: "ja-JP",
      Media: {
        MediaFileUri: `s3://${bucket}/${key}`,
      },
      OutputBucketName: TRANSCRIBE_BUCKET_NAME,
      OutputKey: key,
    };

    try {
      await transcribe.send(new StartTranscriptionJobCommand(params));
      console.log(`Started transcription job for file ${key}`);
    } catch (error) {
      console.error(`Error starting transcription job: ${error}`);
    }
  });

  await Promise.all(promises);
};
