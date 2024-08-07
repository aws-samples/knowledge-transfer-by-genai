import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const { KNOWLEDGE_BUCKET_NAME, BEDROCK_REGION } = process.env;

const s3Client = new S3Client({});
const bedrockClient = new BedrockRuntimeClient({ region: BEDROCK_REGION });

const SUMMARY_INSTRUCTIONS = `
Your task is list Key Stakeholders and highlight Key Discussion Points 
and list Decisions and outline Action Items and provide meeting notes 
and create a concise summary.`;

const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID;

export const invokeBedrockModel = async (event) => {
  let result: any = { status: "FAILED" };

  const transcriptUri =
    event.TranscriptionJob.TranscriptionJob.Transcript.TranscriptFileUri;

  const bucketName = transcriptUri.split("/")[3];
  const fileName = `${transcriptUri.split("/").slice(-2).join("/")}`;

  try {
    // Download the file from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const fileObject = await s3Client.send(getObjectCommand);
    const data = JSON.parse(await fileObject.Body!.transformToString());

    // Get the transcript
    const transcript = JSON.stringify(data.results.transcripts[0].transcript);

    console.debug(`transcript: ${transcript}`);

    // Create the payload for the Anthropic model
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: `${SUMMARY_INSTRUCTIONS} ${transcript}` },
        ],
      },
    ];

    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      messages: messages,
      temperature: 0,
      top_p: 1,
    });

    console.log(`Invoking model: ${BEDROCK_MODEL_ID}`);

    const invokeModelCommand = new InvokeModelCommand({
      body,
      modelId: BEDROCK_MODEL_ID,
    });
    const response = await bedrockClient.send(invokeModelCommand);

    console.log(`bedrock response: ${JSON.stringify(response)}`);

    // Save the response value
    const assistantResponse = JSON.parse(Buffer.from(response.body).toString());
    console.log(`assistantResponse: ${JSON.stringify(assistantResponse)}`);

    const summaryFileName = `${event.Source.Payload.MeetingId}/${event.Source.Payload.SourceFileName}-summary.txt`;
    console.log(`summaryFileName: ${summaryFileName}`);

    // Save the response value in S3
    const putObjectCommand = new PutObjectCommand({
      Bucket: KNOWLEDGE_BUCKET_NAME,
      Key: summaryFileName,
      Body: assistantResponse.content[0].text,
      ContentType: "text/plain",
    });
    await s3Client.send(putObjectCommand);

    result = {
      bucketName: KNOWLEDGE_BUCKET_NAME,
      summaryKeyName: summaryFileName,
      status: "SUCCEEDED",
    };
  } catch (e) {
    console.error(`Error: ${e}`);
    throw e;
  }

  console.log(`result: ${JSON.stringify(result)}`);

  return result;
};
